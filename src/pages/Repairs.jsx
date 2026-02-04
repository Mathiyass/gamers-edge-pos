import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronRight, Wrench, Clock, CheckCircle, AlertCircle, Printer, Trash2 } from 'lucide-react';
import RepairTicket from '../components/RepairTicket';

const COLUMNS = [
  { id: 'Pending', label: 'Pending', color: 'yellow', icon: Clock },
  { id: 'In_Progress', label: 'In Progress', color: 'blue', icon: Wrench },
  { id: 'Done', label: 'Ready for Pickup', color: 'emerald', icon: CheckCircle },
];

export default function Repairs() {
  const [repairs, setRepairs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ customer_id: '', device: '', issue: '', cost: '' });
  const [printData, setPrintData] = useState(null);

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
    if(!confirm("Delete this repair ticket?")) return;
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

  return (
    <div className="h-full p-6 flex flex-col overflow-hidden bg-slate-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Wrench className="text-cyan-400" /> Repair Operations
        </h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-cyan-900/20 transition-all"
        >
          <Plus size={18} /> New Ticket
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {COLUMNS.map(col => {
          const Icon = col.icon;
          const items = repairs.filter(r => r.status === col.id);
          const textColor = `text-${col.color}-400`;
          const bgColor = `bg-${col.color}-500/10`;

          return (
            <div key={col.id} className="flex-1 min-w-[320px] bg-slate-800/40 rounded-xl border border-slate-700/60 flex flex-col">
              <div className={`p-4 border-b border-slate-700/60 flex justify-between items-center ${bgColor}`}>
                <div className={`font-bold uppercase tracking-wider flex items-center gap-2 ${textColor}`}>
                  <Icon size={18} /> {col.label}
                </div>
                <span className="bg-slate-900 px-2.5 py-0.5 rounded text-xs font-mono text-slate-400">
                  {items.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {items.map(ticket => (
                  <div key={ticket.id} className="bg-slate-800 border border-slate-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-all group relative">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-100">{ticket.device}</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handlePrint(ticket)}
                          className="text-slate-500 hover:text-cyan-400 transition-colors"
                          title="Print Ticket"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(ticket.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          title="Delete Ticket"
                        >
                          <Trash2 size={16} />
                        </button>
                        <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                          #{ticket.id}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{ticket.issue}</p>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-700 pt-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                        {ticket.customer_name || 'Unknown'}
                      </div>
                      {ticket.cost > 0 && <span className="text-emerald-400 font-mono">${ticket.cost}</span>}
                    </div>

                    <button 
                      onClick={() => moveStatus(ticket.id, ticket.status)}
                      className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 bg-slate-700 hover:bg-cyan-600 text-white p-1.5 rounded-md transition-all"
                      title="Next Stage"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-600 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">Create Repair Ticket</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Customer</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none"
                    value={newTicket.customer_id}
                    onChange={e => setNewTicket({...newTicket, customer_id: e.target.value})}
                    required
                  >
                    <option value="">Select Customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Device Model</label>
                  <input 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none"
                    placeholder="e.g. PlayStation 5"
                    value={newTicket.device}
                    onChange={e => setNewTicket({...newTicket, device: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Issue Description</label>
                  <textarea 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none resize-none h-24"
                    placeholder="Does not turn on..."
                    value={newTicket.issue}
                    onChange={e => setNewTicket({...newTicket, issue: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Estimated Cost</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-cyan-500 outline-none"
                    placeholder="0.00"
                    value={newTicket.cost}
                    onChange={e => setNewTicket({...newTicket, cost: e.target.value})}
                  />
                </div>

                <div className="flex gap-3 mt-8">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold shadow-lg"
                  >
                    Create Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Print Ticket Component */}
      <RepairTicket data={printData} onClose={() => setPrintData(null)} />

    </div>
  );
}
