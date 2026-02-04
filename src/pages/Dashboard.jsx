import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, AlertTriangle, Activity } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const StatCard = ({ title, value, icon: Icon, color, subtext, onClick }) => (
  <Card
    onClick={onClick}
    hover
    className={`relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full ${color} opacity-5 group-hover:opacity-10 transition-opacity blur-3xl`} />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-bold text-white mt-2 drop-shadow-lg">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/5`}>
        <Icon size={24} />
      </div>
    </div>
    {subtext && <p className="text-xs text-slate-500 relative z-10 font-medium">{subtext}</p>}
  </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, netProfit: 0, totalOrders: 0, lowStockCount: 0 });
  const [activity, setActivity] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const navigate = useNavigate();

  const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

  useEffect(() => {
    const fetchData = async () => {
      if (!window.api) return;
      try {
        const dashboardStats = await window.api.getDashboardStats();
        const recentActivity = await window.api.getRecentActivity();
        const topItems = await window.api.getTopProducts();
        const history = await window.api.getTransactions();
        const catData = await window.api.getSalesByCategory();
        const hourly = await window.api.getSalesByHour();

        setStats(dashboardStats);
        setActivity(recentActivity);
        setTopProducts(topItems || []);
        setCategoryData(catData || []);
        setHourlyData(hourly || []);

        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const data = last7Days.map(date => {
          const dayTotal = history
            .filter(tx => tx.timestamp.startsWith(date))
            .reduce((sum, tx) => sum + tx.total, 0);
          return { name: date.slice(5), sales: dayTotal };
        });
        setChartData(data);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto custom-scrollbar pb-10"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 neon-text">
          <Activity className="text-cyan-400" />
          Dashboard
        </h1>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Refresh Data
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Revenue"
          value={`LKR ${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-emerald-500"
        />
        <StatCard
          title="Profit"
          value={`LKR ${stats.netProfit.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-cyan-500"
        />
        <StatCard
          title="Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          color="bg-purple-500"
        />
        <StatCard
          title="Stock Alerts"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          color="bg-rose-500"
          subtext="Items below threshold"
          onClick={() => navigate('/stock?filter=low')}
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Charts Section */}
        <div className="xl:col-span-2 space-y-8">
          {/* Sales Trend */}
          <Card className="h-96">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-cyan-500 rounded-full" /> Sales Over Time
            </h3>
            <div className="h-full pb-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#22d3ee' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pie Chart */}
            <Card className="h-96">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-500 rounded-full" /> Categories
              </h3>
              <div className="h-full pb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value) => `LKR ${value.toLocaleString()}`}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', opacity: 0.7 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Hourly Chart */}
            <Card className="h-96">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-emerald-500 rounded-full" /> Peak Hours
              </h3>
              <div className="h-full pb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(h) => `${h}:00`} />
                    <Tooltip
                      cursor={{ fill: '#1e293b', opacity: 0.4 }}
                      contentStyle={{ backgroundColor: '#020617', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    />
                    <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-amber-500 rounded-full" /> Top Products
            </h3>
            <div className="space-y-4">
              {topProducts.map((prod, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <span className="text-slate-600 font-mono font-bold w-6 text-lg">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-200 font-medium group-hover:text-cyan-400 transition-colors">{prod.name}</span>
                      <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded text-xs">{prod.qty} sold</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${Math.min((prod.qty / (topProducts[0]?.qty || 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && <p className="text-slate-500 text-sm italic">No sales data recorded yet.</p>}
            </div>
          </Card>
        </div>

        {/* Recent Activity Sidebar */}
        <div className="space-y-6">
          <Card className="h-fit sticky top-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-pink-500 rounded-full" /> Recent Activity
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {activity.length === 0 ? (
                <div className="text-slate-500 text-sm text-center py-10 italic">No recent transactions found.</div>
              ) : activity.map((tx, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/30 transition-all group">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 font-bold text-xs ring-1 ring-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                    #{tx.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-200 font-medium truncate group-hover:text-cyan-400 transition-colors">{tx.customer_name || 'Walk-in Customer'}</div>
                    <div className="text-xs text-slate-500">{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold text-sm">+{tx.total.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-600 uppercase font-bold tracking-wider">{tx.payment_method || 'Cash'}</div>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-6 text-slate-400 hover:text-white border-t border-slate-800 rounded-none pt-4"
              onClick={() => navigate('/history')}
            >
              View Full History
            </Button>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}