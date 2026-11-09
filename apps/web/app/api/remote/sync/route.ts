import { NextRequest, NextResponse } from 'next/server';

export interface RemoteCommand {
  type: 'dpad_up' | 'dpad_down' | 'dpad_left' | 'dpad_right' | 'ok' | 'back' | 'play_pause' | 'skip_next' | 'skip_prev' | 'switch_hub' | 'select_album';
  payload?: any;
  timestamp: number;
}

// In-memory sync store for active pairings & recent commands
// Key: 6-digit pair code (e.g., '482917')
const activeSessions = new Map<string, {
  createdAt: number;
  lastCommand: RemoteCommand | null;
  connectedAt?: number;
}>();

// Expire old sessions after 24 hours
const SESSION_TTL_MS = 1000 * 60 * 60 * 24;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code') || '482917';
  const since = parseInt(searchParams.get('since') || '0', 10);

  const session = activeSessions.get(code);

  if (!session) {
    // Automatically register default session
    activeSessions.set(code, {
      createdAt: Date.now(),
      lastCommand: null,
    });
    return NextResponse.json({ status: 'active', command: null });
  }

  // If phone sent a command that the TV has not yet executed
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
