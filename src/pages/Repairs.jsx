import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronRight, Wrench, Clock, CheckCircle, AlertCircle, Printer, Trash2, X, Search, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RepairTicket from '../components/RepairTicket';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

const COLUMNS = [
  { id: 'Pending', label: 'Pending', color: 'amber', icon: Clock, borderColor: 'border-amber-500/30' },
  { id: 'In_Progress', label: 'In Progress', color: 'blue', icon: Wrench, borderColor: 'border-blue-500/30' },
  { id: 'Done', label: 'Ready for Pickup', color: 'emerald', icon: CheckCircle, borderColor: 'border-emerald-500/30' },
];

export default function Repairs() {
  const [repairs, setRepairs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ customer_id: '', device: '', issue: '', cost: '' });
  const [printData, setPrintData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([
        window.api.getRepairs(),
        window.api.getCustomers()
      ]);
      setRepairs(Array.isArray(r) ? r : []);
      setCustomers(Array.isArray(c) ? c : []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const moveStatus = async (id, currentStatus) => {
    const nextMap = { 'Pending': 'In_Progress', 'In_Progress': 'Done', 'Done': 'Pending' };
    const next = nextMap[currentStatus];
    if (!next) return;

    // Optimistic UI Update
    setRepairs(prev => prev.map(t => t.id === id ? { ...t, status: next } : t));
    await window.api.updateRepairStatus(id, next);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this repair ticket?")) return;
    await window.api.deleteRepair(id);
    loadData();
  };

  const handlePrint = (ticket) => {
    setPrintData(ticket);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTicket.customer_id || !newTicket.device) return;

    await window.api.addRepair({
      ...newTicket,
      cost: parseFloat(newTicket.cost) || 0
    });
    setIsModalOpen(false);
    setNewTicket({ customer_id: '', device: '', issue: '', cost: '' });
    loadData();
  };

  const filteredRepairs = repairs.filter(r =>
    r.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full p-6 flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="flex justify-between items-center mb-6 z-10 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Wrench className="text-cyan-400" size={32} />
            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Repair Operations</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium text-sm flex items-center gap-2">
            Kanban Board for Service Tracking
          </p>
        </div>

        <div className="flex gap-4">
          <Input
            icon={Search}
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            className="shadow-lg shadow-cyan-900/20"
          >
            <Plus size={18} /> New Ticket
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 z-10">
        {COLUMNS.map(col => {
          const Icon = col.icon;
          const items = filteredRepairs.filter(r => r.status === col.id);
          const colorStyles = {
            amber: 'text-amber-400 from-amber-500/20 to-amber-500/5 border-amber-500/30',
            blue: 'text-blue-400 from-blue-500/20 to-blue-500/5 border-blue-500/30',
            emerald: 'text-emerald-400 from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
          }[col.color];

          return (
            <div key={col.id} className="flex-1 min-w-[350px] flex flex-col h-full">
              <div className={`p-4 rounded-t-2xl border-x border-t bg-gradient-to-b ${colorStyles} backdrop-blur-sm flex justify-between items-center`}>
                <div className="font-bold uppercase tracking-wider flex items-center gap-2">
                  <Icon size={18} /> {col.label}
                </div>
                <Badge variant="neutral" className="bg-black/20 border-white/10 text-white font-mono">{items.length}</Badge>
              </div>

              <div className={`flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-slate-900/40 border-x border-b border-slate-700/50 rounded-b-2xl backdrop-blur-sm ${col.borderColor}`}>
                <AnimatePresence>
                  {items.map(ticket => (
                    <motion.div
                      layoutId={ticket.id}
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 p-4 rounded-xl shadow-lg hover:shadow-xl hover:border-cyan-500/30 transition-all group relative group cursor-default"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 font-bold text-slate-100">
                          <Smartphone size={16} className="text-slate-500" />
                          {ticket.device}
                        </div>
                        <Badge variant="neutral" className="text-[10px] font-mono opacity-60">#{ticket.id}</Badge>
                      </div>

                      <p className="text-sm text-slate-400 mb-4 line-clamp-3 bg-slate-900/50 p-2 rounded-lg border border-slate-800/50 min-h-[3rem]">
                        {ticket.issue}
                      </p>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 border border-slate-600">
                            {ticket.customer_name ? ticket.customer_name.charAt(0) : '?'}
                          </div>
                          <span className="font-medium text-slate-300">{ticket.customer_name || 'Unknown'}</span>
                        </div>
                        {ticket.cost > 0 && <span className="text-emerald-400 font-mono font-bold bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/20">${ticket.cost}</span>}
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-slate-800/90 rounded-lg p-1 border border-slate-700 shadow-xl backdrop-blur">
                        <button onClick={() => handlePrint(ticket)} className="p-1.5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 rounded transition-colors" title="Print"><Printer size={14} /></button>
                        <button onClick={() => handleDelete(ticket.id)} className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors" title="Delete"><Trash2 size={14} /></button>
                        <div className="w-px h-4 bg-slate-700 mx-0.5 my-auto"></div>
                        <button onClick={() => moveStatus(ticket.id, ticket.status)} className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded transition-colors" title="Next Stage"><ChevronRight size={14} /></button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {items.length === 0 && (
                  <div className="text-center py-10 opacity-30 flex flex-col items-center">
                    <Icon size={48} strokeWidth={1} />
                    <span className="text-sm font-bold mt-2">No tickets</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md"
            >
              <Card className="bg-[#0f172a] border border-slate-700 w-full rounded-2xl shadow-2xl overflow-hidden p-0">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Plus className="text-cyan-400" /> New Ticket
                  </h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}><X /></Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Customer</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition-all appearance-none"
                      value={newTicket.customer_id}
                      onChange={e => setNewTicket({ ...newTicket, customer_id: e.target.value })}
                      required
                    >
                      <option value="">Select Customer...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                    </select>
                  </div>

                  <Input
                    label="Device Model"
                    placeholder="e.g. PlayStation 5"
                    value={newTicket.device}
                    onChange={e => setNewTicket({ ...newTicket, device: e.target.value })}
                    required
                  />

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Issue Description</label>
                    <textarea
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none resize-none h-24 placeholder:text-slate-600 transition-all font-sans text-sm"
                      placeholder="Describe the problem..."
                      value={newTicket.issue}
                      onChange={e => setNewTicket({ ...newTicket, issue: e.target.value })}
                    />
                  </div>

                  <Input
                    label="Estimated Cost"
                    type="number"
                    placeholder="0.00"
                    value={newTicket.cost}
                    onChange={e => setNewTicket({ ...newTicket, cost: e.target.value })}
                  />

                  <div className="flex gap-3 mt-8 pt-4 border-t border-slate-800">
                    <Button variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" type="submit" className="flex-1 shadow-lg shadow-cyan-900/20">Create Ticket</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Ticket Component */}
      <RepairTicket data={printData} onClose={() => setPrintData(null)} />

    </div>
  );
}
