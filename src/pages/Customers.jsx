import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Trophy, Mail, Phone, User, Trash2 } from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(false);

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

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  return (
    <div className="h-full flex gap-6 p-6 overflow-hidden bg-slate-900 text-slate-100">
      
      {/* Left: Add Form */}
      <div className="w-1/3 min-w-[320px] bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 flex flex-col shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6 text-cyan-400">
          <UserPlus size={28} />
          <h2 className="text-2xl font-bold tracking-tight">New Customer</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5 flex-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="John Doe"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-10 p-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                type="tel"
                placeholder="+1 234 567 890"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-10 p-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                type="email"
                placeholder="john@example.com"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg pl-10 p-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add to Database'}
          </button>
        </form>
      </div>

      {/* Right: List */}
      <div className="flex-1 bg-slate-800/30 rounded-2xl border border-slate-700/50 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 bg-slate-800/80 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-cyan-500/10 p-2 rounded-lg text-cyan-400">
              <Trophy size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Loyalty Program</h2>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search customers..."
              className="w-full bg-slate-900 border border-slate-700 rounded-full pl-9 py-2 text-sm focus:border-cyan-500 outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredCustomers.length === 0 ? (
            <div className="text-center text-slate-500 mt-20">No customers found</div>
          ) : (
            filteredCustomers.map(customer => (
              <div key={customer.id} className="group bg-slate-800 hover:bg-slate-700/50 border border-slate-700 p-4 rounded-xl flex justify-between items-center transition-all hover:border-cyan-500/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200">{customer.name}</h3>
                    <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                      {customer.phone && <span className="flex items-center gap-1"><Phone size={10} /> {customer.phone}</span>}
                      {customer.email && <span className="flex items-center gap-1"><Mail size={10} /> {customer.email}</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Points Balance</div>
                    <button onClick={() => handleDelete(customer.id)} className="text-slate-600 hover:text-red-400 p-1 rounded transition-colors"><Trash2 size={16}/></button>
                  </div>
                  <div className="bg-slate-900 px-3 py-1 rounded-full border border-slate-700 text-emerald-400 font-mono font-bold shadow-inner">
                    {customer.points || 0}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
