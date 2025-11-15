import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from '@supabase/supabase-js';

const { createClient } = pkg;

dotenv.config();

const app = express();

// Configurare CORS mai detaliată
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());

// Health check route - IMPORTANT pentru Render
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Task Manager API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Verificare variabile de mediu
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_URL și SUPABASE_KEY trebuie configurate!');
  process.exit(1);
}

// Inițializare Supabase
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_KEY
);

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title, completed: false }])
      .select();
    
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});