import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Car,
  Calendar,
  Clock,
  CheckCircle,
  CreditCard,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { reportApi } from '../services/api';
import { DashboardStats } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

const PIE_COLORS = ['#0284c7', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await reportApi.getDashboardStats();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Service Center Overview</h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status of service appointments, operations, and revenue.
          </p>
        </div>

        {/* Quick action shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/appointments')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
          <button
            onClick={() => navigate('/services')}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Service</span>
          </button>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={Users}
          color="blue"
          badgeText="Active client base"
        />
        <StatCard
          title="Total Vehicles"
          value={stats?.totalVehicles || 0}
          icon={Car}
          color="indigo"
          badgeText="Registered vehicles"
        />
        <StatCard
          title="Today's Appointments"
          value={stats?.todayAppointments || 0}
          icon={Calendar}
          color="amber"
          badgeText="Scheduled for today"
        />
        <StatCard
          title="Services In Progress"
          value={stats?.pendingServices || 0}
          icon={Clock}
          color="rose"
          badgeText="Active bay jobs"
        />
        <StatCard
          title="Completed Services"
          value={stats?.completedServices || 0}
          icon={CheckCircle}
          color="emerald"
          badgeText="Completed vehicle services"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={CreditCard}
          color="emerald"
          badgeText="Settled service payments"
        />
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue & Services */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Monthly Revenue Trend
              </h3>
              <p className="text-xs text-slate-500">Service income over recent months</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyStats || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(val) => `Rs.${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Revenue' : 'Jobs',
                  ]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue (Rs.)" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Services by Type Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col">
          <h3 className="text-base font-semibold text-slate-800 mb-1">Service Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Distribution of service requests</p>
          <div className="h-56 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.servicesByType || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {(data?.servicesByType || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {(data?.servicesByType || []).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span>{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Appointments & Recent Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Scheduled Appointments</h3>
              <p className="text-xs text-slate-500">Upcoming vehicle bookings</p>
            </div>
            <button
              onClick={() => navigate('/appointments')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3">Customer & Vehicle</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Service</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentAppointments && data.recentAppointments.length > 0 ? (
                  data.recentAppointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3">
                        <p className="font-semibold text-slate-800">{appt.customer?.name}</p>
                        <p className="text-slate-500 text-[11px]">
                          {appt.vehicle?.registrationNumber} ({appt.vehicle?.brand} {appt.vehicle?.model})
                        </p>
                      </td>
                      <td className="p-3 text-slate-600">
                        <p>{formatDate(appt.date)}</p>
                        <p className="text-[11px] text-slate-400">{appt.time}</p>
                      </td>
                      <td className="p-3 font-medium text-slate-700">{appt.serviceType}</td>
                      <td className="p-3 text-right">
                        <StatusBadge status={appt.status} type="appointment" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      No appointments scheduled
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Services */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recent Service Jobs</h3>
              <p className="text-xs text-slate-500">Workshop service records</p>
            </div>
            <button
              onClick={() => navigate('/services')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Service Type</th>
                  <th className="p-3">Total Cost</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentServices && data.recentServices.length > 0 ? (
                  data.recentServices.map((srv) => (
                    <tr key={srv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3">
                        <p className="font-semibold text-slate-800">
                          {srv.vehicle?.registrationNumber}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          {srv.vehicle?.brand} {srv.vehicle?.model} &bull; {srv.vehicle?.customer?.name}
                        </p>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-slate-700">{srv.serviceType}</p>
                        <p className="text-[11px] text-slate-400">{formatDate(srv.serviceDate)}</p>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        {formatCurrency(srv.totalCost)}
                      </td>
                      <td className="p-3 text-right">
                        <StatusBadge status={srv.status} type="service" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">
                      No services logged yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
