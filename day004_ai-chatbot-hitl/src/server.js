import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Agent, run, hostedMcpTool } from '@openai/agents';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static(join(__dirname, '../public')));

const agent = new Agent({
  name: 'AIエージェント',
  instructions: 'あなたはユーザーの質問に答え、必要に応じてツールを使用して情報を取得します。',
  tools: [
    hostedMcpTool({
      serverLabel: 'gitmcp',
      serverUrl: 'https://gitmcp.io/openai/codex',
      requireApproval: {
        never: {
          toolNames: ['search_codex_code', 'fetch_codex_documentation'],
        },
        always: {
          toolNames: ['fetch_generic_url_content'],
        },
      },
    }),
  ],
});

const conversationHistory = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  if (!conversationHistory.has(socket.id)) {
    conversationHistory.set(socket.id, []);
  }

  socket.emit('history', conversationHistory.get(socket.id));

  socket.on('message', async (message) => {
    const history = conversationHistory.get(socket.id);
    history.push({ type: 'user', content: message, timestamp: new Date() });
    
    socket.emit('message', { type: 'user', content: message });
    
    try {
      let result = await run(agent, message);
      let hasInterruptions = result.interruptions?.length > 0;
      
      while (hasInterruptions) {
        for (const interruption of result.interruptions) {
          const approvalRequest = {
            agent: interruption.agent.name,
            tool: interruption.rawItem.name,
            arguments: interruption.rawItem.arguments || interruption.rawItem.providerData?.arguments,
            interruptionId: interruption.id,
            isMcpTool: interruption.rawItem.providerData !== undefined,
            mcpServerLabel: interruption.rawItem.providerData?.serverLabel || 'unknown'
          };
          
          socket.emit('approval_request', approvalRequest);
          
          const approval = await new Promise((resolve) => {
            socket.once('approval_response', (response) => {
              resolve(response);
            });
          });
          
          if (approval.approved) {
            result.state.approve(interruption);
          } else {
            result.state.reject(interruption);
          }
        }
        
        result = await run(agent, result.state);
        hasInterruptions = result.interruptions?.length > 0;
      }
      
      const botResponse = { type: 'bot', content: result.finalOutput, timestamp: new Date() };
      history.push(botResponse);
      socket.emit('message', botResponse);
      
    } catch (error) {
      console.error('Error processing message:', error);
      const errorResponse = { type: 'error', content: 'エラーが発生しました。', timestamp: new Date() };
      history.push(errorResponse);
      socket.emit('message', errorResponse);
    }
  });

  socket.on('clear_history', () => {
    conversationHistory.set(socket.id, []);
    socket.emit('history_cleared');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});