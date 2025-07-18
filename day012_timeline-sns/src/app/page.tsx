'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, TimelineFilter } from '@/types';
import UserSelector from '@/components/UserSelector';
import PostForm from '@/components/PostForm';
import Timeline from '@/components/Timeline';
import FilterTabs from '@/components/FilterTabs';
import { getRandomPost, getRandomUserId } from '@/lib/auto-poster';

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<TimelineFilter>({ type: 'all' });
  const [isAutoPosting, setIsAutoPosting] = useState(false);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setUsers);
  }, []);

  useEffect(() => {
    if (!isAutoPosting || users.length === 0) return;

    const interval = setInterval(async () => {
      const randomUserId = getRandomUserId(users.map(u => u.id));
      const randomContent = getRandomPost();
      
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: randomUserId, content: randomContent })
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPosting, users]);

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    setFilter({ type: filter.type, userId: user.id });
  };

  const handlePostSubmit = async (content: string) => {
    if (!currentUser) return;

    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, content })
    });
  };

  const handleFilterChange = (newFilter: TimelineFilter) => {
    setFilter({ ...newFilter, userId: currentUser?.id });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Timeline SNS</h1>
            <button
              onClick={() => setIsAutoPosting(!isAutoPosting)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isAutoPosting
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isAutoPosting ? '自動投稿停止' : '自動投稿開始'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <UserSelector
              users={users}
              currentUser={currentUser}
              onSelectUser={handleSelectUser}
            />
          </div>

          <div className="md:col-span-2 space-y-6">
            <PostForm
              currentUser={currentUser}
              onSubmit={handlePostSubmit}
            />
            
            <div>
              <FilterTabs
                filter={filter}
                onFilterChange={handleFilterChange}
                disabled={!currentUser}
              />
              
              <Timeline
                currentUser={currentUser}
                filter={filter}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}