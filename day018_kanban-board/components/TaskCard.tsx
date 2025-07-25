'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Edit2 } from 'lucide-react';
import { Task } from '@/types/kanban';

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string, newContent: string) => void;
}

export function TaskCard({ task, onDelete, onEdit }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(task.content);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEdit = () => {
    if (editContent.trim() && editContent !== task.content) {
      onEdit(task.id, editContent.trim());
    } else {
      setEditContent(task.content);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(task.content);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-sm">
        <textarea
          className="w-full p-2 border border-gray-300 rounded resize-none"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleEdit();
            }
            if (e.key === 'Escape') {
              handleCancel();
            }
          }}
          autoFocus
        />
        <div className="flex gap-2 mt-2">
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            onClick={handleEdit}
          >
            保存
          </button>
          <button
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
            onClick={handleCancel}
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white p-3 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow group ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 text-gray-400 cursor-grab hover:text-gray-600"
        >
          <GripVertical size={16} />
        </div>
        <p className="flex-1 text-gray-700">{task.content}</p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-blue-600"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="text-gray-400 hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}