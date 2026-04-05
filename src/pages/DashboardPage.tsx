import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatVND } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { BRANCHES, ACCOUNT_TYPES, getBranchName } from '../constants/agribank';
import { 
  DollarSign, 
  Users, 
  Receipt, 
  FileUp,
  TrendingUp,
  ArrowUpRight,
  Wallet,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const KPICard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
          <ArrowUpRight size={14} />
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
    </div>
  </div>
);

const BalanceCard = ({ account, label, amount }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-agribank-maroon">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-black text-agribank-maroon uppercase tracking-widest bg-agribank-maroon/5 px-2 py-1 rounded-md">TK {account}</span>
      <Wallet size={16} className="text-gray-300" />
    </div>
    <p className="text-xs font-bold text-gray-500 mb-1 truncate">{label}</p>
    <p className="text-lg font-black text-gray-800 font-mono">{formatVND(amount)}</p>
  </div>
);

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [balanceData, setBalanceData] = useState<any[]>([]);
  const [yearlyData, setYearlyData] = useState<any[]>([]);
  const [branchStats, setBranchStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = { 
          month: selectedMonth, 
          year: selectedYear,
          branchCode: isAdmin ? undefined : user?.branchCode
        };

        const [summaryRes, balanceRes, yearlyRes] = await Promise.all([
          api.get('/tax/summary', { params }),
          api.get('/api/stats/balances', { params }),
          api.get('/api/stats/yearly', { params: { year: selectedYear, branchCode: params.branchCode } })
        ]);

        setSummaryData(summaryRes.data);
        setBalanceData(balanceRes.data);
        setYearlyData(yearlyRes.data);

        if (isAdmin) {
          const branchRes = await api.get('/api/stats/branches', { params: { month: selectedMonth, year: selectedYear } });
          setBranchStats(branchRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin, user?.branchCode, selectedMonth, selectedYear]);

  const totalIncome = Array.isArray(summaryData) ? summaryData.reduce((acc, curr) => acc + curr.totalGross, 0) : 0;
  const totalTax = Array.isArray(summaryData) ? summaryData.reduce((acc, curr) => acc + curr.taxAmount, 0) : 0;
  const totalEmployees = Array.isArray(summaryData) ? summaryData.length : 0;

  // Map balance data to required accounts
  const displayBalances = [
    { account: '462001', label: 'Tạm treo lương' },
    { account: '484101', label: 'Khen thưởng' },
    { account: '484201', label: 'Phúc lợi/Độc hại' },
    { account: '484301', label: 'BHXH/Từ thiện' },
  ].map(b => {
    const stat = Array.isArray(balanceData) ? balanceData.find(s => s.accountType === b.account) : null;
    return { ...b, amount: stat ? parseFloat(stat.totalAmount) : 0 };
  });

  // Prepare chart data
  const chartData = isAdmin 
    ? (Array.isArray(branchStats) ? branchStats.map(s => ({
        name: s.branchCode,
        fullName: BRANCHES[s.branchCode as keyof typeof BRANCHES] || s.branchCode,
        value: parseFloat(s.totalIncome) / 1000000 // Convert to millions
      })) : [])
    : (Array.isArray(yearlyData) ? yearlyData.map(s => ({
        name: `Tháng ${s.month}`,
        fullName: `Tháng ${s.month}`,
        value: parseFloat(s.totalIncome) / 1000000
      })) : []);

  const COLORS = ['#A61D37', '#005030', '#FFD700', '#4A90E2', '#9013FE', '#50E3C2'];

  if (loading && summaryData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-agribank-maroon"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="font-black text-gray-800 tracking-tight uppercase text-sm">Bộ lọc báo cáo</h3>
        <div className="flex gap-4">
          <select 
            className="text-xs font-bold border border-gray-100 bg-gray-50 rounded-xl px-4 py-2 outline-none text-gray-700"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={i+1}>Tháng {i+1}</option>
            ))}
          </select>
          <select 
            className="text-xs font-bold border border-gray-100 bg-gray-50 rounded-xl px-4 py-2 outline-none text-gray-700"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Tổng Thu nhập" 
          value={formatVND(totalIncome)} 
          icon={DollarSign} 
          color="bg-agribank-maroon" 
        />
        <KPICard 
          title="Tổng Thuế TNCN" 
          value={formatVND(totalTax)} 
          icon={Receipt} 
          color="bg-agribank-green" 
        />
        <KPICard 
          title="Số Cán bộ" 
          value={totalEmployees} 
          icon={Users} 
          color="bg-blue-500" 
        />
        <KPICard 
          title="File đã Upload" 
          value="12" 
          icon={FileUp} 
          color="bg-agribank-gold" 
        />
      </div>

      {/* Balance Statistics Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-agribank-maroon/10 text-agribank-maroon rounded-lg">
            <Wallet size={20} />
          </div>
          <h3 className="text-lg font-black text-gray-800 tracking-tight uppercase">Số dư theo tài khoản kế toán</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayBalances.map((b) => (
            <BalanceCard key={b.account} {...b} />
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-gray-800 tracking-tight text-lg">
              {isAdmin ? 'Thu nhập theo Chi nhánh (Triệu VND)' : `Thu nhập theo Tháng năm ${selectedYear} (Triệu VND)`}
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  formatter={(value: any, name: any, props: any) => [formatVND(value * 1000000), props.payload.fullName]}
                />
                <Bar dataKey="value" fill="#A61D37" radius={[6, 6, 0, 0]} barSize={isAdmin ? 30 : 40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-800 mb-8 tracking-tight text-lg">Cơ cấu Thu nhập</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Array.isArray(summaryData) ? [
                    { name: 'Lương V1', value: summaryData.reduce((a, c) => a + (c.income?.['851101'] || 0), 0) },
                    { name: 'Lương V2', value: summaryData.reduce((a, c) => a + (c.income?.['851102'] || 0), 0) },
                    { name: 'Năng suất', value: summaryData.reduce((a, c) => a + (c.income?.['462001'] || 0), 0) },
                    { name: 'Khen thưởng', value: summaryData.reduce((a, c) => a + (c.income?.['484101'] || 0), 0) },
                  ] : []}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {COLORS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatVND(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-6">
            {['Lương V1', 'Lương V2', 'Năng suất', 'Khen thưởng'].map((label, i) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="text-gray-500 font-bold">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity / Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-800 tracking-tight text-lg">
            {isAdmin ? 'Top Thu nhập cao nhất hệ thống' : `Top Thu nhập Chi nhánh ${user?.branchCode}`}
          </h3>
          <button className="text-agribank-maroon text-sm font-black hover:underline tracking-tight">Xem tất cả</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.15em]">
              <tr>
                <th className="px-8 py-5">Họ và tên</th>
                <th className="px-8 py-5">Chi nhánh</th>
                <th className="px-8 py-5">Thu nhập</th>
                <th className="px-8 py-5">Thuế TNCN</th>
                <th className="px-8 py-5 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Array.isArray(summaryData) && summaryData.sort((a, b) => b.totalGross - a.totalGross).slice(0, 5).map((row, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-agribank-maroon/10 text-agribank-maroon rounded-full flex items-center justify-center font-black text-sm border-2 border-agribank-maroon/5 group-hover:border-agribank-maroon/20 transition-colors">
                        {row.fullName.charAt(0)}
                      </div>
                      <span className="font-black text-gray-800 tracking-tight">{row.fullName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-black uppercase">
                      {row.branchCode} - {BRANCHES[row.branchCode as keyof typeof BRANCHES]}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-mono text-sm font-bold text-gray-700">{formatVND(row.totalGross)}</td>
                  <td className="px-8 py-5 font-mono text-sm font-black text-agribank-maroon">{formatVND(row.taxAmount)}</td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-green-100">Đã tính</span>
                  </td>
                </tr>
              ))}
              {(!Array.isArray(summaryData) || summaryData.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-gray-400 font-bold italic">Chưa có dữ liệu tháng này</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
