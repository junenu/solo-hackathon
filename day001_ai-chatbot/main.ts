import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

const response = await client.responses.create({
  model: 'gpt-4.1',
  instructions: 'あなたはJavaScriptの専門家です。質問に答えてください。',
  input: 'JavaScriptにおいてセミコロンは省略可能ですか？',
});

console.log(response.output_text);
