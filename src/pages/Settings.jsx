import React, { useState } from 'react';
import { Save, RefreshCw, ShieldAlert, Database, Server, UploadCloud } from 'lucide-react';

export default function Settings() {
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [isResetting, setIsResetting] = useState(false);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const handleBackup = async () => {
    try {
      showMsg('Starting backup...', 'info');
      const res = await window.api.backupDatabase();
      if (res.success) {
        showMsg(`Backup saved to: ${res.path}`, 'success');
      } else {
        showMsg('Backup cancelled', 'neutral');
      }
    } catch (e) {
      showMsg('Backup failed', 'error');
    }
  };

  const handleRestore = async () => {
    try {
      if(!confirm("WARNING: This will overwrite your current database. Continue?")) return;
      
      showMsg('Restoring database...', 'info');
      const res = await window.api.restoreDatabase();
      
      if (res.success) {
        showMsg('Database restored successfully! System reloading...', 'success');
      } else {
        showMsg('Restore cancelled', 'neutral');
      }
    } catch (e) {
      console.error(e);
      showMsg('Restore failed: ' + e.message, 'error');
    }
  };

  const handleFactoryReset = async () => {
    if (confirm("DANGER: This will PERMANENTLY WIPE ALL DATA. Are you absolutely sure?")) {
      try {
        setIsResetting(true);
        const res = await window.api.factoryReset();
        if (res.success) {
          showMsg("Factory Reset Complete. System cleaned.", "success");
          setTimeout(() => window.location.reload(), 2000);
        }
      } catch (err) {
        showMsg("Reset Failed: " + err.message, "error");
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="h-full p-10 max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="border-b border-slate-700 pb-6">
        <h1 className="text-4xl font-bold text-white">System Settings</h1>
        <p className="text-slate-400 mt-2">Manage database, security, and system preferences.</p>
      </div>

      {/* Notifications */}
      {msg.text && (
        <div className={`p-4 rounded-lg border flex items-center gap-3 ${
          msg.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-400' :
          msg.type === 'info' ? 'bg-blue-500/10 border-blue-500 text-blue-400' :
          'bg-emerald-500/10 border-emerald-500 text-emerald-400'
        }`}>
          <Server size={20} />
          {msg.text}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Backup Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-cyan-500/30 transition-all flex flex-col">
          <div className="flex items-center gap-3 mb-4 text-cyan-400">
            <Database size={24} />
            <h2 className="text-xl font-bold">Data Management</h2>
          </div>
          <p className="text-slate-400 mb-6 text-sm leading-relaxed flex-1">
            Create a secure snapshot of your entire database or restore from a previous backup file.
          </p>
          <div className="space-y-3">
            <button 
              onClick={handleBackup}
              className="flex items-center gap-2 bg-slate-700 hover:bg-cyan-600 text-white px-5 py-3 rounded-lg transition-all w-full justify-center font-semibold"
            >
              <Save size={18} />
              Backup Database
            </button>
            <button 
              onClick={handleRestore}
              className="flex items-center gap-2 border border-slate-600 hover:bg-slate-700 text-slate-300 hover:text-white px-5 py-3 rounded-lg transition-all w-full justify-center font-semibold"
            >
              <UploadCloud size={18} />
              Restore from Backup
            </button>
          </div>
        </div>

        {/* Reset Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-red-500/30 transition-all relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <ShieldAlert size={100} className="text-red-500" />
          </div>
          <div className="flex items-center gap-3 mb-4 text-red-400">
            <ShieldAlert size={24} />
            <h2 className="text-xl font-bold">Danger Zone</h2>
          </div>
          <p className="text-slate-400 mb-6 text-sm leading-relaxed flex-1">
            Perform a factory reset to clear all transactions, customers, and inventory data. 
            This action <span className="text-red-400 font-bold">cannot be undone</span>.
          </p>
          
          {!isResetting ? (
            <button 
              onClick={() => setIsResetting(true)}
              className="flex items-center gap-2 border border-red-900/50 text-red-500 hover:bg-red-950/50 px-5 py-3 rounded-lg transition-all w-full justify-center font-semibold"
            >
              <RefreshCw size={18} />
              Factory Reset
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={handleFactoryReset}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold animate-pulse"
              >
                CONFIRM WIPE
              </button>
              <button 
                onClick={() => setIsResetting(false)}
                className="px-4 py-3 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-10 text-center">
        <div className="inline-block px-4 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-slate-500">
          GamersEdge OS v2.1 • Registered to Admin
        </div>
      </div>

    </div>
  );
}