import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const BLOCKED_COMMANDS = [
  'rm -rf /',
  'mkfs',
  'dd if=',
  ':(){ :|:&',
  'fork bomb',
  'chmod 777 /',
  '> /dev/sda',
  'mv / /',
];

export async function POST(req: NextRequest) {
  try {
    const { command, workingDir } = await req.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { output: 'No command provided.', exitCode: 1 },
        { status: 400 }
      );
    }

    // Safety check
    if (BLOCKED_COMMANDS.some((b) => command.includes(b))) {
      return NextResponse.json({
        output: '⛔ Command blocked for safety reasons.',
        exitCode: 1,
      });
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: workingDir || '/tmp',
      timeout: 30000,
      maxBuffer: 1024 * 1024,
    });

    return NextResponse.json({
      output: stdout || stderr,
      exitCode: stderr && !stdout ? 1 : 0,
    });
  } catch (error: unknown) {
    const err = error as { stderr?: string; message?: string; code?: number };
    return NextResponse.json({
      output: err.stderr || err.message || 'Command execution failed',
      exitCode: err.code || 1,
    });
  }
}
