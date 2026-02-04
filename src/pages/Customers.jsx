import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Trophy, Mail, Phone, User, Trash2, History, X, Save, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);

  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await window.api.getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load customers", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    setLoading(true);
    try {
      await window.api.addCustomer(formData);
      setFormData({ name: '', phone: '', email: '' });
      await loadCustomers();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this customer? This cannot be undone.")) return;
    try {
      await window.api.deleteCustomer(id);
      loadCustomers();
    } catch (err) {
      alert("Failed to delete customer");
    }
  };

  const handleViewHistory = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const history = await window.api.getCustomerHistory(customer.id);
      setCustomerHistory(history);
      setHistoryModalOpen(true);
    } catch (e) {
      console.error(e);
      alert("Failed to load history");
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  return (
    <div className="h-full flex gap-6 p-6 overflow-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Left: Add Form */}
      <div className="w-1/3 min-w-[320px] max-w-[400px] flex flex-col z-10">
        <Card className="flex flex-col h-fit">
          <div className="flex items-center gap-3 mb-6 text-cyan-400">
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">New Customer</h2>
              <p className="text-xs text-slate-500">Add to database</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              icon={User}
              placeholder="John Doe"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Phone"
              icon={Phone}
              type="tel"
              placeholder="+1 234 567 890"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Email"
              icon={Mail}
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="w-full mt-6 py-3 text-sm shadow-lg shadow-cyan-900/20"
            >
              Add to Database
            </Button>
          </form>
        </Card>

        {/* Stats or Info could go here */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Card className="p-4 bg-slate-900/50">
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Customers</div>
            <div className="text-2xl font-black text-white mt-1">{customers.length}</div>
          </Card>
          <Card className="p-4 bg-slate-900/50">
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Loyalty Members</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{customers.filter(c => c.points > 0).length}</div>
          </Card>
        </div>
      </div>

      {/* Right: List */}
      <div className="flex-1 flex flex-col z-10 min-w-0">
        <div className="flex-1 flex flex-col p-0 overflow-hidden bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl relative">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 p-2 rounded-lg text-amber-400">
                <Trophy size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Customer Directory</h2>
                <p className="text-xs text-slate-500">Manage profiles & loyalty</p>
              </div>
            </div>
            <Input
              icon={Search}
              placeholder="Search customers..."
              className="w-64"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-hidden relative bg-slate-950/30">
            <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-slate-900/50">
                    <TableHead className="pl-6">Customer</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead className="text-center">Loyalty Points</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                        No customers found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map(customer => (
                      <TableRow
                        key={customer.id}
                        className="group hover:bg-slate-800/50 transition-colors border-b border-slate-800/50"
                      >
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold group-hover:border-cyan-500/30 group-hover:text-cyan-400 transition-colors shadow-sm">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-200">{customer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Phone size={12} className="text-slate-600" /> {customer.phone}
                              </div>
                            )}
                            {customer.email && (
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Mail size={12} className="text-slate-600" /> {customer.email}
                              </div>
                            )}
                            {!customer.phone && !customer.email && <span className="text-xs text-slate-600 italic">No contact info</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 shadow-inner group-hover:border-slate-700">
                            <Star size={12} className={customer.points > 0 ? "text-amber-400 fill-amber-400" : "text-slate-700"} />
                            <span className={`font-mono font-bold text-sm ${customer.points > 0 ? "text-amber-400" : "text-slate-600"}`}>
                              {customer.points || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleViewHistory(customer)} title="View History">
                              <History size={16} className="text-cyan-400" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(customer.id)} title="Delete">
                              <Trash2 size={16} className="text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {historyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl"
            >
              <Card className="bg-[#0f172a] border border-slate-700 w-full rounded-2xl shadow-2xl flex flex-col max-h-[80vh] p-0 overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                      <History size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Purchase History</h3>
                      <p className="text-slate-400 text-xs font-mono">{selectedCustomer?.name}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setHistoryModalOpen(false)}><X /></Button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar bg-slate-950/30">
                  {customerHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-2">
                      <History size={48} strokeWidth={1} />
                      <p>No purchase history found.</p>
                    </div>
                  ) : (
                    customerHistory.map(tx => (
                      <div key={tx.id} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex flex-col gap-3 group">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-3">
                            <Badge variant="neutral" className="font-mono">#{tx.id}</Badge>
                            <span className="text-slate-500 text-xs font-medium">{new Date(tx.timestamp).toLocaleString()}</span>
                          </div>
                          <Badge variant={tx.payment_method === 'Split' ? 'info' : 'success'} className="text-[10px] uppercase">
                            {tx.payment_method || 'Cash'}
                          </Badge>
                        </div>
                        <div className="space-y-1.5 pl-1">
                          {tx.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm text-slate-300">
                              <span className="flex items-center gap-2">
                                <span className="text-slate-600 font-mono text-xs font-bold w-6 text-right">x{item.quantity}</span>
                                <span className="font-medium text-slate-200">{item.name}</span>
                              </span>
                              <span className="font-mono text-slate-500 text-xs">{item.price_sell.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-slate-800/50 pt-3 flex justify-between font-bold text-white items-center mt-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Amount</span>
                          <span className="text-lg text-cyan-400 font-mono tracking-tight">LKR {tx.total.toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}