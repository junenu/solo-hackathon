'use client';

import { DragOverlay as DndDragOverlay } from '@dnd-kit/core';
import { Task } from '@/types/kanban';
import { GripVertical } from 'lucide-react';

interface DragOverlayProps {
  activeTask: Task | null;
}

export function DragOverlay({ activeTask }: DragOverlayProps) {
  if (!activeTask) return null;

  return (
    <DndDragOverlay>
      <div className="bg-white p-3 rounded-lg shadow-lg cursor-grabbing">
        <div className="flex items-start gap-2">
          <div className="mt-1 text-gray-400">
            <GripVertical size={16} />
          </div>
          <p className="flex-1 text-gray-700">{activeTask.content}</p>
        </div>
      </div>
    </DndDragOverlay>
  );
}