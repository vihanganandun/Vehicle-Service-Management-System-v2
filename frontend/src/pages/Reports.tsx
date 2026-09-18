import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  DollarSign,
  Printer,
  TrendingUp,
  CreditCard,
  Wrench,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { reportApi } from '../services/api';
import { ReportData } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

export const Reports: React.FC = () => {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (customStart = startDate, customEnd = endDate) => {
    try {
      setLoading(true);
      const res = await reportApi.getReports({
        startDate: customStart || undefined,
        endDate: customEnd || undefined,
      });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const setFilterToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    fetchReports(today, today);
  };

  const setFilterThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
    fetchReports(firstDay, lastDay);
  };

  const setFilterAll = () => {
    setStartDate('');
    setEndDate('');
    fetchReports('', '');
  };

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Service & Financial Reports
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Analyze daily/monthly throughput, revenue breakdown, and workshop productivity.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors no-print"
        >
          <Printer className="w-4 h-4" />
          <span>Print Report</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Apply Range
          </button>
        </form>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Presets:</span>
          <button
            type="button"
            onClick={setFilterToday}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={setFilterThisMonth}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            This Month
          </button>
          <button
            type="button"
            onClick={setFilterAll}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            All Time
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Total Paid Revenue"
          value={formatCurrency(summary?.totalRevenue || 0)}
          icon={DollarSign}
          color="emerald"
          badgeText={`${summary?.paidTransactionsCount || 0} paid invoices`}
        />
        <StatCard
          title="Labour Revenue"
          value={formatCurrency(summary?.totalLabourCost || 0)}
          icon={Wrench}
          color="blue"
          badgeText="Workshop labor fee earnings"
        />
        <StatCard
          title="Parts & Materials Revenue"
          value={formatCurrency(summary?.totalPartsCost || 0)}
          icon={TrendingUp}
          color="indigo"
          badgeText="Replacement parts billed"
        />
        <StatCard
          title="Total Service Jobs"
          value={summary?.totalServicesCount || 0}
          icon={Calendar}
          color="amber"
          badgeText="Services in selected period"
        />
        <StatCard
          title="Completed Jobs"
          value={summary?.completedServicesCount || 0}
          icon={CheckCircle}
          color="emerald"
          badgeText="100% finished jobs"
        />
        <StatCard
          title="Settled Payments"
          value={summary?.paidTransactionsCount || 0}
          icon={CreditCard}
          color="purple"
          badgeText="Fully settled client accounts"
        />
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          Revenue by Payment Method
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data?.methodBreakdown && data.methodBreakdown.length > 0 ? (
            data.methodBreakdown.map((m) => (
              <div
                key={m.method}
                className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between"
              >
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">
                    {m.method.replace(/_/g, ' ')}
                  </span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">
                    {formatCurrency(m.totalAmount)}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
                  {m.count} txns
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic col-span-3">No payments for this period.</p>
          )}
        </div>
      </div>

      {/* Services in Period Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Service Jobs Record for Selected Period
            </h3>
            <p className="text-xs text-slate-500">
              {startDate && endDate ? `${formatDate(startDate)} to ${formatDate(endDate)}` : 'Full Service History'}
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
            {data?.services?.length || 0} Jobs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Vehicle & Customer</th>
                <th className="p-3">Service Type</th>
                <th className="p-3">Labour (Rs.)</th>
                <th className="p-3">Parts (Rs.)</th>
                <th className="p-3">Total Cost</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Loading report...
                  </td>
                </tr>
              ) : data?.services && data.services.length > 0 ? (
                data.services.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="p-3 text-slate-600 font-medium">{formatDate(s.serviceDate)}</td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-900 font-mono">
                        {s.vehicle?.registrationNumber}
                      </p>
                      <p className="text-[11px] text-slate-500">{s.vehicle?.customer?.name}</p>
                    </td>
                    <td className="p-3 font-medium text-slate-800">{s.serviceType}</td>
                    <td className="p-3 text-slate-700">{formatCurrency(s.labourCost)}</td>
                    <td className="p-3 text-slate-700">{formatCurrency(s.partsCost)}</td>
                    <td className="p-3 font-bold text-slate-900">{formatCurrency(s.totalCost)}</td>
                    <td className="p-3 text-center">
                      <StatusBadge status={s.status} type="service" />
                    </td>
                    <td className="p-3 text-center">
                      {s.payment ? (
                        <StatusBadge status={s.payment.paymentStatus} type="payment" />
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No services logged within this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
