import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { Task, TaskFilter } from '../types/task';

const router = Router();

router.get('/', (req: Request<{}, {}, {}, TaskFilter>, res: Response) => {
  const { category, priority, status, search } = req.query;
  
  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params: any[] = [];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Failed to fetch tasks' });
    } else {
      res.json(rows);
    }
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Failed to fetch task' });
    } else if (!row) {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.json(row);
    }
  });
});

router.post('/', (req: Request<{}, {}, Task>, res: Response) => {
  const { title, description, category, priority, status, due_date } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const query = `
    INSERT INTO tasks (title, description, category, priority, status, due_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(
    query,
    [title, description || null, category || null, priority || 'medium', status || 'todo', due_date || null],
    function(err) {
      if (err) {
        res.status(500).json({ error: 'Failed to create task' });
      } else {
        db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, row) => {
          if (err) {
            res.status(500).json({ error: 'Failed to fetch created task' });
          } else {
            res.status(201).json(row);
          }
        });
      }
    }
  );
});

router.put('/:id', (req: Request<{ id: string }, {}, Task>, res: Response) => {
  const { id } = req.params;
  const { title, description, category, priority, status, due_date } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const query = `
    UPDATE tasks 
    SET title = ?, description = ?, category = ?, priority = ?, status = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(
    query,
    [title, description || null, category || null, priority, status, due_date || null, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: 'Failed to update task' });
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'Task not found' });
      } else {
        db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
          if (err) {
            res.status(500).json({ error: 'Failed to fetch updated task' });
          } else {
            res.json(row);
          }
        });
      }
    }
  );
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: 'Failed to delete task' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.status(204).send();
    }
  });
});

export default router;