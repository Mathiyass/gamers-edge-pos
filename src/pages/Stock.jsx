import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Trash2, Save, X, Image as ImageIcon, Edit, Filter, TrendingUp, AlertTriangle, Download, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

export default function Stock() {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isEditing, setIsEditing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const showLowStockOnly = searchParams.get('filter') === 'low';

  const initialFormState = {
    id: null,
    name: '', 
    sku: '', 
    category: 'GPU', 
    price_buy: '', 
    price_sell: '', 
    stock: '', 
    image: '', 
    warranty: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const loadProducts = async () => {
    if (!window.api) return;
    try {
      const res = await window.api.getProducts();
      setProducts(res);
    } catch (err) {
      console.error("Failed to load products", err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setFormData({
      ...product,
      price_buy: product.price_buy || '',
      price_sell: product.price_sell || '',
      stock: product.stock || '',
      image: product.image || '',
      warranty: product.warranty || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const exportCSV = () => {
    const headers = ["ID", "Name", "SKU", "Category", "Cost", "Price", "Stock", "Warranty"];
    const rows = products.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`, // Escape quotes
      p.sku,
      p.category,
      p.price_buy,
      p.price_sell,
      p.stock,
      `"${(p.warranty || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async () => {
    try {
      const res = await window.api.importProductsFromCSV();
      if (res.success) {
        alert(`Imported ${res.count} products successfully!`);
        loadProducts();
      } else if (res.message && res.message !== 'Cancelled') {
        alert(res.message);
      }
    } catch (e) {
      alert("Import Failed: " + e.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        price_buy: Number(formData.price_buy) || 0,
        price_sell: Number(formData.price_sell) || 0,
        stock: Number(formData.stock) || 0,
        image: formData.image || '',
        warranty: formData.warranty || ''
      };

      if (isEditing) {
        await window.api.updateProduct(productData);
      } else {
        await window.api.addProduct(productData);
      }

      setIsModalOpen(false);
      setFormData(initialFormState);
      loadProducts();
    } catch (err) {
      alert("Error saving product: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Delete this product?")) return;
    try {
      await window.api.deleteProduct(id);
      loadProducts();
    } catch (err) {
      alert("Failed to delete product");
    }
  };

  const clearFilter = () => {
    setSearchParams({});
  };

  // Filter Logic
  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    
    // Low Stock Filter
    if (showLowStockOnly && p.stock >= 5) return false;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    'GPU', 'CPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 
    'Cooling', 'Peripherals', 'Monitor', 'Laptop', 'Software', 'General'
  ];
  
  const allCategories = ['All', ...categories];

  // Stats for Header
  const totalStockValue = products.reduce((acc, p) => acc + (p.price_buy * p.stock), 0);
  const potentialProfit = products.reduce((acc, p) => acc + ((p.price_sell - p.price_buy) * p.stock), 0);

  return (
    <div className="h-full flex flex-col bg-[#0f172a] text-slate-200 font-sans selection:bg-cyan-500/30">
      
      {/* Top Bar / Dashboard Header */}
      <header className="px-8 py-6 border-b border-slate-800 bg-[#0f172a]/95 backdrop-blur-md sticky top-0 z-20 flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Package className="text-cyan-400" size={32} /> 
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Inventory Command</span>
            </h1>
            <p className="text-slate-400 mt-1 font-medium text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
              System Operational • {products.length} Items Total
            </p>
          </div>

          <div className="flex gap-6">
             {showLowStockOnly && (
                <div className="flex items-center">
                  <button 
                    onClick={clearFilter}
                    className="flex items-center gap-2 bg-rose-500/20 text-rose-400 px-4 py-2 rounded-lg border border-rose-500/50 hover:bg-rose-500/30 transition-all font-bold text-xs uppercase"
                  >
                    <AlertTriangle size={16} /> Filtering: Low Stock <X size={14} />
                  </button>
                </div>
             )}
             <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 px-5 flex flex-col items-end min-w-[140px]">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Valuation</span>
                <span className="text-lg font-mono font-bold text-cyan-400">LKR {(totalStockValue/1000).toFixed(1)}k</span>
             </div>
             <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 px-5 flex flex-col items-end min-w-[140px]">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Proj. Profit</span>
                <span className="text-lg font-mono font-bold text-lime-400">+ LKR {(potentialProfit/1000).toFixed(1)}k</span>
             </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-4">
          {/* Category Tabs */}
          <div className="flex-1 overflow-x-auto pb-1 custom-scrollbar">
             <div className="flex gap-2">
               {allCategories.map(cat => (
                 <button
                   key={cat}
                   onClick={() => setSelectedCategory(cat)}
                   className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all border ${
                     selectedCategory === cat
                       ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                       : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                   }`}
                 >
                   {cat}
                 </button>
               ))}
             </div>
          </div>

          {/* Search & Add */}
          <div className="flex gap-3 shrink-0">
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
                <input 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search SKU or Name..."
                  className="bg-slate-900 border border-slate-700 text-sm rounded-lg pl-9 pr-4 py-2 w-64 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600"
                />
             </div>
             <button
               onClick={handleImportCSV}
               className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-700 transition-all"
               title="Import CSV"
             >
               <UploadCloud size={16} /> Import
             </button>
             <button 
               onClick={exportCSV}
               className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-700 transition-all"
               title="Export CSV"
             >
               <Download size={16} /> Export
             </button>
             <button 
               onClick={openAddModal}
               className="bg-cyan-600 hover:bg-cyan-500 text-white pl-3 pr-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/20 transition-all transform hover:-translate-y-0.5"
             >
               <Plus size={16} strokeWidth={3} /> Add Item
             </button>
          </div>
        </div>
      </header>

      {/* Main Content Table */}
      <div className="flex-1 overflow-hidden p-6 pt-2">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden h-full flex flex-col shadow-2xl backdrop-blur-sm">
           <div className="overflow-y-auto flex-1 custom-scrollbar">
             <table className="w-full text-left border-collapse">
               <thead className="bg-[#0f172a]/90 backdrop-blur sticky top-0 z-10 text-xs font-bold uppercase text-slate-500 tracking-wider">
                 <tr className="border-b border-slate-800">
                   <th className="p-4 pl-6">Product</th>
                   <th className="p-4">SKU / ID</th>
                   <th className="p-4">Category</th>
                   <th className="p-4 text-right">Cost</th>
                   <th className="p-4 text-right">Price</th>
                   <th className="p-4 text-right text-lime-400">Profit</th>
                   <th className="p-4 text-center">Stock</th>
                   <th className="p-4 text-right pr-6">Actions</th>
                 </tr>
               </thead>
               <tbody className="text-sm divide-y divide-slate-800/50">
                 <AnimatePresence>
                   {filtered.map(p => {
                     const profit = p.price_sell - p.price_buy;
                     const profitPercent = p.price_buy > 0 ? ((profit / p.price_buy) * 100).toFixed(1) : 0;
                     const isLowStock = p.stock < 5;

                     return (
                       <motion.tr 
                         key={p.id}
                         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                         className="hover:bg-slate-800/40 transition-colors group"
                       >
                         {/* Image & Name */}
                         <td className="p-4 pl-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-cyan-500/50 transition-colors">
                                {p.image ? (
                                  <img src={p.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon size={16} className="text-slate-600" />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-200">{p.name}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">{p.warranty || 'No Warranty'}</div>
                              </div>
                           </div>
                         </td>
                         
                         {/* SKU */}
                         <td className="p-4 font-mono text-slate-400 text-xs">{p.sku}</td>
                         
                         {/* Category */}
                         <td className="p-4">
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 border border-slate-700 text-slate-400">
                             {p.category}
                           </span>
                         </td>

                         {/* Cost */}
                         <td className="p-4 text-right font-mono text-slate-500">{p.price_buy.toLocaleString()}</td>
                         
                         {/* Price */}
                         <td className="p-4 text-right font-mono font-bold text-white">{p.price_sell.toLocaleString()}</td>

                         {/* Profit */}
                         <td className="p-4 text-right font-mono">
                            <div className="flex flex-col items-end">
                               <span className="text-lime-400 font-bold">+{profit.toLocaleString()}</span>
                               <span className="text-[10px] text-lime-400/60">{profitPercent}%</span>
                            </div>
                         </td>

                         {/* Stock Badge */}
                         <td className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                              isLowStock 
                              ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' 
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                               {isLowStock && <AlertTriangle size={10} />}
                               {p.stock}
                            </span>
                         </td>

                         {/* Actions */}
                         <td className="p-4 text-right pr-6">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditModal(p)} className="p-2 hover:bg-cyan-500/10 text-slate-500 hover:text-cyan-400 rounded-lg transition-colors"><Edit size={16} /></button>
                              <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors"><Trash2 size={16} /></button>
                            </div>
                         </td>
                       </motion.tr>
                     );
                   })}
                 </AnimatePresence>
               </tbody>
             </table>
           </div>
        </div>
      </div>

      {/* Edit/Add Modal - Keeping simple clean dark aesthetics */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f172a] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {isEditing ? <Edit className="text-cyan-500"/> : <Plus className="text-cyan-500"/>} 
                  {isEditing ? 'Modify Inventory' : 'New Acquisition'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              
              <div className="p-8 overflow-y-auto">
                  <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-cyan-500 font-bold tracking-wider">Product Name</label>
                          <input 
                              required name="name"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-white transition-all" 
                              value={formData.name} onChange={handleInputChange} placeholder="e.g. RTX 4090 Gaming OC" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-cyan-500 font-bold tracking-wider">SKU / Barcode</label>
                          <div className="relative">
                              <input 
                                  name="sku"
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono text-white transition-all pr-24" 
                                  value={formData.sku} onChange={handleInputChange} placeholder="Auto-generated if empty" 
                              />
                              {!isEditing && (
                                <button type="button" onClick={() => setFormData({...formData, sku: ''})}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-slate-800 text-cyan-400 px-2 py-1 rounded border border-slate-700 hover:bg-slate-700">
                                    AUTO
                                </button>
                              )}
                          </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Category</label>
                          <select name="category" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none text-white" value={formData.category} onChange={handleInputChange}>
                              {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Cost (LKR)</label>
                          <input type="number" name="price_buy" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none text-white" value={formData.price_buy} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Sale Price (LKR)</label>
                          <input required type="number" name="price_sell" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none text-white" value={formData.price_sell} onChange={handleInputChange} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Stock Level</label>
                            <input required type="number" name="stock" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none text-white" value={formData.stock} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Warranty</label>
                            <input name="warranty" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none text-white" placeholder="e.g. 3 Years" value={formData.warranty} onChange={handleInputChange} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Image URL</label>
                        <div className="flex gap-4">
                            <input name="image" className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none text-white font-mono" placeholder="https://..." value={formData.image} onChange={handleInputChange} />
                            <div className="w-16 h-12 bg-slate-800 rounded border border-slate-700 flex items-center justify-center overflow-hidden">
                                 {formData.image ? <img src={formData.image} alt="Prev" className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-600" size={20}/>}
                            </div>
                        </div>
                    </div>
                  </form>
              </div>
              
              <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-bold text-xs uppercase tracking-wide">Cancel</button>
                  <button type="submit" form="product-form" className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2 text-xs uppercase tracking-wide">
                      <Save size={16} /> {isEditing ? 'Save Changes' : 'Add to Inventory'}
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}