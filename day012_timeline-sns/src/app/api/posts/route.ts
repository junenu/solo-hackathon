import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eventEmitter } from '@/lib/event-emitter';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get('cursor') || undefined;
  const limit = parseInt(searchParams.get('limit') || '10');
  const filter = searchParams.get('filter') || 'all';
  const userId = searchParams.get('userId');

  let result;
  if (filter === 'following' && userId) {
    result = db.getFollowingPosts(userId, cursor, limit);
  } else {
    result = db.getPosts(cursor, limit);
  }

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, content } = body;

  if (!userId || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const post = db.createPost(userId, content);
  const postWithUser = {
    ...post,
    user: db.getUser(userId)
  };

  eventEmitter.emit('new-post', postWithUser);

  return NextResponse.json(postWithUser);
}