import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Search, Calendar, FileText, Trash2, Save, X, RotateCcw, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit Mode State
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);

  const loadHistory = async () => {
    if (window.api) {
      const res = await window.api.getTransactions();
      setTransactions(res);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const openDetails = (tx) => {
    setSelectedTx(tx);
    setEditMode(false);
    setEditData(null);
  };

  const startEdit = () => {
    setEditMode(true);
    setEditData(JSON.parse(JSON.stringify(selectedTx))); // Deep copy
  };

  const removeItem = (index) => {
     const newItems = [...editData.items];
     newItems.splice(index, 1);
     const newTotal = newItems.reduce((sum, item) => sum + (item.price_sell * item.quantity), 0);
     setEditData({...editData, items: newItems, total: newTotal});
  };

  const saveChanges = async () => {
      try {
        await window.api.updateTransaction({
            id: editData.id,
            newDate: editData.timestamp,
            newItems: editData.items,
            newCustomer: editData.customer_name,
            newTotal: editData.total
        });
        alert("Transaction Updated & Stock Restored!");
        setEditMode(false);
        setSelectedTx(null);
        loadHistory();
      } catch (err) {
        alert("Update Failed: " + err.message);
      }
  };

  const filtered = transactions.filter(tx => 
     (tx.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
     tx.id.toString().includes(searchTerm)
  );

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-200 font-sans selection:bg-emerald-500/30">
       
      {/* Header */}
      <header className="px-8 py-6 border-b border-slate-800 bg-[#0f172a]/95 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <HistoryIcon className="text-emerald-500" size={32} /> 
            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Sales History</span>
          </h1>
          <p className="text-slate-400 mt-1 font-medium text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {transactions.length} Records Found
          </p>
        </div>
        
        <div className="relative group">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
             <input 
               type="text" placeholder="Search Customer or ID..." 
               value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
               className="pl-10 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:border-emerald-500 outline-none w-72 text-white placeholder:text-slate-600 transition-all focus:ring-1 focus:ring-emerald-500"
             />
        </div>
      </header>

      <div className="flex-1 flex gap-6 overflow-hidden p-6 pt-2">
         {/* LEFT: Transaction List */}
         <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-sm">
            <div className="overflow-y-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0f172a]/90 backdrop-blur sticky top-0 z-10 border-b border-slate-800">
                        <tr className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                            <th className="p-4 pl-6">ID</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4 text-right">Total (LKR)</th>
                            <th className="p-4 text-right">Profit</th>
                            <th className="p-4 text-center">Items</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-800/50">
                        <AnimatePresence>
                        {filtered.map(tx => (
                            <motion.tr 
                              key={tx.id} 
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              onClick={() => openDetails(tx)}
                              className={`hover:bg-slate-800/60 cursor-pointer transition-colors ${selectedTx?.id === tx.id ? 'bg-emerald-900/10' : ''}`}
                            >
                                <td className="p-4 pl-6 font-mono text-slate-400 font-bold">#{tx.id}</td>
                                <td className="p-4 text-sm text-slate-300">
                                    <div className="font-medium text-white">{new Date(tx.timestamp).toLocaleDateString()}</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase">{new Date(tx.timestamp).toLocaleTimeString()}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${tx.customer_name ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-800/50 border-slate-800 text-slate-500'}`}>
                                        {tx.customer_name || 'Walk-in'}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-bold text-emerald-400 font-mono text-base">{tx.total.toLocaleString()}</td>
                                <td className="p-4 text-right font-mono text-lime-400/80 text-xs">+{tx.profit?.toLocaleString() || 0}</td>
                                <td className="p-4 text-center">
                                    <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded-full text-xs font-bold">{tx.items.length}</span>
                                </td>
                            </motion.tr>
                        ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
         </div>

         {/* RIGHT: Detail View / Editor */}
         <AnimatePresence>
            {selectedTx && (
                <motion.div 
                   initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                   className="w-[400px] bg-[#0f172a] border-l border-slate-800 shadow-2xl flex flex-col z-30"
                >
                    <div className="p-6 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center">
                        <div>
                            <h2 className="font-bold text-white text-lg">Transaction Details</h2>
                            <p className="text-xs text-slate-500 font-mono">ID: #{selectedTx.id}</p>
                        </div>
                        <button onClick={() => setSelectedTx(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-900/20">
                        {!editMode ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Date</label>
                                        <div className="text-slate-200 text-sm font-medium">{new Date(selectedTx.timestamp).toLocaleDateString()}</div>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                                        <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Time</label>
                                        <div className="text-slate-200 text-sm font-medium">{new Date(selectedTx.timestamp).toLocaleTimeString()}</div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block">Customer Info</label>
                                    <div className="flex items-center gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
                                        <div className="w-10 h-10 rounded-full bg-emerald-900/30 text-emerald-400 flex items-center justify-center font-bold text-lg">
                                            {(selectedTx.customer_name || 'W').charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-white font-bold">{selectedTx.customer_name || 'Walk-in Customer'}</div>
                                            <div className="text-xs text-slate-500">Payment: {selectedTx.payment_method || 'Cash'}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block flex justify-between">
                                        <span>Items Purchased</span>
                                        <span className="text-slate-400">{selectedTx.items.length} Items</span>
                                    </label>
                                    <div className="space-y-2">
                                        {selectedTx.items.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800/50">
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-slate-200">{item.name}</div>
                                                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                        {item.quantity} x {item.price_sell.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="text-sm font-bold text-emerald-400 font-mono">
                                                    {(item.quantity * item.price_sell).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-800">
                                    <div className="flex justify-between text-sm text-slate-400">
                                        <span>Subtotal</span>
                                        <span>{selectedTx.total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-400">
                                        <span>Discount</span>
                                        <span>0.00</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-white font-bold">Total Paid</span>
                                        <span className="text-2xl font-black text-emerald-400">LKR {selectedTx.total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // --- EDIT FORM ---
                            <div className="space-y-6">
                                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
                                    <div className="flex gap-2 text-orange-400 font-bold text-xs uppercase mb-1">
                                        <RotateCcw size={14}/> Warning
                                    </div>
                                    <p className="text-xs text-orange-200/70 leading-relaxed">
                                        Modifying this transaction will automatically adjust stock levels for the affected products.
                                    </p>
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Customer Name</label>
                                    <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none transition-colors" 
                                       value={editData.customer_name} onChange={e => setEditData({...editData, customer_name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Date</label>
                                    <input type="datetime-local" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:border-emerald-500 outline-none transition-colors" 
                                       value={editData.timestamp.slice(0, 16)} onChange={e => setEditData({...editData, timestamp: e.target.value})} />
                                </div>
                                
                                <div>
                                    <label className="text-[10px] uppercase text-slate-500 font-bold mb-2 block">Items (Adjust Qty)</label>
                                    <div className="space-y-2">
                                        {editData.items.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800">
                                                <div className="overflow-hidden flex-1 mr-2">
                                                    <div className="text-sm font-bold text-slate-200 truncate">{item.name}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">
                                                        {item.price_sell.toLocaleString()} / unit
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800">
                                                    <button 
                                                        onClick={() => {
                                                            const newItems = [...editData.items];
                                                            if (newItems[i].quantity > 1) {
                                                                newItems[i].quantity -= 1;
                                                                const newTotal = newItems.reduce((sum, x) => sum + (x.price_sell * x.quantity), 0);
                                                                setEditData({...editData, items: newItems, total: newTotal});
                                                            }
                                                        }}
                                                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="font-mono text-white w-6 text-center text-sm font-bold">{item.quantity}</span>
                                                    <button 
                                                        onClick={() => {
                                                            const newItems = [...editData.items];
                                                            newItems[i].quantity += 1;
                                                            const newTotal = newItems.reduce((sum, x) => sum + (x.price_sell * x.quantity), 0);
                                                            setEditData({...editData, items: newItems, total: newTotal});
                                                        }}
                                                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <button onClick={() => removeItem(i)} className="ml-2 text-slate-600 hover:text-red-400 p-1.5 rounded transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-800 bg-[#0f172a]">
                        {!editMode ? (
                             <button onClick={startEdit} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg">
                                 <FileText size={18} /> Edit / Correct Invoice
                             </button>
                        ) : (
                            <div className="flex gap-4">
                                <button onClick={() => setEditMode(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3.5 rounded-xl transition-colors">Cancel</button>
                                <button onClick={saveChanges} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2 transition-all">
                                    <Save size={18} /> Save Changes
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
}