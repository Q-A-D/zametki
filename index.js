const express = require('express');
const app = express();

app.use(express.json());

app.use('/auth', require('./auth'));
app.use('/notes', require('./notes'));

app.get('/', (req, res) => {
  res.json({ message: 'API работает' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});