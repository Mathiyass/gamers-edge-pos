import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, History, Monitor, Users, Wrench, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) => 
    `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
      isActive 
        ? 'bg-cyan-950/50 text-cyan-400 shadow-[0_0_20px_rgba(8,145,178,0.2)] border border-cyan-900/50' 
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
    }`;

  return (
    <aside className="w-64 bg-[#0f172a] border-r border-slate-800/50 flex flex-col h-screen shrink-0 backdrop-blur-xl z-50">
      {/* Brand */}
      <div className="h-24 flex items-center px-8 border-b border-slate-800/50 bg-slate-900/20">
        <Monitor className="text-cyan-500 w-8 h-8 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
        <div className="ml-3">
          <h1 className="font-bold text-xl text-white tracking-wide">GamersEdge</h1>
          <span className="text-[10px] uppercase tracking-widest text-cyan-500 font-bold opacity-80">Enterprise OS</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="px-4 text-[10px] uppercase font-bold text-slate-600 mb-2 mt-2">Main</div>
        <NavLink to="/" className={linkClass}>
          <LayoutDashboard size={18} />
          <span className="font-medium text-sm">Dashboard</span>
        </NavLink>
        <NavLink to="/pos" className={linkClass}>
          <ShoppingCart size={18} />
          <span className="font-medium text-sm">POS Terminal</span>
        </NavLink>
        <NavLink to="/stock" className={linkClass}>
          <Package size={18} />
          <span className="font-medium text-sm">Inventory</span>
        </NavLink>
        <NavLink to="/history" className={linkClass}>
          <History size={18} />
          <span className="font-medium text-sm">Sales History</span>
        </NavLink>

        <div className="px-4 text-[10px] uppercase font-bold text-slate-600 mb-2 mt-6">Services</div>
        <NavLink to="/customers" className={linkClass}>
          <Users size={18} />
          <span className="font-medium text-sm">Customers</span>
        </NavLink>
        <NavLink to="/repairs" className={linkClass}>
          <Wrench size={18} />
          <span className="font-medium text-sm">Repairs</span>
        </NavLink>
        
        {user?.role === 'admin' && (
          <>
            <div className="px-4 text-[10px] uppercase font-bold text-slate-600 mb-2 mt-6">System</div>
            <NavLink to="/users" className={linkClass}>
              <Shield size={18} />
              <span className="font-medium text-sm">Access Control</span>
            </NavLink>
            <NavLink to="/settings" className={linkClass}>
              <Settings size={18} />
              <span className="font-medium text-sm">Settings</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer Info */}
      <div className="p-6 border-t border-slate-800/50 bg-slate-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-slate-950 ${user?.role === 'admin' ? 'bg-gradient-to-tr from-purple-500 to-cyan-500' : 'bg-slate-500'}`}>
                  {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                  <div className="text-sm text-white font-bold truncate w-24">{user?.name}</div>
                  <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">{user?.role}</div>
              </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
