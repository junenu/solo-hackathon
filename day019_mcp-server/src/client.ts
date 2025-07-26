import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function main() {
  const transport = new StdioClientTransport({
    command: 'tsx',
    args: ['./src/index.ts'],
  });

  const client = new Client({
    name: 'example-client',
    version: '1.0.0',
  }, {
    capabilities: {}
  });

  await client.connect(transport);

  // List available tools
  const tools = await client.listTools();
  console.log('Available tools:', tools.tools);

  // List available resources
  const resources = await client.listResources();
  console.log('\nAvailable resources:', resources.resources);

  // Test calculate tool
  console.log('\n--- Testing calculate tool ---');
  const calcResult = await client.callTool({
    name: 'calculate',
    arguments: {
      expression: '(5 + 3) * 2',
    }
  });
  console.log('Calculate result:', calcResult.content);

  // Test uppercase tool
  console.log('\n--- Testing uppercase tool ---');
  const upperResult = await client.callTool({
    name: 'uppercase',
    arguments: {
      text: 'hello world',
    }
  });
  console.log('Uppercase result:', upperResult.content);

  // Test fetch_url tool
  console.log('\n--- Testing fetch_url tool ---');
  try {
    const fetchResult = await client.callTool({
      name: 'fetch_url',
      arguments: {
        url: 'https://api.github.com/zen',
      }
    });
    console.log('Fetch result:', fetchResult.content);
  } catch (error) {
    console.log('Fetch error (expected if offline):', error);
  }

  // Read resources
  console.log('\n--- Reading resources ---');
  const greeting = await client.readResource({ uri: 'example://greeting' });
  console.log('Greeting:', greeting.contents[0].text);

  const time = await client.readResource({ uri: 'example://time' });
  console.log('Current time:', time.contents[0].text);

  await client.close();
}

main().catch(console.error);