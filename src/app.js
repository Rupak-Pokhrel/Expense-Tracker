import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db, initDatabase, run, get, all } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '..', 'public')));

/**
 * @api {get} /expenses Get all expenses
 * @apiName GetExpenses
 * @apiGroup Expense
 * @apiSuccess {Object[]} expenses List of expenses
 * @apiSuccess {Number} expenses.id Expense ID
 * @apiSuccess {String} expenses.title Expense title
 * @apiSuccess {Number} expenses.amount Expense amount
 * @apiSuccess {String} expenses.category Expense category
 * @apiSuccess {String} expenses.date Expense date
 * @apiSuccess {String} expenses.created_at Creation timestamp
 */
app.get('/expenses', async (req, res) => {
  try {
    const expenses = await all('SELECT * FROM expenses ORDER BY date DESC, id DESC');
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @api {get} /expenses/:id Get expense by ID
 * @apiName GetExpenseById
 * @apiGroup Expense
 * @apiParam {Number} id Expense unique ID
 * @apiSuccess {Number} id Expense ID
 * @apiSuccess {String} title Expense title
 * @apiSuccess {Number} amount Expense amount
 * @apiSuccess {String} category Expense category
 * @apiSuccess {String} date Expense date
 * @apiSuccess {String} created_at Creation timestamp
 * @apiError (404) {Object} error Not found message
 */
app.get('/expenses/:id', async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    const row = await get('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!row) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @api {post} /expenses Create expense
 * @apiName CreateExpense
 * @apiGroup Expense
 * @apiBody {String} title Expense title (required)
 * @apiBody {Number} amount Expense amount (required)
 * @apiBody {String} category Expense category (required)
 * @apiBody {String} date Expense date in YYYY-MM-DD (required)
 * @apiSuccess (201) {Number} id Created expense ID
 * @apiSuccess (201) {String} title Expense title
 * @apiSuccess (201) {Number} amount Expense amount
 * @apiSuccess (201) {String} category Expense category
 * @apiSuccess (201) {String} date Expense date
 * @apiSuccess (201) {String} created_at Creation timestamp
 * @apiError (400) {Object} error Missing required fields message
 */
app.post('/expenses', async (req, res) => {
  try {
    const { title, amount, category, date } = req.body ?? {};
    if (
      title === undefined ||
      title === '' ||
      amount === undefined ||
      amount === '' ||
      category === undefined ||
      category === '' ||
      date === undefined ||
      date === ''
    ) {
      return res.status(400).json({ error: 'title, amount, category, and date are required' });
    }
    const numAmount = typeof amount === 'number' ? amount : Number.parseFloat(amount, 10);
    if (Number.isNaN(numAmount)) {
      return res.status(400).json({ error: 'title, amount, category, and date are required' });
    }
    const result = await run(
      'INSERT INTO expenses (title, amount, category, date) VALUES (?, ?, ?, ?)',
      [String(title), numAmount, String(category), String(date)]
    );
    const created = await get('SELECT * FROM expenses WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @api {put} /expenses/:id Update expense
 * @apiName UpdateExpense
 * @apiGroup Expense
 * @apiParam {Number} id Expense unique ID
 * @apiBody {String} [title] Expense title
 * @apiBody {Number} [amount] Expense amount
 * @apiBody {String} [category] Expense category
 * @apiBody {String} [date] Expense date
 * @apiSuccess {Number} id Expense ID
 * @apiSuccess {String} title Expense title
 * @apiSuccess {Number} amount Expense amount
 * @apiSuccess {String} category Expense category
 * @apiSuccess {String} date Expense date
 * @apiSuccess {String} created_at Creation timestamp
 * @apiError (404) {Object} error Not found message
 */
app.put('/expenses/:id', async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    const existing = await get('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    const { title, amount, category, date } = req.body ?? {};
    const nextTitle = title !== undefined ? String(title) : existing.title;
    let nextAmount = existing.amount;
    if (amount !== undefined) {
      const num = typeof amount === 'number' ? amount : Number.parseFloat(amount, 10);
      nextAmount = Number.isNaN(num) ? existing.amount : num;
    }
    const nextCategory = category !== undefined ? String(category) : existing.category;
    const nextDate = date !== undefined ? String(date) : existing.date;

    await run(
      'UPDATE expenses SET title = ?, amount = ?, category = ?, date = ? WHERE id = ?',
      [nextTitle, nextAmount, nextCategory, nextDate, id]
    );

    const updated = await get('SELECT * FROM expenses WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @api {delete} /expenses/:id Delete expense
 * @apiName DeleteExpense
 * @apiGroup Expense
 * @apiParam {Number} id Expense unique ID
 * @apiSuccess (204) Empty No content on success
 * @apiError (404) {Object} error Not found message
 */
app.delete('/expenses/:id', async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    const result = await run('DELETE FROM expenses WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

await initDatabase();

app.listen(PORT, () => {
  console.log(`Expense Tracker API listening on http://localhost:${PORT}`);
});
