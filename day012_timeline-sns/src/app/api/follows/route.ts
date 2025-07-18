import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const followerId = searchParams.get('followerId');
  const followingId = searchParams.get('followingId');

  if (!followerId || !followingId) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const isFollowing = db.isFollowing(followerId, followingId);
  return NextResponse.json({ isFollowing });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { followerId, followingId } = body;

  if (!followerId || !followingId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  db.follow(followerId, followingId);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { followerId, followingId } = body;

  if (!followerId || !followingId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  db.unfollow(followerId, followingId);
  return NextResponse.json({ success: true });
}