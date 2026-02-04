# GamersEdge POS System

GamersEdge POS is a modern Point of Sale system built with Electron, React, and SQLite, designed for high performance and a premium user experience.

## 🚀 Technologies

- **Frontend:** React, Vite, TailwindCSS (v4), Framer Motion
- **Backend/Shell:** Electron
- **Database:** SQLite (via `better-sqlite3`)
- **Icons:** Lucide React

## 🛠️ Installation

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
    > **Note:** This project uses `better-sqlite3`. If you encounter native module errors, you may need to rebuild for your Electron version:
    > `npm run postinstall` usually handles this, but if not: `npx electron-builder install-app-deps`

## 💻 Development

To run the application in development mode (with Hot Module Replacement):

```bash
npm run electron:dev
```

This command runs Vite for the frontend and launches the Electron shell concurrently.

## 📦 Building for Production

To create a distributable installer (Windows NSIS):

```bash
npm run electron:build
```

The output executables will be located in the `release/` directory.

## 🧹 Linting

```bash
npm run lint
```

## License

Private software. All rights reserved.
