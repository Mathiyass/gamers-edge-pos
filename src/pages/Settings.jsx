import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, ShieldAlert, Database, Server, UploadCloud, Store, FileText, Activity } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [isResetting, setIsResetting] = useState(false);
  const [settings, setSettings] = useState({
    storeName: 'GamersEdge',
    address: '207/04/03/F/2, Wilimbula, Henegama',
    phone: '+94 74 070 5733',
    email: 'sl.gamersedge@gmail.com',
    footerText: 'Thank you for shopping with GamersEdge!'
  });
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    loadSettings();
    if(activeTab === 'logs') loadAuditLogs();
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      const data = await window.api.getSettings();
      if (data && Object.keys(data).length > 0) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const logs = await window.api.getAuditLogs();
      setAuditLogs(logs);
    } catch (e) { console.error(e); }
  };

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 4000);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await window.api.updateSettings(settings);
      showMsg('Store settings updated successfully!', 'success');
    } catch (e) {
      showMsg('Failed to update settings', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
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
    <div className="h-full p-10 max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto custom-scrollbar">
      
      {/* Header */}
      <div className="border-b border-slate-700 pb-6 flex justify-between items-end">
        <div>
           <h1 className="text-4xl font-bold text-white">System Settings</h1>
           <p className="text-slate-400 mt-2">Manage store information, database, and system preferences.</p>
        </div>
        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
           <button onClick={() => setActiveTab('general')} className={`px-4 py-2 rounded font-bold text-sm transition-colors ${activeTab === 'general' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>General</button>
           <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 rounded font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'logs' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}><Activity size={16}/> System Logs</button>
        </div>
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

      {activeTab === 'general' ? (
        <div className="space-y-8">
            {/* Store Info Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 hover:border-cyan-500/30 transition-all">
                <div className="flex items-center gap-3 mb-6 text-cyan-400">
                    <Store size={24} />
                    <h2 className="text-xl font-bold">Store Information</h2>
                </div>
                <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Store Name</label>
                    <input
                        name="storeName"
                        value={settings.storeName}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                    />
                    </div>
                    <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                    <input
                        name="phone"
                        value={settings.phone}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                    />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                    <input
                        name="address"
                        value={settings.address}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                    />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                    <input
                        name="email"
                        value={settings.email}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                    />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Receipt Footer Text</label>
                    <input
                        name="footerText"
                        value={settings.footerText}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                    />
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                        <Save size={18} /> Save Settings
                    </button>
                </div>
                </form>
            </div>

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
        </div>
      ) : (
        <div className="space-y-6">
            {/* AUDIT LOGS */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
               <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                   <h2 className="font-bold text-white flex items-center gap-2"><Activity size={20}/> System Audit Trail</h2>
                   <button onClick={loadAuditLogs} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded border border-slate-700">Refresh</button>
               </div>
               <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                   <table className="w-full text-left">
                       <thead className="bg-slate-900 text-xs font-bold uppercase text-slate-500 sticky top-0 z-10">
                           <tr>
                               <th className="p-4">Timestamp</th>
                               <th className="p-4">User</th>
                               <th className="p-4">Action</th>
                               <th className="p-4">Details</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-800/50 text-sm">
                           {auditLogs.length === 0 ? (
                               <tr><td colSpan="4" className="p-8 text-center text-slate-500">No logs found.</td></tr>
                           ) : auditLogs.map(log => (
                               <tr key={log.id} className="hover:bg-slate-700/20 transition-colors">
                                   <td className="p-4 font-mono text-slate-400 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                                   <td className="p-4 font-bold text-white">{log.user_name}</td>
                                   <td className="p-4">
                                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                           log.action === 'LOGIN' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                           log.action === 'REFUND' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                           'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                       }`}>{log.action}</span>
                                   </td>
                                   <td className="p-4 text-slate-300">{log.details}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
            </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-10 text-center">
        <div className="inline-block px-4 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-slate-500">
          GamersEdge OS v2.1 • Registered to Admin
        </div>
      </div>

    </div>
  );
}