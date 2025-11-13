import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // acceptă cereri de la Vercel
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);
app.use(express.json());

// PostgreSQL connection (Supabase sau local)
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'DailyTaskTrackerDB',
  password: process.env.DB_PASSWORD || '12345',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : false, // necesar pentru Supabase
});

// ---------------------- Routes ----------------------

// Test root
app.get('/', (req, res) => res.send('✅ Backend is live!'));

// Get all tasks
app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Add new task
app.post('/tasks', async (req, res) => {
  try {
    const { title, description, due_date } = req.body;
    const result = await pool.query(
      'INSERT INTO tasks (title, description, due_date) VALUES ($1, $2, $3) RETURNING *',
      [title, description || null, due_date || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Insert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update task status
app.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query('UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *', [
      status,
      id,
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete task
app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tasks WHERE id=$1', [id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('❌ Delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running on port ${PORT}`));
