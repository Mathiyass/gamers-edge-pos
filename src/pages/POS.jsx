import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, User, List, X, PauseCircle, PlayCircle, Percent, Gift, Award, Split, LayoutGrid, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Invoice from '../components/Invoice';
import { playSound } from '../utils/sounds';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

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
      setCustomerPoints(prev => prev !== 0 ? 0 : prev);
    }
  }, [customer]);

  // --- Actions ---
  const addToCart = React.useCallback((product) => {
    playSound('beep');
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = React.useCallback((id, delta) => {
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
  }, [products]);

  const removeFromCart = React.useCallback((id) => setCart(prev => prev.filter(item => item.id !== id)), []);

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      if (isSplitPayment) {
        const sum = (parseFloat(splitAmounts.cash) || 0) + (parseFloat(splitAmounts.card) || 0);
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
  const filteredProducts = React.useMemo(() => products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }), [products, searchTerm, selectedCategory]);

  const categories = React.useMemo(() => ['All', ...new Set(products.map(p => p.category))].sort(), [products]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex h-full gap-6 relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black"
    >
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen" />
      </div>

      {/* LEFT: Product Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex gap-4 mb-6 shrink-0">
          <Input
            ref={searchInputRef}
            icon={Search}
            className="flex-1"
            placeholder="Search products (F2)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div className="flex gap-2 overflow-x-auto max-w-md pb-1 custom-scrollbar">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 border ${selectedCategory === c
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] neon-border'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30'
                  }`}
              >
                {c}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <motion.button
                key={product.id}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={`text-left glass-card rounded-2xl overflow-hidden group hover:border-cyan-400/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] transition-all duration-300 flex flex-col h-full ${product.stock <= 0 ? 'opacity-50 grayscale' : ''}`}
              >
                <div className="aspect-[4/3] bg-slate-950/80 relative overflow-hidden border-b border-white/5">
                  {product.image ? (
                    <img src={product.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-900/50 group-hover:text-cyan-500/30 transition-colors">
                      <Package size={40} strokeWidth={1} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className={`absolute top-2 right-2 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border backdrop-blur-md shadow-lg ${product.stock === 0
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                    {product.stock === 0 ? 'Out of Stock' : `${product.stock} Left`}
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1 relative z-10">
                  <h3 className="font-bold text-slate-200 text-sm leading-tight mb-3 line-clamp-2 group-hover:text-cyan-300 transition-colors">{product.name}</h3>
                  <div className="mt-auto flex justify-between items-end">
                    <div className="text-cyan-400 font-black text-lg drop-shadow-md">
                      <span className="text-xs text-slate-500 font-medium mr-1 uppercase tracking-widest">LKR</span>
                      {product.price_sell.toLocaleString()}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-800/80 text-cyan-400 border border-slate-700 flex items-center justify-center -mr-1 group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-cyan-400 transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0)] group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                      <Plus size={16} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Cart */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="w-[420px] flex flex-col p-0 overflow-hidden rounded-2xl glass-card shadow-[0_0_40px_rgba(0,0,0,0.5)] border-r-0 border-b-0"
      >
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-950/40 backdrop-blur-md">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 neon-text">
            <ShoppingCart className="text-cyan-400" /> Current Sale
          </h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleHoldCart} disabled={cart.length === 0} title="Hold Cart"><PauseCircle size={20} /></Button>
            <Button variant="ghost" size="icon" onClick={loadHeldCarts} title="Recall Cart"><PlayCircle size={20} /></Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar space-y-3 bg-slate-950/30">
          <AnimatePresence mode="popLayout">
            {cart.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-slate-600 gap-4">
                <ShoppingCart size={48} strokeWidth={1} className="opacity-50" />
                <p className="text-sm font-medium">Cart is empty</p>
                <div className="text-xs px-3 py-1 bg-slate-900 rounded border border-slate-800">Press F2 to search</div>
              </motion.div>
            )}
            {cart.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                className="bg-slate-900/40 border border-white/5 rounded-xl p-3 flex gap-3 group relative hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all shadow-lg backdrop-blur-sm"
              >
                <div className="w-14 h-14 bg-slate-950 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-slate-800">
                  {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package size={20} className="text-slate-700" />}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="font-bold text-sm text-slate-200 truncate pr-6">{item.name}</div>
                  <div className="text-xs text-cyan-400 font-mono mt-0.5">LKR {item.price_sell.toLocaleString()}</div>
                </div>

                <div className="flex flex-col items-end justify-between py-0.5">
                  <div className="flex items-center gap-1 bg-slate-950 rounded-lg border border-slate-800 p-0.5 shadow-inner">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors"><Minus size={12} /></button>
                    <span className="text-xs font-bold w-6 text-center text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors"><Plus size={12} /></button>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500 rounded-full border border-slate-700 opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"
                >
                  <X size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="shrink-0 p-6 glass border-t border-white/10 space-y-4">
          <div className="space-y-3 pb-5 border-b border-white/10">
            <div className="flex justify-between text-slate-400 text-sm font-medium">
              <span>Subtotal</span>
              <span className="text-slate-300">{subtotal.toLocaleString()}</span>
            </div>

            {/* Discount Row */}
            <div className="flex justify-between items-center text-slate-400 text-sm h-6">
              <button onClick={() => setIsDiscountModalOpen(true)} className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors text-xs font-bold uppercase tracking-wider bg-cyan-500/10 px-2 py-1 rounded-md border border-cyan-500/20">
                <Percent size={12} /> {discount > 0 ? 'Edit Discount' : 'Add Discount'}
              </button>
              {discount > 0 && <span className="text-red-400 font-bold">-{discount.toLocaleString()}</span>}
            </div>

            {/* Points Row */}
            {usePoints && (
              <div className="flex justify-between text-purple-400 text-sm font-medium animate-pulse">
                <span className="flex items-center gap-1"><Award size={14} /> Points Redeemed</span>
                <span>-{pointsDiscount.toLocaleString()}</span>
              </div>
            )}

            {/* Tax Row */}
            {taxRate > 0 && (
              <div className="flex justify-between text-slate-400 text-sm font-medium">
                <span>Tax ({taxRate}%)</span>
                <span>+{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-end text-white pt-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Payable</span>
            <div className="text-right">
              <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                LKR {total.toLocaleString()}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setSplitAmounts({ cash: total, card: 0 });
              setIsCheckoutOpen(true);
            }}
            disabled={cart.length === 0}
            className={`w-full mt-4 py-4 px-6 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-300 relative overflow-hidden ${
              cart.length === 0 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-[1.02]'
            }`}
          >
            {cart.length > 0 && <div className="absolute inset-0 bg-white/20 hover:bg-transparent transition-colors"></div>}
            <CreditCard size={20} className="mr-3 relative z-10" /> 
            <span className="relative z-10">Checkout (F12)</span>
          </button>
        </div>
      </motion.div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md"
            >
              <Card className="shadow-2xl border-slate-700 bg-slate-900">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2"><CreditCard className="text-cyan-400" /> Complete Sale</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsCheckoutOpen(false)}><X /></Button>
                </div>
                <form onSubmit={handleCheckout}>
                  <div className="mb-6 space-y-4">
                    <Input
                      label="Customer Name"
                      icon={User}
                      autoFocus
                      placeholder="Enter Name (or leave blank for Walk-in)"
                      value={customer}
                      onChange={e => setCustomer(e.target.value)}
                    />

                    {/* Loyalty Points Badge */}
                    <AnimatePresence>
                      {customerPoints > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl"
                        >
                          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                            <Award size={18} />
                            <span>{customerPoints} Points Available</span>
                          </div>
                          <Badge
                            onClick={() => setUsePoints(!usePoints)}
                            variant={usePoints ? 'success' : 'neutral'}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            {usePoints ? 'Redeeming' : 'Redeem'}
                          </Badge>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Payment Method</label>
                      <div
                        onClick={() => setIsSplitPayment(!isSplitPayment)}
                        className={`text-xs flex items-center gap-1 font-bold px-2 py-1 rounded-lg cursor-pointer transition-colors ${isSplitPayment ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-indigo-400 border border-indigo-500/30'}`}
                      >
                        <Split size={12} /> Split Payment
                      </div>
                    </div>

                    {!isSplitPayment ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('Cash')}
                          className={`py-4 rounded-xl font-bold transition-all relative overflow-hidden ${paymentMethod === 'Cash'
                            ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white shadow-lg ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-900'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                        >
                          Cash
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('Card')}
                          className={`py-4 rounded-xl font-bold transition-all relative overflow-hidden ${paymentMethod === 'Card'
                            ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 text-white shadow-lg ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-900'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                        >
                          Card
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-3">
                          <span className="w-12 text-sm font-bold text-slate-400">Cash</span>
                          <Input
                            type="number"
                            className="flex-1"
                            value={splitAmounts.cash}
                            onChange={e => setSplitAmounts({ ...splitAmounts, cash: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-12 text-sm font-bold text-slate-400">Card</span>
                          <Input
                            type="number"
                            className="flex-1"
                            value={splitAmounts.card}
                            onChange={e => setSplitAmounts({ ...splitAmounts, card: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="text-right text-xs text-slate-500 pt-1 border-t border-slate-800 mt-2">
                          Remaining: <span className={`${Math.abs((splitAmounts.cash + splitAmounts.card) - total) > 1 ? 'text-red-400' : 'text-emerald-400'} font-bold`}>
                            {(total - (splitAmounts.cash + splitAmounts.card)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between mb-6 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-medium">Total Amount</span>
                    <span className="text-xl font-bold text-cyan-400">LKR {total.toLocaleString()}</span>
                  </div>
                  <Button type="submit" variant="success" size="lg" className="w-full bg-emerald-600 hover:bg-emerald-500 text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    Confirm Payment & Print
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Discount Modal */}
      {isDiscountModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-sm bg-slate-900">
            <h3 className="text-lg font-bold text-white mb-4">Apply Discount</h3>
            <Input
              type="number"
              autoFocus
              placeholder="Enter amount (LKR)"
              value={discount || ''}
              onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
              className="mb-4"
            />
            <Button onClick={() => setIsDiscountModalOpen(false)} className="w-full">Apply Discount</Button>
          </Card>
        </div>
      )}

      {/* Recall Modal */}
      {isRecallModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[80vh] flex flex-col bg-slate-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Recall Held Cart</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsRecallModalOpen(false)}><X /></Button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {heldCarts.length === 0 ? <p className="text-slate-500 text-center py-8">No held carts found.</p> :
                heldCarts.map(c => (
                  <div key={c.id} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center hover:border-cyan-500/50 cursor-pointer transition-colors group" onClick={() => restoreCart(c)}>
                    <div>
                      <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">{c.customer_name}</div>
                      <div className="text-xs text-slate-500">{new Date(c.timestamp).toLocaleString()}</div>
                      <Badge variant="info" className="mt-2">{c.items.length} Items</Badge>
                    </div>
                    <Button variant="ghost" size="icon"><PlayCircle className="text-cyan-500" /></Button>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      <Invoice data={printData} onClose={() => setPrintData(null)} />

    </motion.div>
  );
}