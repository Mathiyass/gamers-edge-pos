import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Calendar, User, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function InvoiceEditor({ invoice, onClose, onSave, allProducts }) {
  const [editedInvoice, setEditedInvoice] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (invoice && (!editedInvoice || editedInvoice.id !== invoice.id)) {
      setEditedInvoice(JSON.parse(JSON.stringify(invoice)));
    }
  }, [invoice, editedInvoice]);

  if (!editedInvoice) return null;

  const handleUpdateField = (field, value) => {
    setEditedInvoice(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleQuantityChange = (index, delta) => {
    setEditedInvoice(prev => {
      const newItems = [...prev.items];
      const item = newItems[index];
      const newQty = Math.max(1, item.quantity + delta);
      newItems[index] = { ...item, quantity: newQty };
      return { ...prev, items: newItems };
    });
    setIsDirty(true);
  };

  const handleRemoveItem = (index) => {
    setEditedInvoice(prev => {
        const newItems = [...prev.items];
        newItems.splice(index, 1);
        return { ...prev, items: newItems };
    });
    setIsDirty(true);
  };

  const handleAddItem = (product) => {
      setEditedInvoice(prev => {
          const existingItemIndex = prev.items.findIndex(i => (i.product_id || i.id) === product.id);
          if (existingItemIndex >= 0) {
              const newItems = [...prev.items];
              newItems[existingItemIndex].quantity += 1;
              return { ...prev, items: newItems };
          } else {
              // Map product to invoice item structure
              return {
                  ...prev,
                  items: [...prev.items, {
                      product_id: product.id,
                      product_name: product.name,
                      quantity: 1,
                      price_at_sale: product.sell_price
                  }]
              };
          }
      });
      setIsDirty(true);
      setSearchTerm('');
  };

  // Recalculate totals
  const subtotal = editedInvoice.items.reduce((sum, item) => sum + ((item.price_at_sale || 0) * item.quantity), 0);
  
  // Ideally tax/discount logic should be consistent with POS. 
  // For this editor, we'll recalculate based on simple logic or existing ratios if preserved.
  // Let's use fixed tax for now or 0 if not specified.
  const tax = subtotal * 0.0; 
  const total = subtotal + tax - (editedInvoice.discount_amount || 0);

  const handleSave = () => {
      onSave({
          ...editedInvoice,
          total_amount: total,
          tax_amount: tax,
          discount_amount: editedInvoice.discount_amount || 0
      });
  };

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">#INV-{editedInvoice.id.toString().padStart(6, '0')}</span> 
              <span className="text-slate-500 text-sm font-normal">Editing Transaction</span>
            </h2>
            <div className="flex items-center gap-2 text-xs text-amber-500 mt-1">
                <AlertTriangle size={12} />
                <span>Edits will be audit logged.</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
            {/* Left: Invoice Details */}
            <div className="flex-1 p-6 overflow-y-auto border-r border-slate-800">
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Customer Name</label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-3 text-slate-400" />
                            <input 
                                type="text" 
                                value={editedInvoice.customer_name || ''} 
                                onChange={(e) => handleUpdateField('customer_name', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Date & Time</label>
                        <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-3 text-slate-400" />
                            {/* Note: In a real app, use a proper date-time picker library */}
                            <input 
                                type="datetime-local" 
                                value={format(new Date(editedInvoice.date_created), "yyyy-MM-dd'T'HH:mm")}
                                onChange={(e) => handleUpdateField('date_created', new Date(e.target.value).toISOString())}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-9 pr-3 text-sm focus:border-cyan-500 focus:outline-none transition-colors [color-scheme:dark]"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                         <label className="text-xs font-bold text-slate-500 uppercase">Purchased Items</label>
                         <div className="relative w-64">
                             <input 
                                type="text"
                                placeholder="Add product..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800 border-none rounded-md py-1.5 px-3 text-xs focus:ring-1 focus:ring-cyan-500"
                             />
                             {searchTerm && (
                                 <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 rounded-md shadow-xl mt-1 z-50">
                                     {filteredProducts.map(p => (
                                         <button 
                                            key={p.id}
                                            onClick={() => handleAddItem(p)}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700 border-b border-slate-700/50 last:border-0"
                                         >
                                             <div className="font-bold text-slate-200">{p.name}</div>
                                             <div className="text-slate-500">Stock: {p.stock}</div>
                                         </button>
                                     ))}
                                 </div>
                             )}
                         </div>
                    </div>

                    <div className="space-y-2">
                        {editedInvoice.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-lg border border-slate-800 group">
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-white">{item.product_name || item.product_name}</div>
                                    <div className="text-xs text-slate-500">LKR {(item.price_at_sale || 0).toLocaleString()}</div>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-900 rounded-md p-1 border border-slate-700">
                                    <button onClick={() => handleQuantityChange(idx, -1)} className="p-1 hover:text-cyan-400"><span className="sr-only">Decrease</span>-</button>
                                    <span className="text-xs w-6 text-center font-mono">{item.quantity}</span>
                                    <button onClick={() => handleQuantityChange(idx, 1)} className="p-1 hover:text-cyan-400"><span className="sr-only">Increase</span>+</button>
                                </div>
                                <div className="text-sm font-mono text-cyan-400 w-20 text-right">
                                    {((item.price_at_sale || 0) * item.quantity).toLocaleString()}
                                </div>
                                <button onClick={() => handleRemoveItem(idx)} className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Summary */}
            <div className="w-80 bg-slate-950/30 p-6 flex flex-col gap-4">
                 <h3 className="font-bold text-white">Summary</h3>
                 
                 <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-slate-400">
                        <span>Subtotal</span>
                        <span>LKR {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                        <span>Tax (0%)</span>
                        <span>LKR {tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                        <span>Discount</span>
                        <input 
                            type="number" 
                            className="w-20 bg-transparent text-right border-b border-slate-700 focus:border-cyan-500 focus:outline-none"
                            value={editedInvoice.discount_amount}
                            onChange={(e) => handleUpdateField('discount_amount', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="h-px bg-slate-800 my-2" />
                    <div className="flex justify-between text-lg font-bold text-cyan-400">
                        <span>Total</span>
                        <span>LKR {total.toLocaleString()}</span>
                    </div>
                 </div>

                 <div className="mt-auto space-y-3">
                     <button 
                        onClick={handleSave}
                        disabled={!isDirty}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 transition-all"
                     >
                        <Save size={18} />
                        Save Changes
                     </button>
                     <button onClick={onClose} className="w-full py-3 text-slate-400 hover:text-white font-medium">
                        Cancel
                     </button>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
}