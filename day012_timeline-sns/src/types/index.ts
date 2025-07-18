export interface User {
  id: string;
  name: string;
  emoji: string;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
  user?: User;
}

export interface Follow {
  followerId: string;
  followingId: string;
}

export interface TimelineFilter {
  type: 'all' | 'following';
  userId?: string;
}

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}