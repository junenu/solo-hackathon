'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Post, User, TimelineFilter } from '@/types';
import PostItem from './PostItem';
import { useEventSource } from '@/hooks/useEventSource';

interface TimelineProps {
  currentUser: User | null;
  filter: TimelineFilter;
}

export default function Timeline({ currentUser, filter }: TimelineProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<Map<string, boolean>>(new Map());
  const loadingRef = useRef(false);

  const fetchPosts = useCallback(async (cursor?: string) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor);
      params.append('limit', '10');
      params.append('filter', filter.type);
      if (filter.userId) params.append('userId', filter.userId);

      const response = await fetch(`/api/posts?${params}`);
      const data = await response.json();
      
      if (cursor) {
        setPosts(prev => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      setNextCursor(data.nextCursor);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [filter]);

  const fetchFollowingStatus = useCallback(async (userIds: string[]) => {
    if (!currentUser) return;
    
    const newStatus = new Map<string, boolean>();
    
    await Promise.all(
      userIds.map(async (userId) => {
        if (userId === currentUser.id) return;
        
        const response = await fetch(
          `/api/follows?followerId=${currentUser.id}&followingId=${userId}`
        );
        const data = await response.json();
        newStatus.set(userId, data.isFollowing);
      })
    );
    
    setFollowingStatus(newStatus);
  }, [currentUser]);

  useEffect(() => {
    fetchPosts();
  }, [filter, fetchPosts]);

  useEffect(() => {
    const userIds = [...new Set(posts.map(p => p.userId))];
    fetchFollowingStatus(userIds);
  }, [posts, fetchFollowingStatus]);

  const handleNewPost = useCallback((data: any) => {
    if (data.type === 'new-post') {
      setPosts(prev => [data.post, ...prev]);
    }
  }, []);

  useEventSource('/api/events', handleNewPost);

  const handleFollow = async (userId: string) => {
    if (!currentUser) return;
    
    await fetch('/api/follows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId: currentUser.id, followingId: userId })
    });
    
    setFollowingStatus(prev => new Map(prev).set(userId, true));
  };

  const handleUnfollow = async (userId: string) => {
    if (!currentUser) return;
    
    await fetch('/api/follows', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId: currentUser.id, followingId: userId })
    });
    
    setFollowingStatus(prev => new Map(prev).set(userId, false));
    
    if (filter.type === 'following') {
      setPosts(prev => prev.filter(p => p.userId !== userId));
    }
  };

  const handleLoadMore = () => {
    if (nextCursor && !isLoading) {
      fetchPosts(nextCursor);
    }
  };

  if (posts.length === 0 && !isLoading) {
    return (
      <div className="bg-gray-100 p-8 rounded-lg text-center text-gray-500">
        {filter.type === 'following' 
          ? 'フォローしているユーザーの投稿がありません' 
          : 'まだ投稿がありません'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          currentUser={currentUser}
          isFollowing={followingStatus.get(post.userId) || false}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
        />
      ))}
      
      {nextCursor && (
        <button
          onClick={handleLoadMore}
          disabled={isLoading}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? '読み込み中...' : 'もっと見る'}
        </button>
      )}
    </div>
  );
}