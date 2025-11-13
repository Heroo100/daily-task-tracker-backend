// import-uri ES module
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from '@supabase/supabase-js';
const { createClient } = pkg;

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Rute API
app.get('/tasks', async (req, res) => {
  const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/tasks', async (req, res) => {
  const { title } = req.body;
  const { data, error } = await supabase.from('tasks').insert([{ title }]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  const { data, error } = await supabase.from('tasks').update({ completed }).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
