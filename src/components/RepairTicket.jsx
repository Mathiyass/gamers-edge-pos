import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const RepairTicket = ({ data, onClose }) => {
  useEffect(() => {
    if (data) {
       // Auto-print when data is available
       const timer = setTimeout(() => window.print(), 500);
       return () => clearTimeout(timer);
    }
  }, [data]);

  if (!data) return null;

  return (
    <div id="repair-ticket-content" className="font-sans w-full h-full bg-white text-slate-900 absolute top-0 left-0 z-50 p-10 hidden print:block">
       {/* Header */}
       <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-4xl font-extrabold uppercase tracking-tighter">GamersEdge</h1>
        <p className="text-sm font-bold mt-1 tracking-wide">REPAIR SERVICE TICKET</p>
        <div className="text-xs mt-2 space-y-1">
          <p>207/04/03/F/2, Wilimbula, Henegama</p>
          <p>Hotline: +94 74 070 5733</p>
        </div>
      </div>

      <div className="flex justify-between items-end mb-6 border-b border-gray-300 pb-2">
         <div>
            <span className="block text-xs font-bold text-gray-500 uppercase">Ticket ID</span>
            <span className="text-xl font-mono font-bold">#{data.id}</span>
         </div>
         <div className="text-right">
            <span className="block text-xs font-bold text-gray-500 uppercase">Date</span>
            <span className="font-mono">{new Date(data.created_at).toLocaleDateString()}</span>
         </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="font-bold text-sm uppercase">Customer</span>
          <span>{data.customer_name}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="font-bold text-sm uppercase">Phone</span>
          <span>{data.customer_phone || 'N/A'}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="font-bold text-sm uppercase">Device</span>
          <span>{data.device}</span>
        </div>
      </div>

      <div className="border border-black p-4 mb-6 rounded-lg bg-gray-50">
        <span className="block text-xs font-bold text-gray-500 uppercase mb-1">Issue Reported</span>
        <p className="font-medium text-lg leading-snug">{data.issue}</p>
      </div>

      <div className="flex justify-between items-center border-t-2 border-black pt-4 mb-8">
         <span className="text-lg font-bold">Estimated Cost</span>
         <span className="text-2xl font-black">LKR {data.cost.toLocaleString()}</span>
      </div>

      <div className="text-center text-xs space-y-2 text-gray-600">
        <p>This ticket must be presented when collecting the device.</p>
        <p>GamersEdge is not responsible for data loss during repairs.</p>
        <div className="mt-8 border-t border-dashed border-gray-400 pt-4">
           <p className="font-bold">Customer Signature ______________________</p>
        </div>
      </div>
    </div>
  );
};

export default RepairTicket;