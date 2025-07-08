import OpenAI from 'openai';
import { Agent, AgentInputItem, run, user } from "@openai/agents";
import { createInterface } from "readline/promises";

const client = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});
if (!client.apiKey) {
  throw new Error("OPENAI_API_KEY is not set");
}

const agent = new Agent({
  name: "Chat Agent",
  instructions: "あなたはネットワーキングの専門家です。質問に答えてください。",
  model: "gpt-4.1-nano",
});
 
let chatHistory: AgentInputItem[] = [];
 
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});
 
while (true) {
  const input = await rl.question("User: ");
  if (input.toLowerCase() === "exit") {
    break;
  }
 
  chatHistory.push(user(input));
 
  const result = await run(agent, chatHistory);
  chatHistory = result.history;
 
  console.log(`AI: ${result.finalOutput}`);
}
