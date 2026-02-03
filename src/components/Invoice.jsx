import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Invoice = ({ data, onClose }) => {
  useEffect(() => {
    if (data) {
      console.log(`[Invoice] Displayed for ID: ${data.id}`);
    } else {
      console.log('[Invoice] Hidden (No Data)');
    }
    return () => {
       if (data) console.log(`[Invoice] Unmounting for ID: ${data.id}`);
    };
  }, [data]);

  if (!data) return null;

  return (
    <div id="invoice-content" className="font-sans w-full h-full bg-white text-slate-900 absolute top-0 left-0 z-50 p-12">
      {/* Close Button (Hidden on Print) */}
      <button 
        onClick={() => {
          console.log('[Invoice] User clicked Close');
          onClose && onClose();
        }}
        className="absolute top-5 right-5 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg print:hidden"
        aria-label="Close Invoice"
      >
        <X size={24} />
      </button>

      {/* Header Section */}
      <div className="flex justify-between items-start mb-12">
        <div className="w-1/2">
           <h1 className="text-5xl font-extrabold text-cyan-600 tracking-tight uppercase mb-2">GamersEdge</h1>
           <div className="text-sm font-medium text-slate-500 leading-relaxed">
             <p>207/04/03/F/2, Wilimbula, Henegama</p>
             <p>Wilimbula, Sri Lanka</p>
             <p className="mt-2 text-slate-800 font-bold">+94 74 070 5733 / +94 76 532 9455</p>
             <p className="text-cyan-700 underline decoration-cyan-300">sl.gamersedge@gmail.com</p>
           </div>
        </div>
        <div className="text-right w-1/3">
           <h2 className="text-4xl font-black text-slate-200 uppercase tracking-widest mb-4">Invoice</h2>
           <div className="space-y-1 text-sm">
             <div className="flex justify-between border-b border-slate-100 pb-1">
               <span className="font-bold text-slate-500">Invoice No:</span>
               <span className="font-mono font-bold text-slate-900">#{data.id}</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 pb-1 pt-1">
               <span className="font-bold text-slate-500">Date:</span>
               <span className="font-mono text-slate-900">{new Date(data.date).toLocaleDateString()}</span>
             </div>
              <div className="flex justify-between border-b border-slate-100 pb-1 pt-1">
               <span className="font-bold text-slate-500">Time:</span>
               <span className="font-mono text-slate-900">{new Date(data.date).toLocaleTimeString()}</span>
             </div>
           </div>
        </div>
      </div>

      {/* Bill To & Payment Info */}
      <div className="flex justify-between mb-8 bg-slate-50 p-6 rounded-lg border border-slate-100">
        <div>
          <h3 className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Bill To</h3>
          <p className="font-bold text-lg text-slate-900">{data.customer || 'Walk-in Customer'}</p>
        </div>
        <div className="text-right">
           <h3 className="text-xs font-bold uppercase text-slate-400 mb-1 tracking-wider">Payment Method</h3>
           <span className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wide border ${
             data.paymentMethod === 'Card' 
             ? 'bg-purple-100 text-purple-700 border-purple-200' 
             : 'bg-emerald-100 text-emerald-700 border-emerald-200'
           }`}>
             {data.paymentMethod || 'Cash'}
           </span>
        </div>
      </div>

      {/* Item Table */}
      <div className="mb-10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900 text-xs font-bold uppercase tracking-wider text-slate-600">
              <th className="py-3 pl-2">Description</th>
              <th className="py-3 text-center">Qty</th>
              <th className="py-3 text-right">Unit Price</th>
              <th className="py-3 text-right pr-2">Total</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {data.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="py-4 pl-2 font-medium text-slate-800">{item.name}</td>
                <td className="py-4 text-center text-slate-600 font-mono">{item.quantity}</td>
                <td className="py-4 text-right text-slate-600 font-mono">{item.price_sell.toLocaleString()}</td>
                <td className="py-4 text-right pr-2 font-bold text-slate-900 font-mono">{(item.price_sell * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer / Totals */}
      <div className="flex justify-end">
        <div className="w-1/2 lg:w-1/3">
          <div className="space-y-3">
             <div className="flex justify-between text-slate-500 font-medium">
                <span>Subtotal</span>
                <span>{data.total.toLocaleString()}</span>
             </div>
             <div className="flex justify-between text-slate-500 font-medium">
                <span>Tax (0%)</span>
                <span>0.00</span>
             </div>
             <div className="flex justify-between items-center border-t-2 border-cyan-600 pt-4 mt-4">
                <span className="text-lg font-bold text-slate-900">Grand Total</span>
                <span className="text-3xl font-black text-cyan-600">
                   <span className="text-sm font-bold text-slate-400 mr-1">LKR</span>
                   {data.total.toLocaleString()}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="absolute bottom-12 left-12 right-12 text-center border-t border-slate-100 pt-6">
        <p className="text-slate-900 font-bold mb-1">Thank you for shopping with GamersEdge!</p>
        <p className="text-xs text-slate-400">Please retain this invoice for warranty claims. Goods once sold are not returnable.</p>
        <div className="mt-4 flex justify-center gap-2">
           <div className="h-1 w-16 bg-cyan-500 rounded-full"></div>
           <div className="h-1 w-4 bg-slate-200 rounded-full"></div>
           <div className="h-1 w-4 bg-slate-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;