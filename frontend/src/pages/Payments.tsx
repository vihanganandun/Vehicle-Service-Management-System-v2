import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Edit2,
  Calendar,
  DollarSign,
  Car,
  User,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { paymentApi } from '../services/api';
import { Payment, PaymentMethod, PaymentStatus } from '../types';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'BANK_TRANSFER'];
const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'PAID'];

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Settle / Edit Payment Modal
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '0',
    paymentMethod: 'CASH' as PaymentMethod,
    paymentStatus: 'PAID' as PaymentStatus,
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Receipt Modal
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, methodFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentApi.getPayments({
        search: search || undefined,
        status: statusFilter || undefined,
        method: methodFilter || undefined,
      });
      setPayments(res.data.payments);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const openSettleModal = (p: Payment) => {
    setEditingPayment(p);
    setFormData({
      amount: p.amount.toString(),
      paymentMethod: p.paymentMethod,
      paymentStatus: p.paymentStatus === 'PENDING' ? 'PAID' : p.paymentStatus,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: p.notes || '',
    });
    setFormError(null);
    setIsSettleModalOpen(true);
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    try {
      setFormSubmitting(true);
      setFormError(null);

      await paymentApi.updatePayment(editingPayment.id, {
        amount: parseFloat(formData.amount) || 0,
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes ? formData.notes.trim() : undefined,
      });

      setIsSettleModalOpen(false);
      fetchPayments();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to update payment');
    } finally {
      setFormSubmitting(false);
    }
  };

  const openReceipt = (p: Payment) => {
    setReceiptPayment(p);
    setIsReceiptOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            Payment Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Record customer service payments, issue receipts, and manage billing methods.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by vehicle registration, customer name, service type, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Payment Ref</th>
                <th className="p-4">Service & Vehicle</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method & Date</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Loading payments...
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-700">
                      PAY-{p.id.toString().padStart(4, '0')}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-200 font-medium">
                          {p.service?.vehicle?.registrationNumber}
                        </span>
                        <span className="font-medium text-slate-800 text-xs">
                          {p.service?.serviceType}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Service #{p.serviceId}
                      </span>
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-slate-900 text-xs">
                        {p.service?.vehicle?.customer?.name}
                      </p>
                      <span className="text-[11px] text-slate-500">
                        {p.service?.vehicle?.customer?.phone}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatCurrency(p.amount)}
                      </span>
                    </td>

                    <td className="p-4 text-xs">
                      <span className="font-semibold text-slate-700">
                        {p.paymentMethod.replace(/_/g, ' ')}
                      </span>
                      <p className="text-slate-400 text-[11px] mt-0.5">{formatDate(p.paymentDate)}</p>
                    </td>

                    <td className="p-4 text-center">
                      <StatusBadge status={p.paymentStatus} type="payment" />
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openReceipt(p)}
                          title="Print Receipt"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openSettleModal(p)}
                          title="Update / Settle Payment"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{p.paymentStatus === 'PAID' ? 'Edit' : 'Settle'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle / Update Payment Modal */}
      <Modal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        title={editingPayment ? `Settle / Update Payment (PAY-${editingPayment.id})` : 'Update Payment'}
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSettleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Amount (Rs.) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Status *
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Date
            </label>
            <input
              type="date"
              required
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Remarks / Reference
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Card transaction slip #4102 or Bank transfer ref..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSettleModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : 'Confirm & Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        title="Payment Receipt / Official Invoice"
        maxWidth="lg"
      >
        {receiptPayment && (
          <div className="space-y-5 text-sm">
            {/* Header */}
            <div className="text-center pb-4 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">AutoCare Center</h3>
              <p className="text-xs text-slate-500 mt-0.5">Vehicle Maintenance & Service Billing</p>
              <p className="text-xs text-slate-400">Official Customer Payment Receipt</p>
            </div>

            {/* Receipt metadata */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400">Receipt No:</span>
                <p className="font-mono font-bold text-slate-800">
                  REC-{receiptPayment.id.toString().padStart(6, '0')}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Payment Date:</span>
                <p className="font-medium text-slate-800">{formatDate(receiptPayment.paymentDate)}</p>
              </div>
              <div>
                <span className="text-slate-400">Payment Status:</span>
                <p className="font-bold text-emerald-600">{receiptPayment.paymentStatus}</p>
              </div>
              <div>
                <span className="text-slate-400">Payment Method:</span>
                <p className="font-medium text-slate-800">
                  {receiptPayment.paymentMethod.replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            {/* Customer & Vehicle Info */}
            <div className="border border-slate-100 p-3 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">
                  {receiptPayment.service?.vehicle?.customer?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="text-slate-800">{receiptPayment.service?.vehicle?.customer?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle Reg No:</span>
                <span className="font-mono font-bold text-blue-700">
                  {receiptPayment.service?.vehicle?.registrationNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle Model:</span>
                <span className="text-slate-800">
                  {receiptPayment.service?.vehicle?.brand} {receiptPayment.service?.vehicle?.model}
                </span>
              </div>
            </div>

            {/* Service & Cost Details */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Service Performed:</span>
                <span className="font-semibold text-slate-800">
                  {receiptPayment.service?.serviceType}
                </span>
              </div>
              {receiptPayment.service && (
                <>
                  <div className="flex justify-between text-slate-500">
                    <span>Labour Charges:</span>
                    <span>{formatCurrency(receiptPayment.service.labourCost)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Parts & Lubricants:</span>
                    <span>{formatCurrency(receiptPayment.service.partsCost)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount Paid:</span>
                <span className="text-emerald-700">{formatCurrency(receiptPayment.amount)}</span>
              </div>
            </div>

            {receiptPayment.notes && (
              <p className="text-xs text-slate-500 italic">Remarks: {receiptPayment.notes}</p>
            )}

            {/* Print & Close */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setIsReceiptOpen(false)}
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
