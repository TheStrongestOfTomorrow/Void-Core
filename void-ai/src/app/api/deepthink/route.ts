import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { createChatCompletion } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { query, depth } = await req.json();
    const zai = await ZAI.create();

    // Step 1: Generate search queries
    const searchQueriesResponse = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'Generate 3-5 search queries to research this topic thoroughly. Return ONLY the queries, one per line, no numbering or bullet points.',
        },
        { role: 'user', content: query },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const queriesText = searchQueriesResponse.choices[0]?.message?.content || query;
    const queries = queriesText
      .split('\n')
      .map((q) => q.trim())
      .filter(Boolean);

    // Step 2: Execute web searches
    const searchResults: Array<{
      name: string;
      url: string;
      snippet: string;
      host_name?: string;
    }> = [];

    for (const q of queries.slice(0, depth === 'exhaustive' ? 5 : depth === 'deep' ? 3 : 2)) {
      try {
        const result = await zai.functions.invoke('web_search', {
          query: q,
          num: 5,
        });
        if (Array.isArray(result)) {
          searchResults.push(...result);
        }
      } catch {
        // continue with other queries
      }
    }

    // Step 3: Synthesize with AI
    const maxTokens = depth === 'exhaustive' ? 8000 : depth === 'deep' ? 4000 : 2000;
    const contextStr = searchResults
      .slice(0, 10)
      .map((r, i) => `[${i + 1}] ${r.name || 'Untitled'}: ${r.snippet || 'No description'}\nURL: ${r.url || ''}`)
      .join('\n\n');

    const answer = await createChatCompletion(
      [
        {
          role: 'user',
          content: `Research Query: ${query}\n\nHere are the search results I found:\n\n${contextStr || 'No results found.'}`,
        },
      ],
      {
        temperature: 0.3,
        maxTokens,
      }
    );

    const sources = searchResults.slice(0, 10).map((r, i) => ({
      index: i + 1,
      title: r.name || 'Untitled',
      url: r.url || '',
      snippet: r.snippet || '',
      host: r.host_name || '',
    }));

    return NextResponse.json({ answer, sources, queries });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'DeepThink research failed' },
      { status: 500 }
    );
  }
}
