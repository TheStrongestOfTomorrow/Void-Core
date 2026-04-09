import { NextRequest, NextResponse } from 'next/server';
import { createChatCompletion } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const message = await createChatCompletion(messages);
    return NextResponse.json({ message });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to generate response' },
      { status: 500 }
    );
  }
}
