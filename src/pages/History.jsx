import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Search, Calendar, FileText, Trash2, Save, X, RotateCcw, TrendingUp, Clock, User, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';

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
        setEditData({ ...editData, items: newItems, total: newTotal });
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
        <div className="h-full flex flex-col space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
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

                <Input
                    icon={Search}
                    placeholder="Search Customer or ID..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-72"
                />
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden relative">
                {/* LEFT: Transaction List */}
                <div className="flex-1 overflow-hidden relative rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm shadow-xl">
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="pl-6">ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="text-right">Total (LKR)</TableHead>
                                    <TableHead className="text-right">Profit</TableHead>
                                    <TableHead className="text-center">Items</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence>
                                    {filtered.map(tx => (
                                        <motion.tr
                                            key={tx.id}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            onClick={() => openDetails(tx)}
                                            className={`transition-colors border-b border-slate-800/50 cursor-pointer ${selectedTx?.id === tx.id ? 'bg-emerald-900/20 hover:bg-emerald-900/30' : 'hover:bg-slate-800/50'}`}
                                        >
                                            <TableCell className="pl-6 font-mono font-bold text-slate-400">#{tx.id}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-200 text-xs">{new Date(tx.timestamp).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase font-mono">{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={tx.customer_name ? 'info' : 'neutral'} className="text-[10px] uppercase">
                                                    {tx.customer_name || 'Walk-in'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-emerald-400 font-mono">{tx.total.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-mono text-lime-400/80 text-xs">+{tx.profit?.toLocaleString() || 0}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="neutral" className="px-2 py-0.5">{tx.items.length}</Badge>
                                            </TableCell>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* RIGHT: Detail View / Editor */}
                <AnimatePresence mode="wait">
                    {selectedTx && (
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="w-[400px] z-30 h-full"
                        >
                            <Card className="h-full flex flex-col p-0 overflow-hidden border-slate-700 bg-slate-900 shadow-2xl">
                                <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                                    <div>
                                        <h2 className="font-bold text-white text-lg flex items-center gap-2"><FileText className="text-emerald-500" size={20} /> Details</h2>
                                        <p className="text-xs text-slate-500 font-mono">Transaction #{selectedTx.id}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedTx(null)}><X /></Button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-950/30">
                                    {!editMode ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                                                    <div className="p-2 bg-slate-800 rounded-lg text-slate-400"><Calendar size={18} /></div>
                                                    <div>
                                                        <div className="text-[10px] uppercase text-slate-500 font-bold">Date</div>
                                                        <div className="text-slate-200 text-xs font-bold">{new Date(selectedTx.timestamp).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                                                    <div className="p-2 bg-slate-800 rounded-lg text-slate-400"><Clock size={18} /></div>
                                                    <div>
                                                        <div className="text-[10px] uppercase text-slate-500 font-bold">Time</div>
                                                        <div className="text-slate-200 text-xs font-bold">{new Date(selectedTx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="border-b border-slate-800 pb-2 mb-4">
                                                    <div className="text-xs uppercase text-slate-500 font-bold tracking-wider">Customer Information</div>
                                                </div>
                                                <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/20">
                                                        {(selectedTx.customer_name || 'W').charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-bold text-lg">{selectedTx.customer_name || 'Walk-in Customer'}</div>
                                                        <Badge variant="neutral" className="mt-1">{selectedTx.payment_method || 'Cash'}</Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-end border-b border-slate-800 pb-2 mb-4">
                                                    <span className="text-xs uppercase text-slate-500 font-bold tracking-wider">Purchased Items</span>
                                                    <Badge variant="info">{selectedTx.items.length}</Badge>
                                                </div>
                                                <div className="space-y-3">
                                                    {selectedTx.items.map((item, i) => (
                                                        <div key={i} className="flex justify-between items-start bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                                                            <div className="flex-1 mr-4">
                                                                <div className="text-sm font-bold text-slate-200">{item.name}</div>
                                                                <div className="text-xs text-slate-500 font-mono mt-1">
                                                                    <span className="text-emerald-400 font-bold">{item.quantity}</span> x {item.price_sell.toLocaleString()}
                                                                </div>
                                                            </div>
                                                            <div className="text-sm font-bold text-white font-mono">
                                                                {(item.quantity * item.price_sell).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3 pt-6 border-t border-slate-800">
                                                <div className="flex justify-between text-sm text-slate-400 font-medium">
                                                    <span>Subtotal</span>
                                                    <span>{selectedTx.total.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-slate-400 font-medium">
                                                    <span>Discount</span>
                                                    <span>0.00</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                                                    <span className="text-white font-bold uppercase tracking-wider text-xs">Total Paid</span>
                                                    <span className="text-2xl font-black text-emerald-400 text-shadow-glow">LKR {selectedTx.total.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        // --- EDIT FORM ---
                                        <div className="space-y-6">
                                            <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex gap-3">
                                                <RotateCcw size={20} className="text-orange-400 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="text-orange-400 font-bold text-sm uppercase mb-1">Warning: Stock Adjustment</h4>
                                                    <p className="text-xs text-orange-200/70 leading-relaxed">
                                                        Modifying this transaction will automatically adjust stock levels for the affected products.
                                                    </p>
                                                </div>
                                            </div>

                                            <Input
                                                label="Customer Name"
                                                value={editData.customer_name}
                                                onChange={e => setEditData({ ...editData, customer_name: e.target.value })}
                                            />

                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Date & Time</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-emerald-500 outline-none transition-colors"
                                                    value={editData.timestamp.slice(0, 16)}
                                                    onChange={e => setEditData({ ...editData, timestamp: e.target.value })}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Items (Adjust Qty)</label>
                                                <div className="space-y-3">
                                                    {editData.items.map((item, i) => (
                                                        <div key={i} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                                                            <div className="overflow-hidden flex-1 mr-3">
                                                                <div className="text-sm font-bold text-slate-200 truncate">{item.name}</div>
                                                                <div className="text-[10px] text-slate-500 font-mono">
                                                                    {item.price_sell.toLocaleString()} / unit
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-1 border border-slate-700">
                                                                <button
                                                                    onClick={() => {
                                                                        const newItems = [...editData.items];
                                                                        if (newItems[i].quantity > 1) {
                                                                            newItems[i].quantity -= 1;
                                                                            const newTotal = newItems.reduce((sum, x) => sum + (x.price_sell * x.quantity), 0);
                                                                            setEditData({ ...editData, items: newItems, total: newTotal });
                                                                        }
                                                                    }}
                                                                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="font-mono text-white w-6 text-center text-sm font-bold">{item.quantity}</span>
                                                                <button
                                                                    onClick={() => {
                                                                        const newItems = [...editData.items];
                                                                        newItems[i].quantity += 1;
                                                                        const newTotal = newItems.reduce((sum, x) => sum + (x.price_sell * x.quantity), 0);
                                                                        setEditData({ ...editData, items: newItems, total: newTotal });
                                                                    }}
                                                                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>

                                                            <button onClick={() => removeItem(i)} className="ml-2 text-slate-600 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                                    {!editMode ? (
                                        <Button onClick={startEdit} variant="secondary" className="w-full py-4 text-base">
                                            <FileText size={18} className="mr-2" /> Edit / Correct Invoice
                                        </Button>
                                    ) : (
                                        <div className="flex gap-4">
                                            <Button variant="ghost" onClick={() => setEditMode(false)} className="flex-1">Cancel</Button>
                                            <Button variant="success" onClick={saveChanges} className="flex-1">
                                                <Save size={18} className="mr-2" /> Save Changes
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}