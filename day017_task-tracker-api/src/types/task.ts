export interface Task {
  id?: number;
  title: string;
  description?: string;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  due_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaskFilter {
  category?: string;
  priority?: string;
  status?: string;
  search?: string;
}