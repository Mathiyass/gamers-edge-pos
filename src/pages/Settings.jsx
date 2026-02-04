import React, { useState, useEffect, useCallback } from 'react';
import { Save, RefreshCw, ShieldAlert, Database, Server, UploadCloud, Store, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

export default function Settings() {
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [isResetting, setIsResetting] = useState(false);
  const [settings, setSettings] = useState({
    storeName: 'GamersEdge',
    address: '207/04/03/F/2, Wilimbula, Henegama',
    phone: '+94 74 070 5733',
    email: 'sl.gamersedge@gmail.com',
    footerText: 'Thank you for shopping with GamersEdge!',
    taxRate: '0'
  });

  const loadSettings = useCallback(async () => {
    try {
      const data = await window.api.getSettings();
      if (data && Object.keys(data).length > 0) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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
      if (!confirm("WARNING: This will overwrite your current database. Continue?")) return;

      showMsg('Restoring database...', 'info');
      const res = await window.api.restoreDatabase();

      if (res.success) {
        showMsg('Database restored successfully! System reloading...', 'success');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showMsg(res.message || 'Restore cancelled', 'neutral');
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
    <div className="h-full p-8 max-w-6xl mx-auto flex flex-col overflow-y-auto custom-scrollbar relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="mb-8 z-10 shrink-0">
        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <SettingsIcon className="text-cyan-400" size={36} />
          <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">System Settings</span>
        </h1>
        <p className="text-slate-400 mt-2 font-medium max-w-2xl">
          Configure store details, manage database backups, and control system resets.
        </p>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {msg.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-xl border flex items-center gap-3 shadow-2xl backdrop-blur-md ${msg.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
              msg.type === 'info' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' :
                'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
              }`}
          >
            <div className={`p-2 rounded-lg ${msg.type === 'error' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
              <Server size={20} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider opacity-70">{msg.type}</div>
              <div className="font-semibold">{msg.text}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 z-10">
        {/* Store Info Card */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
              <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
                <Store size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Store Information</h2>
                <p className="text-xs text-slate-500">Business details displayed on invoices</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Store Name"
                  name="storeName"
                  value={settings.storeName}
                  onChange={handleChange}
                />
                <Input
                  label="Tax Rate (%)"
                  name="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.taxRate}
                  onChange={handleChange}
                />
                <Input
                  label="Phone Number"
                  name="phone"
                  value={settings.phone}
                  onChange={handleChange}
                />
                <Input
                  label="Email Address"
                  name="email"
                  value={settings.email}
                  onChange={handleChange}
                />
              </div>
              <Input
                label="Business Address"
                name="address"
                value={settings.address}
                onChange={handleChange}
              />
              <Input
                label="Receipt Footer Text"
                name="footerText"
                value={settings.footerText}
                onChange={handleChange}
              />
              <div className="flex justify-end pt-4 border-t border-slate-800">
                <Button type="submit" variant="primary" className="shadow-lg shadow-cyan-900/20">
                  <Save size={18} className="mr-2" /> Save Configuration
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Side Panel: System Ops */}
        <div className="space-y-8">
          {/* Backup Card */}
          <Card className="hover:border-blue-500/30 transition-all border-slate-800">
            <div className="flex items-center gap-3 mb-4 text-blue-400">
              <Database size={24} />
              <h2 className="text-lg font-bold">Data Backup</h2>
            </div>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              Create a secure snapshot or restore from a previous file.
            </p>
            <div className="space-y-3">
              <Button onClick={handleBackup} variant="secondary" className="w-full justify-start text-sm h-12">
                <Save size={18} className="mr-3 text-cyan-400" /> Backup Database
              </Button>
              <Button onClick={handleRestore} variant="outline" className="w-full justify-start text-sm h-12">
                <UploadCloud size={18} className="mr-3 text-slate-400" /> Restore from File
              </Button>
            </div>
          </Card>

          {/* Reset Card */}
          <Card className="hover:border-red-500/30 transition-all border-slate-800 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 p-4 opacity-5 pointer-events-none">
              <ShieldAlert size={120} className="text-red-500" />
            </div>
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <ShieldAlert size={24} />
              <h2 className="text-lg font-bold">Danger Zone</h2>
            </div>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              Clear all transactions and inventory. <span className="text-red-400 font-bold">Cannot be undone.</span>
            </p>

            {!isResetting ? (
              <Button
                onClick={() => setIsResetting(true)}
                variant="danger"
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
              >
                <RefreshCw size={18} className="mr-2" /> Factory Reset
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleFactoryReset}
                  variant="danger"
                  className="flex-1 animate-pulse font-bold"
                >
                  CONFIRM
                </Button>
                <Button
                  onClick={() => setIsResetting(false)}
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            )}
          </Card>

          <div className="text-center pt-4">
            <Badge variant="neutral" className="bg-slate-950 font-mono text-[10px] tracking-wider text-slate-600">
              GamersEdge OS v2.1 • Licensed
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}