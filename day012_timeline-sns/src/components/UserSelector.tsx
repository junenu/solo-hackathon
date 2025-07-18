'use client';

import { User } from '@/types';

interface UserSelectorProps {
  users: User[];
  currentUser: User | null;
  onSelectUser: (user: User) => void;
}

export default function UserSelector({ users, currentUser, onSelectUser }: UserSelectorProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-3">ユーザー選択</h3>
      <div className="grid grid-cols-2 gap-2">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelectUser(user)}
            className={`p-3 rounded-lg border-2 transition-all ${
              currentUser?.id === user.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{user.emoji}</span>
              <span className="font-medium">{user.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}