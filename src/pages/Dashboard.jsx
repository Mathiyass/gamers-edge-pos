import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, AlertTriangle, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, netProfit: 0, totalOrders: 0, lowStockCount: 0 });
  const [activity, setActivity] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const navigate = useNavigate();

  const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

  useEffect(() => {
    const fetchData = async () => {
      if (!window.api) return;
      const dashboardStats = await window.api.getDashboardStats();
      const recentActivity = await window.api.getRecentActivity();
      const topItems = await window.api.getTopProducts();
      const history = await window.api.getTransactions();
      const catData = await window.api.getSalesByCategory();

      setStats(dashboardStats);
      setActivity(recentActivity);
      setTopProducts(topItems || []);
      setCategoryData(catData || []);

      // Process Chart Data (Last 7 Days)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const data = last7Days.map(date => {
        const dayTotal = history
          .filter(tx => tx.timestamp.startsWith(date))
          .reduce((sum, tx) => sum + tx.total, 0);
        return { name: date.slice(5), sales: dayTotal }; // MM-DD
      });
      setChartData(data);
    };

    fetchData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, subtext, onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group transition-transform ${onClick ? 'cursor-pointer hover:scale-105 hover:border-slate-700' : ''}`}
    >
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${color} opacity-10 group-hover:opacity-20 transition-opacity blur-2xl`}></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-20 text-white`}>
          <Icon size={24} />
        </div>
      </div>
      {subtext && <p className="text-xs text-slate-500 relative z-10">{subtext}</p>}
    </div>
  );

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950 custom-scrollbar">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <Activity className="text-cyan-500" /> Dashboard Overview
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Today's Revenue" 
          value={`LKR ${stats.totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Total Lifetime Profit" 
          value={`LKR ${stats.netProfit.toLocaleString()}`} 
          icon={TrendingUp} 
          color="bg-cyan-500" 
        />
        <StatCard 
          title="Today's Orders" 
          value={stats.totalOrders} 
          icon={ShoppingBag} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={stats.lowStockCount} 
          icon={AlertTriangle} 
          color="bg-rose-500" 
          subtext="Items below 5 qty"
          onClick={() => navigate('/stock?filter=low')}
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sales Chart & Pie Chart */}
        <div className="lg:col-span-2 space-y-8">

          {/* Sales Trend Area Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-96">
            <h3 className="text-xl font-bold text-white mb-6">Sales Trend (Last 7 Days)</h3>
            <div className="h-full pb-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                    itemStyle={{ color: '#22d3ee' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales by Category Pie Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-96">
             <h3 className="text-xl font-bold text-white mb-6">Sales by Category</h3>
             <div className="h-full pb-8">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value) => `LKR ${value.toLocaleString()}`}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
             <h3 className="text-xl font-bold text-white mb-4">Top Selling Products</h3>
             <div className="space-y-4">
                {topProducts.map((prod, i) => (
                  <div key={i} className="flex items-center gap-4">
                     <span className="text-slate-500 font-mono font-bold w-4">{i+1}</span>
                     <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                           <span className="text-white font-medium">{prod.name}</span>
                           <span className="text-cyan-400 font-bold">{prod.qty} sold</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-cyan-500 rounded-full" 
                             style={{ width: `${Math.min((prod.qty / (topProducts[0]?.qty || 1)) * 100, 100)}%` }}
                           ></div>
                        </div>
                     </div>
                  </div>
                ))}
                {topProducts.length === 0 && <p className="text-slate-500 text-sm">No sales data yet.</p>}
             </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col h-fit sticky top-6">
          <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar max-h-[600px]">
            {activity.length === 0 ? (
               <div className="text-slate-500 text-sm text-center py-10">No recent transactions.</div>
            ) : activity.map((tx, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="w-10 h-10 rounded-full bg-cyan-900/30 text-cyan-400 flex items-center justify-center shrink-0 font-bold text-sm">
                  #{tx.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{tx.customer_name || 'Walk-in'}</div>
                  <div className="text-xs text-slate-500">{new Date(tx.timestamp).toLocaleTimeString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold text-sm">+{tx.total.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-600 uppercase font-bold">{tx.payment_method || 'Cash'}</div>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => navigate('/history')}
            className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            View All History
          </button>
        </div>
      </div>
    </div>
  );
}