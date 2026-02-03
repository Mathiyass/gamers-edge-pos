import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userDataPath = app ? app.getPath('userData') : __dirname;
const dbPath = path.join(userDataPath, 'gamersedge.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function hashPassword(password, salt) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

// --- Initialization & Schema Migration ---
export function initDb() {
  // 1. Create Tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category TEXT,
      price_buy REAL DEFAULT 0,
      price_sell REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      image TEXT,
      warranty TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      total REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'Cash',
      customer_name TEXT,
      items_json TEXT,
      discount REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      points INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS repairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      device TEXT NOT NULL,
      issue TEXT,
      status TEXT DEFAULT 'Pending',
      cost REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS held_carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT,
      items_json TEXT,
      timestamp TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT DEFAULT 'staff'
    );
  `);

  // 2. Schema Fixer (Lazy Migrations)
  const columnsToCheck = [
    { table: 'transactions', col: 'total', def: 'REAL DEFAULT 0' },
    { table: 'transactions', col: 'profit', def: 'REAL DEFAULT 0' },
    { table: 'transactions', col: 'payment_method', def: "TEXT DEFAULT 'Cash'" },
    { table: 'transactions', col: 'customer_name', def: 'TEXT' },
    { table: 'transactions', col: 'items_json', def: 'TEXT' },
    { table: 'transactions', col: 'discount', def: 'REAL DEFAULT 0' },
    { table: 'customers', col: 'points', def: 'INTEGER DEFAULT 0' },
    { table: 'repairs', col: 'customer_id', def: 'INTEGER' },
    { table: 'repairs', col: 'created_at', def: "TEXT DEFAULT ''" }
  ];

  columnsToCheck.forEach(({ table, col, def }) => {
    try {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`).run();
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error(`Migration error for ${table}.${col}:`, err.message);
      }
    }
  });

  // 3. Default Admin User
  const adminExists = db.prepare('SELECT count(*) as count FROM users').get();
  if (adminExists.count === 0) {
    const { hash, salt } = hashPassword('admin123'); // Default Password
    db.prepare('INSERT INTO users (name, username, password, salt, role) VALUES (?, ?, ?, ?, ?)')
      .run('Administrator', 'admin', hash, salt, 'admin');
    console.log("Default Admin User Created (admin / admin123)");
  } else {
    console.log(`Database initialized. User count: ${adminExists.count}`);
  }
}

// --- Auth ---
export function loginUser(username, password) {
  console.log(`[DB] Attempting login for: '${username}'`);
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user) {
    console.log(`[DB] User '${username}' not found.`);
    // Debug: List all users to see what's in there
    const allUsers = db.prepare('SELECT username FROM users').all();
    console.log(`[DB] Existing users: ${JSON.stringify(allUsers)}`);
    throw new Error('User not found');
  }

  const { hash } = hashPassword(password, user.salt);
  if (hash !== user.password) throw new Error('Invalid password');

  // Return user without sensitive data
  return { id: user.id, name: user.name, username: user.username, role: user.role };
}

export function getUsers() {
  return db.prepare('SELECT id, name, username, role FROM users ORDER BY name ASC').all();
}

export function addUser(userData) {
  const { name, username, password, role } = userData;
  const { hash, salt } = hashPassword(password);
  return db.prepare('INSERT INTO users (name, username, password, salt, role) VALUES (?, ?, ?, ?, ?)')
    .run(name, username, hash, salt, role || 'staff');
}

export function updateUser(userData) {
  const { id, name, username, role, password } = userData;
  
  if (password) {
    const { hash, salt } = hashPassword(password);
    return db.prepare('UPDATE users SET name = ?, username = ?, role = ?, password = ?, salt = ? WHERE id = ?')
      .run(name, username, role, hash, salt, id);
  } else {
    return db.prepare('UPDATE users SET name = ?, username = ?, role = ? WHERE id = ?')
      .run(name, username, role, id);
  }
}

export function deleteUser(id) {
  // Prevent deleting the last admin? Logic can be added here or in frontend.
  return db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

// --- Analytics ---
export function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0];
  
  const revenueObj = db.prepare('SELECT SUM(total) as val FROM transactions WHERE timestamp LIKE ?').get(`${today}%`);
  const profitObj = db.prepare('SELECT SUM(profit) as val FROM transactions').get();
  const ordersObj = db.prepare('SELECT COUNT(*) as val FROM transactions WHERE timestamp LIKE ?').get(`${today}%`);
  const lowStockObj = db.prepare('SELECT COUNT(*) as val FROM products WHERE stock < 5').get();

  return {
    totalRevenue: revenueObj?.val || 0,
    netProfit: profitObj?.val || 0,
    totalOrders: ordersObj?.val || 0,
    lowStockCount: lowStockObj?.val || 0
  };
}

export function getRecentActivity() {
  return db.prepare('SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 5').all();
}

export function getTopSellingProducts() {
  // Aggregate sales from transaction items would be ideal, but storing JSON makes that hard in SQLite pure SQL.
  // Alternative: We can parse recent transactions in JS or rely on a simpler metric if we tracked it.
  // For now, let's process the last 100 transactions in JS to find top sellers.
  const txs = db.prepare('SELECT items_json FROM transactions ORDER BY timestamp DESC LIMIT 100').all();
  const map = {};
  
  txs.forEach(tx => {
    const items = JSON.parse(tx.items_json || '[]');
    items.forEach(item => {
      if (!map[item.name]) map[item.name] = { name: item.name, qty: 0, revenue: 0 };
      map[item.name].qty += item.quantity;
      map[item.name].revenue += (item.quantity * item.price_sell);
    });
  });

  return Object.values(map)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
}

// --- Products ---
export function getProducts() {
  return db.prepare('SELECT * FROM products ORDER BY name ASC').all();
}

export function addProduct(product) {
  const { name, category, price_buy, price_sell, stock, image, warranty } = product;
  let { sku } = product;

  if (!sku || sku.trim() === '') {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    sku = `GE-${dateStr}-${randomSuffix}`;
  }

  const stmt = db.prepare(`
    INSERT INTO products (name, sku, category, price_buy, price_sell, stock, image, warranty)
    VALUES (@name, @sku, @category, @price_buy, @price_sell, @stock, @image, @warranty)
  `);
  return stmt.run({ name, sku, category, price_buy, price_sell, stock, image: image || '', warranty });
}

export function updateProduct(product) {
  const { id, name, sku, category, price_buy, price_sell, stock, image, warranty } = product;
  const stmt = db.prepare(`
    UPDATE products 
    SET name = @name, sku = @sku, category = @category, price_buy = @price_buy, 
        price_sell = @price_sell, stock = @stock, image = @image, warranty = @warranty
    WHERE id = @id
  `);
  return stmt.run({ id, name, sku, category, price_buy, price_sell, stock, image: image || '', warranty });
}

export function deleteProduct(id) {
  return db.prepare('DELETE FROM products WHERE id = ?').run(id);
}

// --- Transactions ---
export function createTransaction(data) {
  const { items, customer, total, paymentMethod, discount, pointsUsed } = data; 
  const timestamp = new Date().toISOString();
  const itemsJson = JSON.stringify(items);
  let profit = 0;
  items.forEach(item => { profit += (item.price_sell - item.price_buy) * item.quantity; });
  
  if (discount) profit -= discount;
  // If points used (1 point = 1 LKR discount logic, or passed as discount value? 
  // Let's assume pointsUsed is the NUMBER of points, and we already reduced 'total' in frontend.
  // Profit might be affected if points cover cost? Usually points are a marketing expense. 
  // We'll leave profit calculation simple for now.

  const performTx = db.transaction(() => {
    const deduct = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    for (const item of items) deduct.run(item.quantity, item.id);

    const insert = db.prepare(`
      INSERT INTO transactions (timestamp, total, profit, customer_name, items_json, payment_method, discount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    if (customer && customer !== 'Walk-in') {
       // Deduct used points
       if (pointsUsed > 0) {
         db.prepare('UPDATE customers SET points = points - ? WHERE name = ?').run(pointsUsed, customer);
       }

       // Add new points based on PAID total
       const pointsEarned = Math.floor(total / 100); 
       db.prepare('UPDATE customers SET points = points + ? WHERE name = ?').run(pointsEarned, customer);
    }
    
    return insert.run(timestamp, total, profit, customer || 'Walk-in', itemsJson, paymentMethod || 'Cash', discount || 0);
  });
  return performTx();
}

export function getTransactions() {
  const txs = db.prepare('SELECT * FROM transactions ORDER BY timestamp DESC').all();
  return txs.map(tx => ({ ...tx, items: JSON.parse(tx.items_json || '[]') }));
}

export function updateTransaction(data) {
  const { id, newDate, newCustomer, newTotal, newItems } = data;
  
  const performUpdate = db.transaction(() => {
    const oldTx = db.prepare('SELECT items_json FROM transactions WHERE id = ?').get(id);
    if (!oldTx) throw new Error('Transaction not found');
    const oldItems = JSON.parse(oldTx.items_json || '[]');
    
    const restoreStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    for (const item of oldItems) {
        restoreStock.run(item.quantity, item.id);
    }

    const deductStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    let newProfit = 0;
    
    for (const item of newItems) {
        deductStock.run(item.quantity, item.id);
        const cost = item.price_buy || 0; 
        newProfit += (item.price_sell - cost) * item.quantity;
    }

    const newItemsJson = JSON.stringify(newItems);
    return db.prepare(`
      UPDATE transactions 
      SET timestamp = ?, customer_name = ?, total = ?, profit = ?, items_json = ?
      WHERE id = ?
    `).run(newDate, newCustomer, newTotal, newProfit, newItemsJson, id);
  });

  return performUpdate();
}

// --- Cart Hold/Recall ---
export function addHeldCart(data) {
  const { customer, items } = data;
  const timestamp = new Date().toISOString();
  return db.prepare('INSERT INTO held_carts (customer_name, items_json, timestamp) VALUES (?, ?, ?)').run(customer, JSON.stringify(items), timestamp);
}

export function getHeldCarts() {
  const carts = db.prepare('SELECT * FROM held_carts ORDER BY timestamp DESC').all();
  return carts.map(c => ({ ...c, items: JSON.parse(c.items_json) }));
}

export function deleteHeldCart(id) {
  return db.prepare('DELETE FROM held_carts WHERE id = ?').run(id);
}

// --- Customers ---
export function getCustomers() {
  return db.prepare('SELECT * FROM customers ORDER BY points DESC, name ASC').all();
}

export function addCustomer(customer) {
  const { name, phone, email } = customer;
  return db.prepare('INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)').run(name, phone, email);
}

export function deleteCustomer(id) {
  return db.prepare('DELETE FROM customers WHERE id = ?').run(id);
}

// --- Repairs ---
export function getRepairs() {
  return db.prepare(`
    SELECT repairs.*, customers.name as customer_name, customers.phone as customer_phone
    FROM repairs
    LEFT JOIN customers ON repairs.customer_id = customers.id
    ORDER BY created_at DESC
  `).all();
}

export function addRepair(repair) {
  const { customer_id, device, issue, cost } = repair;
  const created_at = new Date().toISOString();
  
  // Check if legacy 'date_in' column exists (to support old DB schemas)
  const columns = db.prepare('PRAGMA table_info(repairs)').all().map(c => c.name);
  const hasDateIn = columns.includes('date_in');

  if (hasDateIn) {
    return db.prepare(`
      INSERT INTO repairs (customer_id, device, issue, status, cost, created_at, date_in)
      VALUES (?, ?, ?, 'Pending', ?, ?, ?)
    `).run(customer_id, device, issue, cost || 0, created_at, created_at);
  } else {
    return db.prepare(`
      INSERT INTO repairs (customer_id, device, issue, status, cost, created_at)
      VALUES (?, ?, ?, 'Pending', ?, ?)
    `).run(customer_id, device, issue, cost || 0, created_at);
  }
}

export function updateRepairStatus(id, status) {
  return db.prepare('UPDATE repairs SET status = ? WHERE id = ?').run(status, id);
}

export function deleteRepair(id) {
  return db.prepare('DELETE FROM repairs WHERE id = ?').run(id);
}

// --- System ---
export async function backupDatabase(destFolder) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `GamersEdge_Backup_${timestamp}.db`;
  const destPath = path.join(destFolder, backupName);
  await db.backup(destPath);
  return destPath;
}

export function factoryReset() {
  const reset = db.transaction(() => {
    db.prepare('DELETE FROM transactions').run();
    db.prepare('DELETE FROM repairs').run();
    db.prepare('DELETE FROM customers').run();
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM sqlite_sequence').run(); // Reset auto-increment IDs
  });
  reset();
  return { success: true };
}

export function restoreDatabase(backupPath) {
  try {
    // Attach backup DB
    db.prepare(`ATTACH DATABASE ? AS backup`).run(backupPath);
    
    const restore = db.transaction(() => {
      // Clear Main Tables
      db.prepare('DELETE FROM main.products').run();
      db.prepare('DELETE FROM main.customers').run();
      db.prepare('DELETE FROM main.transactions').run();
      db.prepare('DELETE FROM main.repairs').run();
      db.prepare('DELETE FROM main.sqlite_sequence').run();

      // Copy Data from Backup
      db.prepare('INSERT INTO main.products SELECT * FROM backup.products').run();
      db.prepare('INSERT INTO main.customers SELECT * FROM backup.customers').run();
      db.prepare('INSERT INTO main.transactions SELECT * FROM backup.transactions').run();
      db.prepare('INSERT INTO main.repairs SELECT * FROM backup.repairs').run();
      
      // Copy sqlite_sequence if it exists in backup (to preserve ID counters)
      // Check if backup has sqlite_sequence
      const hasSequence = db.prepare("SELECT name FROM backup.sqlite_master WHERE type='table' AND name='sqlite_sequence'").get();
      if (hasSequence) {
         db.prepare('INSERT INTO main.sqlite_sequence SELECT * FROM backup.sqlite_sequence').run();
      }
    });

    restore();
    db.prepare('DETACH DATABASE backup').run();
    return { success: true };
  } catch (err) {
    // Ensure we detach even on error to avoid lock
    try { db.prepare('DETACH DATABASE backup').run(); } catch (e) {}
    throw err;
  }
}