'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { Column } from '@/types/kanban';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  column: Column;
  onAddTask: (columnId: string, content: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (taskId: string, newContent: string) => void;
}

export function KanbanColumn({
  column,
  onAddTask,
  onDeleteTask,
  onEditTask,
}: KanbanColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');

  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const handleAddTask = () => {
    if (newTaskContent.trim()) {
      onAddTask(column.id, newTaskContent.trim());
      setNewTaskContent('');
      setIsAddingTask(false);
    }
  };

  const handleCancel = () => {
    setNewTaskContent('');
    setIsAddingTask(false);
  };

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-100 rounded-lg p-4 w-80 flex flex-col h-fit max-h-[calc(100vh-3rem)]"
    >
      <h3 className="font-semibold text-gray-700 mb-4 flex items-center justify-between">
        {column.title}
        <span className="text-sm bg-gray-200 px-2 py-1 rounded">
          {column.tasks.length}
        </span>
      </h3>

      <div className="space-y-3 overflow-y-auto flex-1 min-h-[200px]">
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={onDeleteTask}
            onEdit={onEditTask}
          />
        ))}
      </div>

      {isAddingTask ? (
        <div className="mt-3">
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md resize-none"
            placeholder="タスクを入力..."
            value={newTaskContent}
            onChange={(e) => setNewTaskContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddTask();
              }
              if (e.key === 'Escape') {
                handleCancel();
              }
            }}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleAddTask}
            >
              追加
            </button>
            <button
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              onClick={handleCancel}
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button
          className="mt-3 w-full p-2 text-left text-gray-600 hover:bg-gray-200 rounded-md flex items-center gap-2"
          onClick={() => setIsAddingTask(true)}
        >
          <Plus size={16} />
          タスクを追加
        </button>
      )}
    </div>
  );
}