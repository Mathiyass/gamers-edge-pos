import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, Trash2, Save, X, Image as ImageIcon, Edit, Filter, TrendingUp, AlertTriangle, Download, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';

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

  const loadProducts = useCallback(async () => {
    if (!window.api) return;
    try {
      const res = await window.api.getProducts();
      setProducts(res);
    } catch (err) {
      console.error("Failed to load products", err);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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
    link.setAttribute('download', `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
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
    if (!confirm("Delete this product?")) return;
    try {
      await window.api.deleteProduct(id);
      loadProducts();
    } catch {
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
    if (showLowStockOnly && p.stock > 0) return false;

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
    <div className="h-full flex flex-col space-y-6">

      {/* Top Bar / Dashboard Header */}
      <div className="flex flex-col gap-6">
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

          <div className="flex gap-4">
            {showLowStockOnly && (
              <Badge variant="error" className="py-2 px-4 gap-2 text-xs" onClick={clearFilter}>
                <AlertTriangle size={14} /> Filtering: Low Stock <X size={14} className="cursor-pointer" />
              </Badge>
            )}
            <Card className="p-3 px-5 flex flex-col items-end min-w-[140px] bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Valuation</span>
              <span className="text-lg font-mono font-bold text-cyan-400">LKR {(totalStockValue / 1000000).toFixed(2)}M</span>
            </Card>
            <Card className="p-3 px-5 flex flex-col items-end min-w-[140px] bg-slate-900/50 backdrop-blur-sm border-slate-700/50">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Proj. Profit</span>
              <span className="text-lg font-mono font-bold text-lime-400">+ LKR {(potentialProfit / 1000000).toFixed(2)}M</span>
            </Card>
          </div>
        </div>

        <div className="flex justify-between items-center gap-4">
          {/* Category Tabs */}
          <div className="flex-1 overflow-x-auto pb-2 custom-scrollbar">
            <div className="flex gap-2">
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border ${selectedCategory === cat
                    ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Add */}
          <div className="flex gap-3 shrink-0">
            <Input
              icon={Search}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search SKU or Name..."
              className="w-64"
            />
            <Button
              variant="secondary"
              onClick={handleImportCSV}
              title="Import CSV"
            >
              <UploadCloud size={18} />
            </Button>
            <Button
              variant="secondary"
              onClick={exportCSV}
              title="Export CSV"
            >
              <Download size={18} />
            </Button>
            <Button
              onClick={openAddModal}
              className="shadow-lg shadow-cyan-900/20"
            >
              <Plus size={18} strokeWidth={3} /> Add Item
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Table */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Product</TableHead>
                <TableHead>SKU / ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right text-lime-400">Profit</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filtered.map(p => {
                  const profit = p.price_sell - p.price_buy;
                  const profitPercent = p.price_buy > 0 ? ((profit / p.price_buy) * 100).toFixed(1) : 0;
                  const isLowStock = p.stock === 0;

                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="transition-colors hover:bg-slate-800/50 border-b border-slate-800/50 group"
                    >
                      {/* Image & Name */}
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-cyan-500/50 transition-colors shadow-sm">
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
                      </TableCell>

                      {/* SKU */}
                      <TableCell className="font-mono text-xs text-slate-400">{p.sku}</TableCell>

                      {/* Category */}
                      <TableCell>
                        <Badge variant="neutral" className="text-[10px] uppercase">{p.category}</Badge>
                      </TableCell>

                      {/* Cost */}
                      <TableCell className="text-right font-mono text-slate-500">{p.price_buy.toLocaleString()}</TableCell>

                      {/* Price */}
                      <TableCell className="text-right font-mono font-bold text-white">{p.price_sell.toLocaleString()}</TableCell>

                      {/* Profit */}
                      <TableCell className="text-right font-mono">
                        <div className="flex flex-col items-end">
                          <span className="text-lime-400 font-bold">+{profit.toLocaleString()}</span>
                          <span className="text-[10px] text-lime-400/60">{profitPercent}%</span>
                        </div>
                      </TableCell>

                      {/* Stock Badge */}
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${p.stock === 0
                          ? 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          }`}>
                          {p.stock === 0 && <AlertTriangle size={12} />}
                          {p.stock === 0 ? 'Out' : p.stock}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(p)}><Edit size={16} className="text-cyan-400" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 size={16} className="text-red-400" /></Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit/Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl"
            >
              <Card className="bg-slate-900 border-slate-700 shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {isEditing ? <Edit className="text-cyan-500" /> : <Plus className="text-cyan-500" />}
                    {isEditing ? 'Modify Inventory' : 'New Acquisition'}
                  </h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}><X /></Button>
                </div>

                <div className="p-8 overflow-y-auto">
                  <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <Input
                        label="Product Name"
                        required name="name"
                        value={formData.name} onChange={handleInputChange}
                        placeholder="e.g. RTX 4090 Gaming OC"
                      />
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">SKU / Barcode</label>
                        <div className="relative">
                          <input
                            name="sku"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono text-white transition-all pr-16"
                            value={formData.sku} onChange={handleInputChange} placeholder="Auto-generated"
                          />
                          {!isEditing && (
                            <button type="button" onClick={() => setFormData({ ...formData, sku: '' })}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-slate-800 text-cyan-400 px-2 py-1 rounded border border-slate-700 hover:bg-slate-700">
                              AUTO
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Category</label>
                        <select name="category" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm focus:border-cyan-500 outline-none text-white appearance-none" value={formData.category} onChange={handleInputChange}>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <Input type="number" label="Cost (LKR)" name="price_buy" value={formData.price_buy} onChange={handleInputChange} />
                      <Input required type="number" label="Sale Price (LKR)" name="price_sell" value={formData.price_sell} onChange={handleInputChange} />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <Input required type="number" label="Stock Level" name="stock" value={formData.stock} onChange={handleInputChange} />
                      <Input label="Warranty" name="warranty" placeholder="e.g. 3 Years" value={formData.warranty} onChange={handleInputChange} />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Image URL</label>
                      <div className="flex gap-4">
                        <input name="image" className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm focus:border-cyan-500 outline-none text-white font-mono" placeholder="https://..." value={formData.image} onChange={handleInputChange} />
                        <div className="w-16 h-12 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden">
                          {formData.image ? <img src={formData.image} alt="Prev" className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-600" size={20} />}
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3 backdrop-blur-sm">
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" form="product-form" variant="primary">
                    <Save size={16} /> {isEditing ? 'Save Changes' : 'Add to Inventory'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}