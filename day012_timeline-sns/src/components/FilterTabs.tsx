'use client';

import { TimelineFilter } from '@/types';

interface FilterTabsProps {
  filter: TimelineFilter;
  onFilterChange: (filter: TimelineFilter) => void;
  disabled?: boolean;
}

export default function FilterTabs({ filter, onFilterChange, disabled }: FilterTabsProps) {
  return (
    <div className="flex space-x-2 mb-4">
      <button
        onClick={() => onFilterChange({ type: 'all' })}
        disabled={disabled}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          filter.type === 'all'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        } disabled:opacity-50`}
      >
        すべて
      </button>
      <button
        onClick={() => onFilterChange({ type: 'following', userId: filter.userId })}
        disabled={disabled || !filter.userId}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          filter.type === 'following'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        } disabled:opacity-50`}
      >
        フォロー中
      </button>
    </div>
  );
}