# Project Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update all project dependencies to their latest major versions, fix the `Invoice.jsx` layout issue so it expands with content, and perform surgical bug fixes.

**Architecture:** We will use `npm-check-updates` (or manual `npm install ...@latest`) to upgrade dependencies. We will refactor `Invoice.jsx` to use a standard CSS flex column layout instead of absolute positioning, allowing natural expansion. We will update `index.css` with proper print media queries. Finally, we will add robust error handling to `db.js` and `preload.js`.

**Tech Stack:** React, TailwindCSS, Electron, SQLite.

---

### Task 1: Update Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update packages**

Run: `npm update --save` and install latest major versions of core libraries. Since this might be complex with major version bumps (Vite 8, ESLint 10, React 19 is already there but can be bumped to 19.2.5), we will run explicit install commands.

```bash
npm install @eslint/js@latest @tailwindcss/postcss@latest @vitejs/plugin-react@latest autoprefixer@latest better-sqlite3@latest electron@latest electron-builder@latest eslint@latest eslint-plugin-react-hooks@latest eslint-plugin-react-refresh@latest framer-motion@latest globals@latest jsdom@latest lucide-react@latest react@latest react-dom@latest react-router-dom@latest recharts@latest tailwind-merge@latest tailwindcss@latest uuid@latest vite@latest vitest@latest wait-on@latest
```

- [ ] **Step 2: Update dev dependencies**

```bash
npm install -D @types/react@latest @types/react-dom@latest
```

- [ ] **Step 3: Verify installation**

Run: `npm install`
Expected: Success

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: update all dependencies to latest versions"
```

### Task 2: Fix Invoice Layout

**Files:**
- Modify: `src/components/Invoice.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Refactor Invoice.jsx layout**

Replace absolute positioning classes with standard flow classes.

```jsx
// In src/components/Invoice.jsx, change the outer div:
// From:
// <div id="invoice-content" className="font-sans w-full h-full bg-white text-slate-900 absolute top-0 left-0 z-50 p-12">
// To:
// <div id="invoice-content" className="font-sans w-full min-h-screen bg-white text-slate-900 absolute top-0 left-0 z-50 p-12 flex flex-col">

// And change the bottom footer:
// From:
// <div className="absolute bottom-12 left-12 right-12 text-center border-t border-slate-100 pt-6">
// To:
// <div className="mt-auto text-center border-t border-slate-100 pt-6 pb-12">
```

- [ ] **Step 2: Update Print CSS**

Ensure multi-page printing works by adding page-break rules in `src/index.css`.

```css
/* In src/index.css under @media print */
@media print {
  body * {
    visibility: hidden;
  }
  #invoice-content, #invoice-content *, #repair-ticket-content, #repair-ticket-content * {
    visibility: visible;
  }
  #invoice-content, #repair-ticket-content {
    position: absolute; /* Reset position for print */
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 20px;
    background: white !important;
    color: black !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  /* Add page break handling */
  tr {
    break-inside: avoid;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Invoice.jsx src/index.css
git commit -m "fix(invoice): change layout from absolute height to flow-based for dynamic scaling"
```

### Task 3: Surgical Fixes (Error Handling & Validation)

**Files:**
- Modify: `electron/preload.js`
- Modify: `electron/db.js`

- [ ] **Step 1: Robust IPC Handlers in preload.js**

Wrap all API calls in try-catch and return standardized error objects if they don't already.

```javascript
// In electron/preload.js (example for getProducts, apply to all similar calls)
// Existing code might look like: getProducts: () => ipcRenderer.invoke('get-products'),
// Change to ensure it catches errors, though ipcRenderer.invoke already returns a Promise that rejects on error.
// The main process needs the robust try-catch.
```

- [ ] **Step 2: Robust DB Migrations**

In `electron/db.js`, ensure `initDb` does not crash the app if a migration fails unexpectedly.

```javascript
// In electron/db.js around line 83
  columnsToCheck.forEach(({ table, col, def }) => {
    try {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`).run();
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.error(`Migration error for ${table}.${col}:`, err.message);
        // Do not throw, allow app to continue if possible, or handle gracefully
      }
    }
  });
```

- [ ] **Step 3: Commit**

```bash
git add electron/db.js electron/preload.js
git commit -m "fix(db): ensure database migrations and IPC handlers fail gracefully"
```