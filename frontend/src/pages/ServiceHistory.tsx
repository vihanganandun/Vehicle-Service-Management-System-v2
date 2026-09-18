import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  History,
  Search,
  Car,
  User,
  Calendar,
  Wrench,
  Printer,
  ChevronDown,
  ChevronUp,
  Tag,
  CheckCircle,
} from 'lucide-react';
import { historyApi } from '../services/api';
import { Service } from '../types';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

export const ServiceHistory: React.FC = () => {
  const [history, setHistory] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Search parameters
  const [search, setSearch] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Expanded cards tracker
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  // Detailed Modal
  const [selectedRecord, setSelectedRecord] = useState<Service | null>(null);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reg = params.get('registrationNumber');
    if (reg) {
      setRegistrationNumber(reg);
      fetchHistory({ registrationNumber: reg });
    } else {
      fetchHistory();
    }
  }, [location.search]);

  const fetchHistory = async (customParams?: any) => {
    try {
      setLoading(true);
      const res = await historyApi.getServiceHistory({
        search: search || undefined,
        registrationNumber: registrationNumber || undefined,
        customerName: customerName || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        ...customParams,
      });
      setHistory(res.data.history);
      // Auto expand all records if <= 5
      if (res.data.history.length <= 5) {
        setExpandedIds(res.data.history.map((h) => h.id));
      }
    } catch (err) {
      console.error('Failed to load service history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleReset = () => {
    setSearch('');
    setRegistrationNumber('');
    setCustomerName('');
    setStartDate('');
    setEndDate('');
    fetchHistory({
      search: undefined,
      registrationNumber: undefined,
      customerName: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Compute summary metrics of filtered history
  const totalCostSum = history.reduce((sum, s) => sum + s.totalCost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            Vehicle Service History
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Complete vehicle maintenance archives, parts breakdown, and historical logs.
          </p>
        </div>

        {/* Quick summary pill */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-800">
            {history.length} Records Found &bull; Total: {formatCurrency(totalCostSum)}
          </div>
        </div>
      </div>

      {/* Advanced Multi-Field Search Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* General query */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Keyword / Work
              </label>
              <input
                type="text"
                placeholder="e.g. Brake pads, Oil, Spark plug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Registration Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Vehicle Reg Number
              </label>
              <input
                type="text"
                placeholder="e.g. BAP-1234, CAB-4521..."
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer Name
              </label>
              <input
                type="text"
                placeholder="e.g. Kasun, Amara..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search History</span>
            </button>
          </div>
        </form>
      </div>

      {/* History Timeline Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          Loading vehicle service records...
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-4">
          {history.map((record) => {
            const isExpanded = expandedIds.includes(record.id);
            return (
              <div
                key={record.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* Summary Header Bar */}
                <div
                  onClick={() => toggleExpand(record.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none bg-slate-50/40 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                          {record.vehicle?.registrationNumber}
                        </span>
                        <span className="font-bold text-slate-800 text-sm">
                          {record.serviceType}
                        </span>
                        <StatusBadge status={record.status} type="service" />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Car className="w-3.5 h-3.5 text-slate-400" />
                          {record.vehicle?.brand} {record.vehicle?.model}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {record.vehicle?.customer?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(record.serviceDate)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Total Cost</span>
                      <span className="text-base font-extrabold text-slate-900">
                        {formatCurrency(record.totalCost)}
                      </span>
                    </div>

                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                        <p className="font-semibold text-slate-700 uppercase text-[11px] mb-1">
                          Customer Complaint:
                        </p>
                        <p className="text-slate-800">
                          {record.customerComplaint || 'Standard periodic inspection'}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                        <p className="font-semibold text-slate-700 uppercase text-[11px] mb-1">
                          Work Performed:
                        </p>
                        <p className="text-slate-800">
                          {record.workPerformed || 'Routine maintenance and diagnostic test'}
                        </p>
                      </div>
                    </div>

                    {/* Parts & Items breakdown */}
                    {record.serviceItems && record.serviceItems.length > 0 && (
                      <div>
                        <p className="font-semibold text-slate-700 uppercase text-[11px] mb-2">
                          Parts & Labor Breakdown:
                        </p>
                        <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                          <thead className="bg-slate-100/70 text-slate-600 font-semibold">
                            <tr>
                              <th className="p-2">Item Description</th>
                              <th className="p-2">Category</th>
                              <th className="p-2 text-center">Qty</th>
                              <th className="p-2 text-right">Unit Price</th>
                              <th className="p-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {record.serviceItems.map((item, idx) => (
                              <tr key={idx}>
                                <td className="p-2 font-medium text-slate-800">{item.itemName}</td>
                                <td className="p-2 text-slate-500">{item.itemType}</td>
                                <td className="p-2 text-center text-slate-700">{item.quantity}</td>
                                <td className="p-2 text-right text-slate-700">
                                  {formatCurrency(item.unitPrice)}
                                </td>
                                <td className="p-2 text-right font-semibold text-slate-900">
                                  {formatCurrency(item.totalPrice)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Bottom Cost & Payment Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-4 text-slate-600">
                        <span>Labour: {formatCurrency(record.labourCost)}</span>
                        <span>Parts: {formatCurrency(record.partsCost)}</span>
                        {record.payment && (
                          <span className="font-semibold text-emerald-700">
                            Payment: {record.payment.paymentStatus} ({record.payment.paymentMethod})
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Invoice / Report</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-700 font-semibold text-sm">No service records match your criteria.</p>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting registration number or date filters.
          </p>
        </div>
      )}

      {/* Printable Invoice Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Vehicle Service Certificate & Invoice"
        maxWidth="2xl"
      >
        {selectedRecord && (
          <div className="space-y-6 text-sm">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-bold text-slate-900">AutoCare Service Center</h3>
                <p className="text-xs text-slate-500">Service Record & History Invoice</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-base text-blue-700">
                  REF-{selectedRecord.id.toString().padStart(6, '0')}
                </span>
                <p className="text-xs text-slate-500">{formatDate(selectedRecord.serviceDate)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <div>
                <p className="font-semibold text-slate-400 uppercase">Customer Details</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {selectedRecord.vehicle?.customer?.name}
                </p>
                <p className="text-slate-600">{selectedRecord.vehicle?.customer?.phone}</p>
                <p className="text-slate-500">{selectedRecord.vehicle?.customer?.address || 'On File'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-400 uppercase">Vehicle Details</p>
                <p className="font-mono font-bold text-blue-700 text-sm mt-0.5">
                  {selectedRecord.vehicle?.registrationNumber}
                </p>
                <p className="text-slate-700 font-medium">
                  {selectedRecord.vehicle?.brand} {selectedRecord.vehicle?.model}
                </p>
                <p className="text-slate-500">
                  {selectedRecord.vehicle?.vehicleType} {selectedRecord.vehicle?.year ? `• ${selectedRecord.vehicle.year}` : ''}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p>
                <span className="font-bold text-slate-700">Service Performed:</span>{' '}
                {selectedRecord.serviceType}
              </p>
              <p>
                <span className="font-bold text-slate-700">Complaint:</span>{' '}
                {selectedRecord.customerComplaint || 'General Service'}
              </p>
              <p>
                <span className="font-bold text-slate-700">Diagnostic / Action:</span>{' '}
                {selectedRecord.workPerformed || 'Standard Check'}
              </p>
            </div>

            {selectedRecord.serviceItems && selectedRecord.serviceItems.length > 0 && (
              <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2">Type</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedRecord.serviceItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{item.itemName}</td>
                      <td className="p-2 text-slate-500">{item.itemType}</td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-2 text-right font-semibold">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Labour Cost:</span>
                <span className="font-semibold">{formatCurrency(selectedRecord.labourCost)}</span>
              </div>
              <div className="flex justify-between">
                <span>Parts Cost:</span>
                <span className="font-semibold">{formatCurrency(selectedRecord.partsCost)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="text-blue-700">{formatCurrency(selectedRecord.totalCost)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
