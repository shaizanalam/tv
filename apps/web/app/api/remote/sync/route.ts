import { NextRequest, NextResponse } from 'next/server';

export interface RemoteCommand {
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

// In-memory sync store for active pairings & recent commands
const activeSessions = new Map<string, {
  createdAt: number;
  lastCommand: RemoteCommand | null;
  cursorPos?: { x: number; y: number };
  connectedAt?: number;
}>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code') || '482917';
  const since = parseInt(searchParams.get('since') || '0', 10);

  const session = activeSessions.get(code);

  if (!session) {
    activeSessions.set(code, {
      createdAt: Date.now(),
      lastCommand: null,
      cursorPos: { x: 50, y: 50 },
    });
    return NextResponse.json({ status: 'active', command: null });
  }

  if (session.lastCommand && session.lastCommand.timestamp > since) {
    return NextResponse.json({
      status: 'active',
      command: session.lastCommand,
    });
  }

  return NextResponse.json({ status: 'active', command: null });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code = '482917', command } = body as { code: string; command: RemoteCommand };

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    const session = activeSessions.get(code) || {
      createdAt: Date.now(),
      lastCommand: null,
      cursorPos: { x: 50, y: 50 },
    };

    session.lastCommand = {
      ...command,
      timestamp: Date.now(),
    };
    session.connectedAt = Date.now();

    activeSessions.set(code, session);

    return NextResponse.json({ success: true, timestamp: session.lastCommand.timestamp });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process command' }, { status: 500 });
  }
}
