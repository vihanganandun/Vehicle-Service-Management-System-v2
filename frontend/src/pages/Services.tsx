import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Wrench,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CreditCard,
  Printer,
  Calendar,
  DollarSign,
  Car,
  User,
  AlertCircle,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { serviceApi, vehicleApi, appointmentApi } from '../services/api';
import { Service, Vehicle, ServiceItem, ServiceStatus } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

const SERVICE_TYPES = [
  'Oil Change',
  'Full Service',
  'Brake Service',
  'Engine Check',
  'Tire Service',
  'Battery Replacement',
  'General Repair',
];

interface FormItem {
  itemName: string;
  itemType: 'PART' | 'LABOUR';
  quantity: number;
  unitPrice: number;
}

export const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add / Edit Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    vehicleId: '',
    appointmentId: '',
    serviceType: 'Oil Change',
    customerComplaint: '',
    workPerformed: '',
    partsUsed: '',
    labourCost: '0',
    partsCost: '0',
    serviceDate: new Date().toISOString().split('T')[0],
    status: 'IN_PROGRESS' as ServiceStatus,
  });

  const [items, setItems] = useState<FormItem[]>([
    { itemName: '', itemType: 'PART', quantity: 1, unitPrice: 0 },
  ]);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Job card / Details modal
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isJobCardOpen, setIsJobCardOpen] = useState(false);

  // Delete modal
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
    fetchVehiclesList();
  }, [statusFilter]);

  // Check URL query for automated prefill from Appointments
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('new') === 'true' && vehicles.length > 0) {
      const vId = params.get('vehicleId') || '';
      const aId = params.get('appointmentId') || '';
      const sType = params.get('serviceType') || 'Full Service';

      setEditingService(null);
      setFormData({
        vehicleId: vId,
        appointmentId: aId,
        serviceType: sType,
        customerComplaint: 'Initiated from scheduled appointment',
        workPerformed: '',
        partsUsed: '',
        labourCost: '0',
        partsCost: '0',
        serviceDate: new Date().toISOString().split('T')[0],
        status: 'IN_PROGRESS',
      });
      setItems([{ itemName: 'Standard Inspection', itemType: 'LABOUR', quantity: 1, unitPrice: 0 }]);
      setIsFormModalOpen(true);
    }
  }, [location.search, vehicles]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await serviceApi.getServices({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setServices(res.data.services);
    } catch (err) {
      console.error('Error fetching services', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehiclesList = async () => {
    try {
      const res = await vehicleApi.getVehicles();
      setVehicles(res.data.vehicles);
    } catch (err) {
      console.error('Error fetching vehicles', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchServices();
  };

  // Dynamic Item List Helpers
  const addItemRow = () => {
    setItems([...items, { itemName: '', itemType: 'PART', quantity: 1, unitPrice: 0 }]);
  };

  const removeItemRow = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    recalculateFromItems(updated);
  };

  const updateItemRow = (index: number, field: keyof FormItem, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
    recalculateFromItems(updated);
  };

  const recalculateFromItems = (currentItems: FormItem[]) => {
    let partsSum = 0;
    let labourSum = 0;
    currentItems.forEach((item) => {
      const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
      if (item.itemType === 'PART') {
        partsSum += lineTotal;
      } else {
        labourSum += lineTotal;
      }
    });

    if (partsSum > 0 || labourSum > 0) {
      setFormData((prev) => ({
        ...prev,
        partsCost: partsSum.toString(),
        labourCost: labourSum.toString(),
      }));
    }
  };

  // Calculated live Total Cost: Labour + Parts
  const calculatedTotal = (parseFloat(formData.labourCost) || 0) + (parseFloat(formData.partsCost) || 0);

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      vehicleId: vehicles.length > 0 ? vehicles[0].id.toString() : '',
      appointmentId: '',
      serviceType: 'Oil Change',
      customerComplaint: '',
      workPerformed: '',
      partsUsed: '',
      labourCost: '0',
      partsCost: '0',
      serviceDate: new Date().toISOString().split('T')[0],
      status: 'IN_PROGRESS',
    });
    setItems([{ itemName: '', itemType: 'PART', quantity: 1, unitPrice: 0 }]);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (s: Service) => {
    setEditingService(s);
    setFormData({
      vehicleId: s.vehicleId.toString(),
      appointmentId: s.appointmentId ? s.appointmentId.toString() : '',
      serviceType: s.serviceType,
      customerComplaint: s.customerComplaint || '',
      workPerformed: s.workPerformed || '',
      partsUsed: s.partsUsed || '',
      labourCost: s.labourCost.toString(),
      partsCost: s.partsCost.toString(),
      serviceDate: new Date(s.serviceDate).toISOString().split('T')[0],
      status: s.status,
    });

    if (s.serviceItems && s.serviceItems.length > 0) {
      setItems(
        s.serviceItems.map((item) => ({
          itemName: item.itemName,
          itemType: item.itemType as 'PART' | 'LABOUR',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      );
    } else {
      setItems([{ itemName: '', itemType: 'PART', quantity: 1, unitPrice: 0 }]);
    }

    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId || !formData.serviceType) {
      setFormError('Vehicle and service type are required.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      // Filter valid items
      const validItems = items.filter((i) => i.itemName.trim() !== '');

      const payload = {
        vehicleId: Number(formData.vehicleId),
        appointmentId: formData.appointmentId ? Number(formData.appointmentId) : null,
        serviceType: formData.serviceType,
        customerComplaint: formData.customerComplaint ? formData.customerComplaint.trim() : null,
        workPerformed: formData.workPerformed ? formData.workPerformed.trim() : null,
        partsUsed: formData.partsUsed ? formData.partsUsed.trim() : null,
        labourCost: parseFloat(formData.labourCost) || 0,
        partsCost: parseFloat(formData.partsCost) || 0,
        serviceDate: formData.serviceDate,
        status: formData.status,
        serviceItems: validItems,
      };

      if (editingService) {
        await serviceApi.updateService(editingService.id, payload);
      } else {
        await serviceApi.createService(payload);
      }

      setIsFormModalOpen(false);
      fetchServices();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save service record');
    } finally {
      setFormSubmitting(false);
    }
  };

  const openJobCard = (s: Service) => {
    setSelectedService(s);
    setIsJobCardOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;
    try {
      setDeleteLoading(true);
      await serviceApi.deleteService(serviceToDelete.id);
      setServiceToDelete(null);
      fetchServices();
    } catch (err) {
      console.error('Error deleting service', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            Service Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Log workshop service jobs, track labor & parts, and generate job cards.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Service Job</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by registration number, vehicle brand, complaint, or customer..."
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

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Service ID</th>
                <th className="p-4">Vehicle & Customer</th>
                <th className="p-4">Service Type & Date</th>
                <th className="p-4">Cost (Labour + Parts)</th>
                <th className="p-4 text-center">Service Status</th>
                <th className="p-4 text-center">Payment</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Loading service records...
                  </td>
                </tr>
              ) : services.length > 0 ? (
                services.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-700">
                      #{s.id.toString().padStart(4, '0')}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm font-semibold text-slate-900">
                        <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-200">
                          {s.vehicle?.registrationNumber}
                        </span>
                        <span className="text-slate-600 text-xs">
                          {s.vehicle?.brand} {s.vehicle?.model}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{s.vehicle?.customer?.name}</span>
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{s.serviceType}</p>
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(s.serviceDate)}
                      </span>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-900 text-sm">
                        {formatCurrency(s.totalCost)}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Labour: {formatCurrency(s.labourCost)} | Parts: {formatCurrency(s.partsCost)}
                      </p>
                    </td>

                    <td className="p-4 text-center">
                      <StatusBadge status={s.status} type="service" />
                    </td>

                    <td className="p-4 text-center">
                      {s.payment ? (
                        <StatusBadge status={s.payment.paymentStatus} type="payment" />
                      ) : (
                        <span className="text-xs text-slate-400">Unbilled</span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openJobCard(s)}
                          title="View Job Card / Print"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(s)}
                          title="Edit Service Record"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setServiceToDelete(s)}
                          title="Delete Service Record"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No service records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Service Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingService ? `Edit Service Job #${editingService.id}` : 'Create New Service Record'}
        maxWidth="2xl"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Vehicle *
              </label>
              <select
                required
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} - {v.brand} {v.model} ({v.customer?.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Service Type *
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SERVICE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Service Date *
              </label>
              <input
                type="date"
                required
                value={formData.serviceDate}
                onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ServiceStatus })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Customer Complaint / Reported Symptoms
            </label>
            <input
              type="text"
              placeholder="e.g. Unusual brake squeal when stopping"
              value={formData.customerComplaint}
              onChange={(e) => setFormData({ ...formData, customerComplaint: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Work Performed / Technical Diagnosis
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Inspected front disc rotors, replaced worn brake pads..."
              value={formData.workPerformed}
              onChange={(e) => setFormData({ ...formData, workPerformed: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Dynamic Service Items Breakdown */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Service Items & Parts Breakdown
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Item / Part</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg text-xs">
                  <input
                    type="text"
                    placeholder="Item or Labour description"
                    value={item.itemName}
                    onChange={(e) => updateItemRow(idx, 'itemName', e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <select
                    value={item.itemType}
                    onChange={(e) => updateItemRow(idx, 'itemType', e.target.value)}
                    className="w-24 px-2 py-1.5 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="PART">Part</option>
                    <option value="LABOUR">Labour</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItemRow(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                    className="w-14 px-2 py-1.5 bg-white border border-slate-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => updateItemRow(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1.5 bg-white border border-slate-200 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cost Breakdown & Automatic Total Calculation */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Labour Cost (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.labourCost}
                  onChange={(e) => setFormData({ ...formData, labourCost: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Parts Cost (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.partsCost}
                  onChange={(e) => setFormData({ ...formData, partsCost: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Total Cost Display */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase">
                  Total Cost (Labour + Parts):
                </span>
                <p className="text-[11px] text-slate-400">Automatically calculated</p>
              </div>
              <span className="text-xl font-extrabold text-blue-700">
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {formSubmitting ? 'Saving...' : editingService ? 'Save Changes' : 'Create Service Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Job Card Modal */}
      <Modal
        isOpen={isJobCardOpen}
        onClose={() => setIsJobCardOpen(false)}
        title="Service Job Card & Inspection Summary"
        maxWidth="2xl"
      >
        {selectedService && (
          <div className="space-y-6 text-sm">
            {/* Print Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-bold text-slate-900">AutoCare Service Center</h3>
                <p className="text-xs text-slate-500">Official Service Job Card</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-base text-blue-700">
                  JOB #{selectedService.id.toString().padStart(5, '0')}
                </span>
                <p className="text-xs text-slate-500">{formatDate(selectedService.serviceDate)}</p>
              </div>
            </div>

            {/* Vehicle & Customer Info */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Customer Details</p>
                <p className="font-bold text-slate-900 mt-1">{selectedService.vehicle?.customer?.name}</p>
                <p className="text-xs text-slate-600 mt-0.5">{selectedService.vehicle?.customer?.phone}</p>
                <p className="text-xs text-slate-500">{selectedService.vehicle?.customer?.address || 'Address on file'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Vehicle Details</p>
                <p className="font-mono font-bold text-blue-700 mt-1">
                  {selectedService.vehicle?.registrationNumber}
                </p>
                <p className="text-xs text-slate-700 mt-0.5">
                  {selectedService.vehicle?.brand} {selectedService.vehicle?.model} ({selectedService.vehicle?.vehicleType})
                </p>
                {selectedService.vehicle?.engineNumber && (
                  <p className="text-xs text-slate-500">Engine: {selectedService.vehicle.engineNumber}</p>
                )}
              </div>
            </div>

            {/* Work & Complaint Details */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Customer Reported Complaint:
                </h4>
                <p className="text-xs text-slate-800 mt-1 bg-white p-3 border border-slate-200 rounded-lg">
                  {selectedService.customerComplaint || 'General periodic service check.'}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Work Completed:
                </h4>
                <p className="text-xs text-slate-800 mt-1 bg-white p-3 border border-slate-200 rounded-lg">
                  {selectedService.workPerformed || 'Standard maintenance performed.'}
                </p>
              </div>
            </div>

            {/* Service Items Table */}
            {selectedService.serviceItems && selectedService.serviceItems.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Itemized Charges:
                </h4>
                <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedService.serviceItems.map((item, i) => (
                      <tr key={i}>
                        <td className="p-2.5 font-medium text-slate-800">{item.itemName}</td>
                        <td className="p-2.5 text-slate-500">{item.itemType}</td>
                        <td className="p-2.5 text-center text-slate-700">{item.quantity}</td>
                        <td className="p-2.5 text-right text-slate-700">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-semibold text-slate-900">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Financial Summary */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Labour Cost:</span>
                <span className="font-semibold">{formatCurrency(selectedService.labourCost)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Parts & Materials Cost:</span>
                <span className="font-semibold">{formatCurrency(selectedService.partsCost)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount Due:</span>
                <span className="text-blue-700">{formatCurrency(selectedService.totalCost)}</span>
              </div>
            </div>

            {/* Actions: Print and Close */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Job Card</span>
              </button>

              <button
                type="button"
                onClick={() => setIsJobCardOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Service Record"
        message={`Are you sure you want to delete service job #${serviceToDelete?.id}? This will remove associated line items and billing.`}
        confirmText="Yes, Delete"
        isLoading={deleteLoading}
      />
    </div>
  );
};
