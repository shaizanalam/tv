import { NextRequest, NextResponse } from 'next/server';

export interface RemoteCommand {
  id: string;
  seq: number;
  type:
    | 'dpad_up'
    | 'dpad_down'
    | 'dpad_left'
    | 'dpad_right'
    | 'ok'
    | 'back'
    | 'play_pause'
    | 'skip_next'
    | 'skip_prev'
    | 'switch_hub'
    | 'select_album'
    | 'cursor_move'
    | 'cursor_click';
  payload?: any;
  timestamp: number;
}

// Global monotonic sequence number and FIFO queue per pair code
let globalSeqCounter = 1;
const sessionQueues = new Map<string, RemoteCommand[]>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code') || '482917';
  const sinceSeq = parseInt(searchParams.get('seq') || '0', 10);

  const queue = sessionQueues.get(code) || [];

  // Strictly return all commands with seq > sinceSeq
  const newCommands = queue.filter(cmd => cmd.seq > sinceSeq);
  const highestSeq = queue.length > 0 ? queue[queue.length - 1].seq : sinceSeq;

  return NextResponse.json(
    {
      status: 'active',
      commands: newCommands,
      latestSeq: highestSeq,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code = '482917', command } = body as { code: string; command: Partial<RemoteCommand> };

    if (!command || !command.type) {
      return NextResponse.json({ error: 'Valid command is required' }, { status: 400 });
    }

    let queue = sessionQueues.get(code);
    if (!queue) {
      queue = [];
      sessionQueues.set(code, queue);
    }

    const stampedCommand: RemoteCommand = {
      id: Math.random().toString(36).substring(2, 9),
      seq: ++globalSeqCounter,
      type: command.type as any,
      payload: command.payload,
      timestamp: Date.now(),
    };

    queue.push(stampedCommand);

    // Keep queue trimmed to 40 items
    if (queue.length > 40) {
      queue.splice(0, queue.length - 40);
    }

    return NextResponse.json(
      { success: true, seq: stampedCommand.seq },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process command' }, { status: 500 });
  }
}

