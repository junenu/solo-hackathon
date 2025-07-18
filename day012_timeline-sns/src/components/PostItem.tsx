'use client';

import { Post, User } from '@/types';
import { useState, useEffect } from 'react';

interface PostItemProps {
  post: Post;
  currentUser: User | null;
  isFollowing: boolean;
  onFollow: (userId: string) => Promise<void>;
  onUnfollow: (userId: string) => Promise<void>;
}

export default function PostItem({ post, currentUser, isFollowing, onFollow, onUnfollow }: PostItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const isOwnPost = currentUser?.id === post.userId;

  const handleFollowToggle = async () => {
    if (!currentUser || isOwnPost || isProcessing) return;
    
    setIsProcessing(true);
    try {
      if (isFollowing) {
        await onUnfollow(post.userId);
      } else {
        await onFollow(post.userId);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '今';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow animate-fadeIn">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{post.user?.emoji}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{post.user?.name}</h4>
            {currentUser && !isOwnPost && (
              <button
                onClick={handleFollowToggle}
                disabled={isProcessing}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  isFollowing
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } disabled:opacity-50`}
              >
                {isProcessing ? '...' : isFollowing ? 'フォロー中' : 'フォロー'}
              </button>
            )}
          </div>
          <p className="mt-2 text-gray-800 whitespace-pre-wrap">{post.content}</p>
          <p className="mt-2 text-sm text-gray-500">{formatTime(post.timestamp)}</p>
        </div>
      </div>
    </div>
  );
}