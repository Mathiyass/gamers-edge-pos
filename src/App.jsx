import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Stock from './pages/Stock';
import History from './pages/History';
import Customers from './pages/Customers';
import Repairs from './pages/Repairs';
import Settings from './pages/Settings';
import Users from './pages/Users';

const AppLayout = () => {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-100 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-slate-900 to-[#0f172a] -z-10"></div>
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/history" element={<History />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/repairs" element={<Repairs />} />
            <Route path="/settings" element={user.role === 'admin' ? <Settings /> : <Navigate to="/" />} />
            <Route path="/users" element={user.role === 'admin' ? <Users /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}