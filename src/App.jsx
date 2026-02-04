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

import Layout from './components/Layout';

const AppRoutes = () => {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/history" element={<History />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/repairs" element={<Repairs />} />
        <Route path="/settings" element={user.role === 'admin' ? <Settings /> : <Navigate to="/" />} />
        <Route path="/users" element={user.role === 'admin' ? <Users /> : <Navigate to="/" />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}