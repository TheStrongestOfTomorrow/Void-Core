import ZAI from 'z-ai-web-dev-sdk';

export async function createChatCompletion(messages: Array<{role: string; content: string}>, options?: {temperature?: number; maxTokens?: number}) {
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are Void AI, a powerful AI assistant built on Void Code — the Assembly Language of AI. 
You are mathematically precise, dense in your responses, and capable of deep analytical thinking.
When appropriate, express ideas using mathematical notation. You can help with coding, research, 
calculations, data analysis, and complex problem-solving. Always be direct and efficient.
Use markdown formatting for code blocks and structured content.`,
      },
      ...messages,
    ],
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 4096,
  });
  return completion.choices[0]?.message?.content ?? '';
}

export async function webSearch(query: string, num?: number) {
  const zai = await ZAI.create();
  return zai.functions.invoke('web_search', { query, num: num ?? 5 });
}

export async function pageReader(url: string) {
  const zai = await ZAI.create();
  return zai.functions.invoke('page_reader', { url });
}
