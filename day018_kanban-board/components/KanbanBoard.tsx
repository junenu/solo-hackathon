'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Column } from '@/types/kanban';
import { KanbanColumn } from './KanbanColumn';
import { DragOverlay } from './DragOverlay';

const initialColumns: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    tasks: [
      { id: '1', content: 'プロジェクトの計画を立てる', columnId: 'todo' },
      { id: '2', content: 'ワイヤーフレームを作成する', columnId: 'todo' },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    tasks: [
      { id: '3', content: 'UIデザインを作成する', columnId: 'in-progress' },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    tasks: [
      { id: '4', content: '要件定義を完了する', columnId: 'done' },
    ],
  },
];

export function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = columns.find((col) =>
      col.tasks.some((task) => task.id === activeId)
    );
    const overColumn = columns.find(
      (col) => col.id === overId || col.tasks.some((task) => task.id === overId)
    );

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    setColumns((cols) => {
      const activeTask = activeColumn.tasks.find((t) => t.id === activeId);
      if (!activeTask) return cols;

      return cols.map((col) => {
        if (col.id === activeColumn.id) {
          return {
            ...col,
            tasks: col.tasks.filter((t) => t.id !== activeId),
          };
        }
        if (col.id === overColumn.id) {
          const newTask = { ...activeTask, columnId: overColumn.id };
          return {
            ...col,
            tasks: [...col.tasks, newTask],
          };
        }
        return col;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = columns.find((col) =>
      col.tasks.some((task) => task.id === activeId)
    );

    if (!activeColumn) return;

    if (activeId !== overId) {
      setColumns((cols) => {
        return cols.map((col) => {
          if (col.id === activeColumn.id) {
            const activeIndex = col.tasks.findIndex((t) => t.id === activeId);
            const overIndex = col.tasks.findIndex((t) => t.id === overId);

            if (activeIndex !== -1 && overIndex !== -1) {
              const newTasks = [...col.tasks];
              const [removed] = newTasks.splice(activeIndex, 1);
              newTasks.splice(overIndex, 0, removed);
              return { ...col, tasks: newTasks };
            }
          }
          return col;
        });
      });
    }

    setActiveId(null);
  };

  const getActiveTask = () => {
    if (!activeId) return null;
    for (const column of columns) {
      const task = column.tasks.find((t) => t.id === activeId);
      if (task) return task;
    }
    return null;
  };

  const addTask = (columnId: string, content: string) => {
    const newTask = {
      id: Date.now().toString(),
      content,
      columnId,
    };

    setColumns((cols) =>
      cols.map((col) =>
        col.id === columnId
          ? { ...col, tasks: [...col.tasks, newTask] }
          : col
      )
    );
  };

  const deleteTask = (taskId: string) => {
    setColumns((cols) =>
      cols.map((col) => ({
        ...col,
        tasks: col.tasks.filter((task) => task.id !== taskId),
      }))
    );
  };

  const editTask = (taskId: string, newContent: string) => {
    setColumns((cols) =>
      cols.map((col) => ({
        ...col,
        tasks: col.tasks.map((task) =>
          task.id === taskId ? { ...task, content: newContent } : task
        ),
      }))
    );
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 p-6 h-screen bg-gray-50">
        {columns.map((column) => (
          <SortableContext
            key={column.id}
            items={column.tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <KanbanColumn
              column={column}
              onAddTask={addTask}
              onDeleteTask={deleteTask}
              onEditTask={editTask}
            />
          </SortableContext>
        ))}
      </div>
      <DragOverlay activeTask={getActiveTask()} />
    </DndContext>
  );
}