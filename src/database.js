import sqlite3 from 'sqlite3';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'expenses.db');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

const SEED_EXPENSES = [
  { title: 'Breakfast at cafe', amount: 8.50, category: 'Food', date: '2026-04-01' },
  { title: 'Taxi ride', amount: 12.00, category: 'Transport', date: '2026-04-01' },
  { title: 'Monthly rent', amount: 650.00, category: 'Bills', date: '2026-04-02' },
  { title: 'Grocery shopping', amount: 72.30, category: 'Food', date: '2026-04-02' },
  { title: 'Phone bill', amount: 25.00, category: 'Bills', date: '2026-04-03' },
  { title: 'Streaming subscription', amount: 14.99, category: 'Entertainment', date: '2026-04-03' },
  { title: 'Gym membership', amount: 40.00, category: 'Health', date: '2026-04-04' },
  { title: 'Bus pass', amount: 18.00, category: 'Transport', date: '2026-04-04' },
  { title: 'Lunch with colleagues', amount: 22.75, category: 'Food', date: '2026-04-05' },
  { title: 'Movie night', amount: 30.00, category: 'Entertainment', date: '2026-04-05' },
  { title: 'Doctor visit', amount: 92.00, category: 'Health', date: '2026-04-06' },
  { title: 'New headphones', amount: 55.00, category: 'Shopping', date: '2026-04-06' },
  { title: 'Dinner takeout', amount: 19.25, category: 'Food', date: '2026-04-07' },
  { title: 'Gas refill', amount: 45.00, category: 'Transport', date: '2026-04-07' },
  { title: 'Electricity bill', amount: 60.00, category: 'Bills', date: '2026-04-08' },
  { title: 'Concert ticket', amount: 85.00, category: 'Entertainment', date: '2026-04-08' },
  { title: 'Pharmacy purchase', amount: 12.40, category: 'Health', date: '2026-04-09' },
  { title: 'Office supplies', amount: 33.00, category: 'Shopping', date: '2026-04-09' },
  { title: 'Weekend brunch', amount: 27.50, category: 'Food', date: '2026-04-10' },
  { title: 'Parking fee', amount: 10.00, category: 'Transport', date: '2026-04-10' },
];

async function createTable() {
  await exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function insertSeedRows() {
  for (const row of SEED_EXPENSES) {
    await run(
      'INSERT INTO expenses (title, amount, category, date) VALUES (?, ?, ?, ?)',
      [row.title, row.amount, row.category, row.date]
    );
  }
}

export async function initDatabase() {
  await createTable();
  const row = await get('SELECT COUNT(*) AS n FROM expenses');
  if (row.n === 0) {
    await insertSeedRows();
  }
}

export async function seedDatabase() {
  await exec('DROP TABLE IF EXISTS expenses');
  await createTable();
  await insertSeedRows();
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  await seedDatabase();
  console.log('Database seeded with 20 expenses.');
  db.close();
}

export { db, run, get, all };
