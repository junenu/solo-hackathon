import { NextRequest } from 'next/server';
import { eventEmitter } from '@/lib/event-emitter';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(': connected\n\n'));

      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      const onNewPost = (post: any) => {
        sendEvent({ type: 'new-post', post });
      };

      eventEmitter.on('new-post', onNewPost);

      request.signal.addEventListener('abort', () => {
        eventEmitter.off('new-post', onNewPost);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}