const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./db');

const router = express.Router();
const SECRET = 'my_super_secret_key_123';

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Нет токена' });

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Неверный токен' });
  }
}

router.get('/', auth, (req, res) => {
  const notes = db.prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(notes);
});

router.post('/', auth, (req, res) => {
  const { title, body } = req.body;
  if (!title) return res.status(400).json({ error: 'Нужен title' });

  const result = db.prepare('INSERT INTO notes (user_id, title, body) VALUES (?, ?, ?)').run(req.user.id, title, body || '');
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(note);
});

router.put('/:id', auth, (req, res) => {
  const { title, body } = req.body;
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!note) return res.status(404).json({ error: 'Заметка не найдена' });

  db.prepare('UPDATE notes SET title = ?, body = ? WHERE id = ?').run(title || note.title, body !== undefined ? body : note.body, req.params.id);
  const updated = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/:id', auth, (req, res) => {
  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!note) return res.status(404).json({ error: 'Заметка не найдена' });

  db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);
  res.json({ message: 'Удалено' });
});

module.exports = router;