/* eslint-env node */
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  // Dev vs Prod URL
  const startUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false 
    },
    title: "GamersEdge POS",
    backgroundColor: '#0f172a',
    show: false,
    frame: true
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.loadURL(startUrl);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  try {
    db.initDb();
  } catch (err) {
    console.error("DB Init Failed:", err);
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- Safe IPC Wrapper ---
function handleIpc(channel, handler) {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return await handler(event, ...args);
    } catch (err) {
      console.error(`IPC Error [${channel}]:`, err);
      // Return error object instead of crashing
      return { error: err.message };
    }
  });
}

// --- Handlers ---

// Dashboard
handleIpc('db:get-dashboard-stats', () => db.getDashboardStats());
handleIpc('db:get-recent-activity', () => db.getRecentActivity());
handleIpc('db:get-top-products', () => db.getTopSellingProducts());

// Products
handleIpc('db:get-products', () => db.getProducts());
handleIpc('db:add-product', (_, data) => db.addProduct(data));
handleIpc('db:update-product', (_, data) => db.updateProduct(data));
handleIpc('db:delete-product', (_, id) => db.deleteProduct(id));

// Transactions
handleIpc('db:process-sale', (_, data) => db.createTransaction(data));
handleIpc('db:get-history', () => db.getTransactions());
handleIpc('db:update-transaction', (_, data) => db.updateTransaction(data));

// Cart Hold/Recall
handleIpc('db:hold-cart', (_, data) => db.addHeldCart(data));
handleIpc('db:get-held-carts', () => db.getHeldCarts());
handleIpc('db:delete-held-cart', (_, id) => db.deleteHeldCart(id));

// Auth
handleIpc('auth:login', (_, { username, password }) => db.loginUser(username, password));
handleIpc('auth:get-users', () => db.getUsers());
handleIpc('auth:add-user', (_, data) => db.addUser(data));
handleIpc('auth:update-user', (_, data) => db.updateUser(data));
handleIpc('auth:delete-user', (_, id) => db.deleteUser(id));

// Customers
handleIpc('db:get-customers', () => db.getCustomers());
handleIpc('db:add-customer', (_, data) => db.addCustomer(data));
handleIpc('db:delete-customer', (_, id) => db.deleteCustomer(id));

// Repairs
handleIpc('db:get-repairs', () => db.getRepairs());
handleIpc('db:add-repair', (_, data) => db.addRepair(data));
handleIpc('db:update-repair-status', (_, {id, status}) => db.updateRepairStatus(id, status));
handleIpc('db:delete-repair', (_, id) => db.deleteRepair(id));

// System
handleIpc('app:backup', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Backup Destination'
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, message: 'Cancelled' };
  }

  const destPath = await db.backupDatabase(result.filePaths[0]);
  return { success: true, path: destPath };
});

handleIpc('app:factory-reset', () => db.factoryReset());

handleIpc('app:restore-backup', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }],
    title: 'Select Backup File to Restore'
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, message: 'Cancelled' };
  }

  const success = await db.restoreDatabase(result.filePaths[0]);
  // Reload window to refresh data
  mainWindow.reload();
  return success;
});
