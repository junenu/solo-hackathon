import { User, Post, Follow } from '@/types';

class InMemoryDatabase {
  private users: Map<string, User> = new Map();
  private posts: Post[] = [];
  private follows: Set<string> = new Set();
  private postIdCounter = 1;

  constructor() {
    this.initializeUsers();
  }

  private initializeUsers() {
    const userEmojis = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'];
    const userNames = ['Taro', 'Hanako', 'Yuki', 'Sakura', 'Kenta', 'Mei', 'Hiro', 'Yui', 'Sota', 'Rin'];
    
    userNames.forEach((name, index) => {
      const user: User = {
        id: `user${index + 1}`,
        name,
        emoji: userEmojis[index]
      };
      this.users.set(user.id, user);
    });
  }

  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  createPost(userId: string, content: string): Post {
    const post: Post = {
      id: `post${this.postIdCounter++}`,
      userId,
      content,
      timestamp: Date.now()
    };
    this.posts.unshift(post);
    return post;
  }

  getPosts(cursor?: string, limit: number = 10): { posts: Post[], nextCursor: string | null } {
    let startIndex = 0;
    
    if (cursor) {
      const cursorIndex = this.posts.findIndex(p => p.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedPosts = this.posts.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < this.posts.length;
    const nextCursor = hasMore ? paginatedPosts[paginatedPosts.length - 1]?.id : null;

    const postsWithUsers = paginatedPosts.map(post => ({
      ...post,
      user: this.users.get(post.userId)
    }));

    return { posts: postsWithUsers, nextCursor };
  }

  getFollowingPosts(userId: string, cursor?: string, limit: number = 10): { posts: Post[], nextCursor: string | null } {
    const followingIds = this.getFollowing(userId);
    const followingPosts = this.posts.filter(post => followingIds.includes(post.userId));
    
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = followingPosts.findIndex(p => p.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedPosts = followingPosts.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < followingPosts.length;
    const nextCursor = hasMore ? paginatedPosts[paginatedPosts.length - 1]?.id : null;

    const postsWithUsers = paginatedPosts.map(post => ({
      ...post,
      user: this.users.get(post.userId)
    }));

    return { posts: postsWithUsers, nextCursor };
  }

  follow(followerId: string, followingId: string): void {
    if (followerId !== followingId) {
      this.follows.add(`${followerId}-${followingId}`);
    }
  }

  unfollow(followerId: string, followingId: string): void {
    this.follows.delete(`${followerId}-${followingId}`);
  }

  isFollowing(followerId: string, followingId: string): boolean {
    return this.follows.has(`${followerId}-${followingId}`);
  }

  getFollowing(userId: string): string[] {
    const following: string[] = [];
    this.follows.forEach(follow => {
      const [followerId, followingId] = follow.split('-');
      if (followerId === userId) {
        following.push(followingId);
      }
    });
    return following;
  }

  getFollowers(userId: string): string[] {
    const followers: string[] = [];
    this.follows.forEach(follow => {
      const [followerId, followingId] = follow.split('-');
      if (followingId === userId) {
        followers.push(followerId);
      }
    });
    return followers;
  }
}

export const db = new InMemoryDatabase();