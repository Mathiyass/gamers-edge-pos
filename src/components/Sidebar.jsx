import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, History, Monitor,
  Users, Wrench, Settings, LogOut, Shield, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { cn } from './ui/Card';

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();

  const toggleCollapsed = () => setCollapsed(!collapsed);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden mb-1 ${isActive
      ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] border border-cyan-500/20'
      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 hover:border hover:border-slate-700/50 border border-transparent'
    }`;

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink to={to} className={linkClass}>
      <div className="relative z-10 p-0.5">
        <Icon size={20} />
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="font-medium text-sm whitespace-nowrap overflow-hidden"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      {!collapsed && <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500"><ChevronRight size={14} /></div>}
    </NavLink>
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      className="h-screen bg-[#020617]/80 backdrop-blur-xl border-r border-slate-800/50 flex flex-col shrink-0 z-50 relative"
    >
      {/* Brand */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0">
            <Monitor className="text-cyan-400 w-6 h-6" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                <h1 className="font-bold text-lg text-white tracking-wide">GamersEdge</h1>
                <span className="text-[10px] uppercase tracking-widest text-cyan-500 font-bold opacity-80 block -mt-1">Enterprise OS</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-24 w-6 h-6 bg-cyan-950 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 hover:bg-cyan-900 transition-colors z-50"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation */}
      <div className="flex-1 px-3 py-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
        <div>
          {!collapsed && <div className="px-4 text-[10px] uppercase font-bold text-slate-600 mb-2 tracking-wider">Main</div>}
          <div className="space-y-1">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/pos" icon={ShoppingCart} label="POS Terminal" />
            <NavItem to="/stock" icon={Package} label="Inventory" />
            <NavItem to="/history" icon={History} label="Sales History" />
          </div>
        </div>

        <div>
          {!collapsed && <div className="px-4 text-[10px] uppercase font-bold text-slate-600 mb-2 tracking-wider">Services</div>}
          <div className="space-y-1">
            <NavItem to="/customers" icon={Users} label="Customers" />
            <NavItem to="/repairs" icon={Wrench} label="Repairs" />
          </div>
        </div>

        {user?.role === 'admin' && (
          <div>
            {!collapsed && <div className="px-4 text-[10px] uppercase font-bold text-slate-600 mb-2 tracking-wider">System</div>}
            <div className="space-y-1">
              <NavItem to="/users" icon={Shield} label="Access Control" />
              <NavItem to="/settings" icon={Settings} label="Settings" />
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-900/10">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border border-white/10 ${user?.role === 'admin' ? 'bg-gradient-to-tr from-purple-500 to-cyan-500 text-white' : 'bg-slate-700 text-slate-200'}`}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-sm text-white font-bold truncate w-28">{user?.name}</div>
                <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">{user?.role}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
