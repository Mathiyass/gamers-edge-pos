import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, User, List, X, PauseCircle, PlayCircle, Percent, Gift, Award, Split, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Invoice from '../components/Invoice';
import { playSound } from '../utils/sounds';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState('');
  const [customerPoints, setCustomerPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [printData, setPrintData] = useState(null);

  // Split Payment State
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState({ cash: 0, card: 0 });

  // Features State
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);
  const [heldCarts, setHeldCarts] = useState([]);

  // Refs
  const searchInputRef = useRef(null);

  // --- Totals ---
  const subtotal = cart.reduce((sum, item) => sum + (item.price_sell * item.quantity), 0);
  const maxPointsRedeemable = Math.min(customerPoints, subtotal - discount);
  const pointsDiscount = usePoints ? maxPointsRedeemable : 0;

  const taxableAmount = Math.max(0, subtotal - discount - pointsDiscount);
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;

  // --- Keyboard Shortcuts & Scanner Logic ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F12' && cart.length > 0 && !isCheckoutOpen) {
        e.preventDefault();
        setSplitAmounts({ cash: total, card: 0 });
        setIsCheckoutOpen(true);
      }
      if (e.key === 'Escape') {
        if (isCheckoutOpen) setIsCheckoutOpen(false);
        if (isDiscountModalOpen) setIsDiscountModalOpen(false);
        if (isRecallModalOpen) setIsRecallModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isCheckoutOpen, isDiscountModalOpen, isRecallModalOpen, total]);

  // --- Print Trigger ---
  useEffect(() => {
    if (printData) {
      playSound('success');
      console.log(`[POS] Printing Invoice #${printData.id}`);
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [printData]);

  // --- Load Data ---
  useEffect(() => {
    if (window.api) {
      window.api.getProducts().then(setProducts).catch(console.error);
      window.api.getSettings().then(s => {
        if (s && s.taxRate) setTaxRate(parseFloat(s.taxRate) || 0);
      });
    }
  }, []);

  // --- Customer Point Lookup ---
  useEffect(() => {
    if (customer && window.api) {
        const timer = setTimeout(async () => {
            try {
                const customers = await window.api.getCustomers();
                const found = customers.find(c => c.name.toLowerCase() === customer.toLowerCase());
                setCustomerPoints(found ? found.points : 0);
            } catch (e) { console.error(e); }
        }, 500);
        return () => clearTimeout(timer);
    } else {
        if (customerPoints !== 0) setCustomerPoints(0);
    }
  }, [customer]);

  // --- Actions ---
  const addToCart = (product) => {
    playSound('beep');
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; 
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const newQty = Math.max(1, item.quantity + delta);
        if (product && newQty > product.stock) {
            playSound('error');
            return item; 
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));



  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      if (isSplitPayment) {
         const sum = (parseFloat(splitAmounts.cash)||0) + (parseFloat(splitAmounts.card)||0);
         if (Math.abs(sum - total) > 1) {
            alert(`Split amounts must equal Total (${total.toLocaleString()})`);
            return;
         }
      }

      const result = await window.api.createTransaction({
        items: cart,
        total,
        discount: discount + pointsDiscount,
        tax: taxAmount,
        pointsUsed: usePoints ? maxPointsRedeemable : 0,
        customer,
        paymentMethod: isSplitPayment ? 'Split' : paymentMethod,
        paymentDetails: isSplitPayment ? splitAmounts : null
      });
      
      const newInvoice = {
        id: result?.lastInsertRowid || 'NEW', 
        items: [...cart],
        total,
        tax: taxAmount,
        discount: discount + pointsDiscount,
        customer,
        paymentMethod: isSplitPayment ? 'Split' : paymentMethod,
        paymentDetails: isSplitPayment ? splitAmounts : null,
        date: new Date().toISOString()
      };
      
      setPrintData(newInvoice);

      // Reset
      setCart([]);
      setCustomer('');
      setPaymentMethod('Cash');
      setDiscount(0);
      setUsePoints(false);
      setCustomerPoints(0);
      setIsSplitPayment(false);
      setIsCheckoutOpen(false);
      
      const res = await window.api.getProducts();
      setProducts(res);
      
    } catch (err) {
      playSound('error');
      alert("Transaction Failed: " + err.message);
    }
  };

  // --- Hold/Recall ---
  const handleHoldCart = async () => {
    if (cart.length === 0) return;
    const name = prompt("Enter reference name for this cart:", customer || "Customer");
    if (!name) return;

    await window.api.holdCart({ customer: name, items: cart });
    setCart([]);
    setCustomer('');
    setDiscount(0);
    playSound('success');
  };

  const loadHeldCarts = async () => {
    const carts = await window.api.getHeldCarts();
    setHeldCarts(carts);
    setIsRecallModalOpen(true);
  };

  const restoreCart = async (heldCart) => {
    setCart(heldCart.items);
    setCustomer(heldCart.customer_name);
    await window.api.deleteHeldCart(heldCart.id);
    setIsRecallModalOpen(false);
    playSound('beep');
  };

  // --- Render ---
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(products.map(p => p.category))].sort();

  return (
    <div className="flex h-full bg-slate-950 text-slate-200 relative">
      
      {/* LEFT: Product Grid */}
      <div className="flex-1 flex flex-col p-6 pr-2">
        <header className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              ref={searchInputRef}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 focus:border-cyan-500 outline-none text-white placeholder-slate-500 transition-colors shadow-sm"
              placeholder="Search products (F2)..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto max-w-md pb-1 custom-scrollbar">
             {categories.map(c => (
                 <button 
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${
                        selectedCategory === c 
                        ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-900/20' 
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                 >
                    {c}
                 </button>
             ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <motion.button
                key={product.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={`text-left bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm group hover:border-cyan-500/50 transition-all ${product.stock <= 0 ? 'opacity-50 grayscale' : ''}`}
              >
                <div className="aspect-video bg-slate-950 relative">
                   {product.image ? (
                     <img src={product.image} className="w-full h-full object-cover" alt="" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-700"><LayoutGrid size={32} /></div>
                   )}
                   <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-mono font-bold border ${product.stock < 5 ? 'bg-red-900/80 text-red-200 border-red-800' : 'bg-slate-900/80 text-emerald-400 border-slate-800'}`}>
                       Stock: {product.stock}
                   </span>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-slate-200 truncate">{product.name}</h3>
                  <div className="text-cyan-400 font-bold mt-1">LKR {product.price_sell.toLocaleString()}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-10">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/95 backdrop-blur">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             <ShoppingCart className="text-cyan-500" /> Sale
           </h2>
           <div className="flex gap-2">
              <button onClick={handleHoldCart} disabled={cart.length===0} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Hold Cart"><PauseCircle size={18}/></button>
              <button onClick={loadHeldCarts} className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Recall Cart"><PlayCircle size={18}/></button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
          <AnimatePresence>
            {cart.map(item => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex gap-3 group relative hover:border-slate-700 transition-colors"
              >
                <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-slate-800">
                  {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <List size={20} className="text-slate-600"/>}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="font-bold text-sm text-slate-200 truncate">{item.name}</div>
                  <div className="text-xs text-cyan-400 font-mono mt-0.5">LKR {item.price_sell.toLocaleString()}</div>
                </div>
                
                <div className="flex flex-col items-end justify-between py-1">
                   <div className="flex items-center gap-3 bg-slate-900 rounded-lg border border-slate-800 p-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-white text-slate-500"><Minus size={14} /></button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-white text-slate-500"><Plus size={14} /></button>
                   </div>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="absolute -top-2 -right-2 bg-slate-800 text-slate-400 hover:text-red-400 rounded-full p-1 border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-3">
          <div className="flex justify-between text-slate-400 text-sm">
              <span>Subtotal</span>
              <span>{subtotal.toLocaleString()}</span>
          </div>
          
          {/* Discount Row */}
          <div className="flex justify-between text-slate-400 text-sm">
              <button onClick={() => setIsDiscountModalOpen(true)} className="flex items-center gap-1 text-cyan-500 hover:text-cyan-400 transition-colors">
                  <Percent size={14}/> Discount
              </button>
              <span className="text-red-400">-{discount.toLocaleString()}</span>
          </div>

          {/* Points Row (Visible if applied) */}
          {usePoints && (
             <div className="flex justify-between text-emerald-400 text-sm font-medium animate-pulse">
                <span className="flex items-center gap-1"><Award size={14}/> Points Redeemed</span>
                <span>-{pointsDiscount.toLocaleString()}</span>
             </div>
          )}

          {/* Tax Row */}
          {taxRate > 0 && (
             <div className="flex justify-between text-slate-400 text-sm">
                 <span>Tax ({taxRate}%)</span>
                 <span>+{taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
             </div>
          )}

          <div className="flex justify-between text-white font-bold text-xl pt-2 border-t border-slate-800">
              <span>Total</span>
              <span className="text-cyan-400">LKR {total.toLocaleString()}</span>
          </div>

          <button 
            onClick={() => {
              setSplitAmounts({ cash: total, card: 0 });
              setIsCheckoutOpen(true);
            }}
            disabled={cart.length === 0}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)] transition-all flex justify-center items-center gap-2"
          >
            <CreditCard size={20} /> Checkout (F12)
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Complete Sale</h2>
                    <button onClick={() => setIsCheckoutOpen(false)}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <form onSubmit={handleCheckout}>
                    <div className="mb-6">
                        <label className="text-xs uppercase font-bold text-slate-500 mb-2 block">Customer Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                autoFocus
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-cyan-500 text-white transition-colors"
                                placeholder="Enter Name (or leave blank for Walk-in)"
                                value={customer} onChange={e => setCustomer(e.target.value)}
                            />
                        </div>
                        {/* Loyalty Points Badge */}
                        {customerPoints > 0 && (
                            <div className="mt-2 flex justify-between items-center bg-emerald-900/20 border border-emerald-500/30 p-2 rounded-lg">
                                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                                    <Award size={16} />
                                    <span>{customerPoints} Points Available</span>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setUsePoints(!usePoints)}
                                    className={`text-xs font-bold px-3 py-1 rounded transition-colors ${usePoints ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-emerald-400 border border-emerald-500/50'}`}
                                >
                                    {usePoints ? 'Redeeming' : 'Redeem'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                         <label className="text-xs uppercase font-bold text-slate-500 block">Payment Method</label>
                         <button
                            type="button"
                            onClick={() => setIsSplitPayment(!isSplitPayment)}
                            className={`text-xs flex items-center gap-1 font-bold px-2 py-0.5 rounded transition-colors ${isSplitPayment ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-indigo-400 border border-indigo-500/30'}`}
                         >
                            <Split size={12}/> Split Payment
                         </button>
                      </div>

                      {!isSplitPayment ? (
                        <div className="flex gap-4">
                            <button
                            type="button"
                            onClick={() => setPaymentMethod('Cash')}
                            className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                                paymentMethod === 'Cash'
                                ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg'
                                : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                            >
                            Cash
                            </button>
                            <button
                            type="button"
                            onClick={() => setPaymentMethod('Card')}
                            className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                                paymentMethod === 'Card'
                                ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg'
                                : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                            >
                            Card
                            </button>
                        </div>
                      ) : (
                        <div className="space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                           <div className="flex items-center gap-3">
                              <span className="w-12 text-sm font-bold text-slate-400">Cash</span>
                              <input
                                type="number"
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-cyan-500"
                                value={splitAmounts.cash}
                                onChange={e => setSplitAmounts({...splitAmounts, cash: parseFloat(e.target.value)||0})}
                              />
                           </div>
                           <div className="flex items-center gap-3">
                              <span className="w-12 text-sm font-bold text-slate-400">Card</span>
                              <input
                                type="number"
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-cyan-500"
                                value={splitAmounts.card}
                                onChange={e => setSplitAmounts({...splitAmounts, card: parseFloat(e.target.value)||0})}
                              />
                           </div>
                           <div className="text-right text-xs text-slate-500 pt-1">
                              Remaining: <span className={`${Math.abs((splitAmounts.cash + splitAmounts.card) - total) > 1 ? 'text-red-400' : 'text-emerald-400'} font-bold`}>
                                {(total - (splitAmounts.cash + splitAmounts.card)).toLocaleString()}
                              </span>
                           </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between mb-6 p-4 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-400">Total Amount</span>
                        <span className="text-xl font-bold text-cyan-400">LKR {total.toLocaleString()}</span>
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5">
                        Confirm Payment & Print
                    </button>
                </form>
            </motion.div>
        </div>
      )}

      {/* Discount Modal */}
      {isDiscountModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-4">Apply Discount</h3>
                <input 
                    type="number" 
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white mb-4 outline-none focus:border-cyan-500" 
                    placeholder="Enter amount (LKR)"
                    value={discount || ''}
                    onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                />
                <button onClick={() => setIsDiscountModalOpen(false)} className="w-full bg-cyan-600 text-white font-bold py-2 rounded-lg">Apply</button>
            </div>
        </div>
      )}

      {/* Recall Modal */}
      {isRecallModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Recall Held Cart</h3>
                    <button onClick={() => setIsRecallModalOpen(false)}><X className="text-slate-500 hover:text-white"/></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                    {heldCarts.length === 0 ? <p className="text-slate-500 text-center">No held carts.</p> : 
                    heldCarts.map(c => (
                        <div key={c.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center hover:border-cyan-500/50 cursor-pointer transition-colors" onClick={() => restoreCart(c)}>
                            <div>
                                <div className="font-bold text-white">{c.customer_name}</div>
                                <div className="text-xs text-slate-500">{new Date(c.timestamp).toLocaleString()}</div>
                                <div className="text-xs text-cyan-400 mt-1">{c.items.length} Items</div>
                            </div>
                            <PlayCircle className="text-slate-400 hover:text-white" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      <Invoice data={printData} onClose={() => setPrintData(null)} />

    </div>
  );
}