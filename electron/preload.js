/* eslint-env node */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('db:get-dashboard-stats'),
  getRecentActivity: () => ipcRenderer.invoke('db:get-recent-activity'),
  getTopProducts: () => ipcRenderer.invoke('db:get-top-products'),
  getSalesByCategory: () => ipcRenderer.invoke('db:get-sales-by-category'),

  // Products
  getProducts: () => ipcRenderer.invoke('db:get-products'),
  addProduct: (data) => ipcRenderer.invoke('db:add-product', data),
  updateProduct: (data) => ipcRenderer.invoke('db:update-product', data),
  deleteProduct: (id) => ipcRenderer.invoke('db:delete-product', id),
  importProductsFromCSV: () => ipcRenderer.invoke('db:import-products-csv'),

  // Transactions
  createTransaction: (data) => ipcRenderer.invoke('db:process-sale', data),
  getTransactions: () => ipcRenderer.invoke('db:get-history'),
  updateTransaction: (data) => ipcRenderer.invoke('db:update-transaction', data),
  getCustomerHistory: (id) => ipcRenderer.invoke('db:get-customer-history', id),

  // Cart Hold/Recall
  holdCart: (data) => ipcRenderer.invoke('db:hold-cart', data),
  getHeldCarts: () => ipcRenderer.invoke('db:get-held-carts'),
  deleteHeldCart: (id) => ipcRenderer.invoke('db:delete-held-cart', id),

  // Auth
  login: (creds) => ipcRenderer.invoke('auth:login', creds),
  getUsers: () => ipcRenderer.invoke('auth:get-users'),
  addUser: (data) => ipcRenderer.invoke('auth:add-user', data),
  updateUser: (data) => ipcRenderer.invoke('auth:update-user', data),
  deleteUser: (id) => ipcRenderer.invoke('auth:delete-user', id),

  // Customers
  getCustomers: () => ipcRenderer.invoke('db:get-customers'),
  addCustomer: (data) => ipcRenderer.invoke('db:add-customer', data),
  deleteCustomer: (id) => ipcRenderer.invoke('db:delete-customer', id),

  // Repairs
  getRepairs: () => ipcRenderer.invoke('db:get-repairs'),
  addRepair: (data) => ipcRenderer.invoke('db:add-repair', data),
  updateRepairStatus: (id, status) => ipcRenderer.invoke('db:update-repair-status', {id, status}),
  deleteRepair: (id) => ipcRenderer.invoke('db:delete-repair', id),

  // Settings & System
  getSettings: () => ipcRenderer.invoke('app:get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('app:update-settings', settings),
  backupDatabase: () => ipcRenderer.invoke('app:backup'),
  factoryReset: () => ipcRenderer.invoke('app:factory-reset'),
  restoreDatabase: () => ipcRenderer.invoke('app:restore-backup')
});