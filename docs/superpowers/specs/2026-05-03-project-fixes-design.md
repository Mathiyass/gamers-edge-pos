# Design Spec: Comprehensive Project Fixes & Invoice Scaling

## 1. Overview
The goal of this project phase is to address critical layout issues, update project dependencies to their latest versions, and perform surgical fixes to ensure reliability and maintainability.

## 2. Dependencies Update
- Update all packages in `package.json` to their `latest` major versions as requested by the user.
- Key updates include React 19.x, Vite 8.x, Electron 41.x, and ESLint 10.x.
- A full `npm install` and validation will be required post-update to handle any breaking changes, particularly with Vite, ESLint, and Electron.

## 3. Invoice Layout Fix (A4 Standard)
The current `Invoice.jsx` uses absolute positioning (`absolute bottom-12`) for the footer and fixed height (`h-full`), which breaks when the item list grows long.
- **Implementation:**
  - Remove `absolute`, `h-full`, and `top-0 left-0` classes that constrain the invoice size.
  - Implement a standard CSS flow layout (flex column) so the container expands naturally.
  - Ensure the footer is placed at the end of the document flow, rather than absolutely positioned at the bottom of the viewport.
  - Use `@media print` rules in `index.css` to manage page breaks (`break-inside-avoid` for critical sections like totals).

## 4. Surgical Fixes & Improvements
- **Database Migrations (`db.js`):** Ensure schema updates handle existing data gracefully.
- **Error Handling:** Ensure API calls in components (like `window.api.getProducts`) are properly wrapped in `try/catch` blocks or promise `.catch()` handlers.
- **Electron Preload:** Verify IPC handlers are robust.

## 5. Security & Context
- Secrets must not be logged.
- The project runs on Windows (`win32`), so cross-platform pathing should be respected where applicable.
