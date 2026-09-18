import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  User,
  Car,
  Wrench,
  Clock,
  Calendar,
  AlertCircle,
  PlayCircle,
} from 'lucide-react';
import { appointmentApi, customerApi, vehicleApi, serviceApi } from '../services/api';
import { Appointment, Customer, Vehicle, AppointmentStatus } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate } from '../utils/formatters';

const STATUS_LIST: AppointmentStatus[] = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

const SERVICE_TYPES = [
  'Oil Change',
  'Full Service',
  'Brake Service',
  'Engine Check',
  'Tire Service',
  'Battery Replacement',
  'General Repair',
];

export const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Add / Edit Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 AM',
    serviceType: 'Oil Change',
    notes: '',
    status: 'PENDING' as AppointmentStatus,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete modal
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
    fetchCustomers();
  }, [statusFilter, dateFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentApi.getAppointments({
        status: statusFilter || undefined,
        date: dateFilter || undefined,
      });
      setAppointments(res.data.appointments);
    } catch (err) {
      console.error('Error fetching appointments', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await customerApi.getCustomers();
      setCustomers(res.data.customers);
    } catch (err) {
      console.error('Error fetching customers', err);
    }
  };

  // When customer changes in form, fetch their vehicles
  const handleCustomerChange = async (customerIdStr: string) => {
    setFormData((prev) => ({ ...prev, customerId: customerIdStr, vehicleId: '' }));
    if (!customerIdStr) {
      setCustomerVehicles([]);
      return;
    }
    try {
      const res = await vehicleApi.getVehicles({ customerId: Number(customerIdStr) });
      setCustomerVehicles(res.data.vehicles);
      if (res.data.vehicles.length > 0) {
        setFormData((prev) => ({ ...prev, vehicleId: res.data.vehicles[0].id.toString() }));
      }
    } catch (err) {
      console.error('Error loading vehicles for customer', err);
    }
  };

  const openCreateModal = () => {
    setEditingAppointment(null);
    setFormData({
      customerId: customers.length > 0 ? customers[0].id.toString() : '',
      vehicleId: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00 AM',
      serviceType: 'Oil Change',
      notes: '',
      status: 'PENDING',
    });
    setFormError(null);
    setIsFormModalOpen(true);

    if (customers.length > 0) {
      handleCustomerChange(customers[0].id.toString());
    }
  };

  const openEditModal = async (appt: Appointment) => {
    setEditingAppointment(appt);
    setFormError(null);

    // Load vehicles for this customer
    try {
      const res = await vehicleApi.getVehicles({ customerId: appt.customerId });
      setCustomerVehicles(res.data.vehicles);
    } catch (e) {
      console.error(e);
    }

    setFormData({
      customerId: appt.customerId.toString(),
      vehicleId: appt.vehicleId.toString(),
      date: new Date(appt.date).toISOString().split('T')[0],
      time: appt.time,
      serviceType: appt.serviceType,
      notes: appt.notes || '',
      status: appt.status,
    });
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.vehicleId || !formData.date || !formData.time || !formData.serviceType) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      const payload = {
        customerId: Number(formData.customerId),
        vehicleId: Number(formData.vehicleId),
        date: formData.date,
        time: formData.time,
        serviceType: formData.serviceType,
        notes: formData.notes ? formData.notes.trim() : undefined,
        status: formData.status,
      };

      if (editingAppointment) {
        await appointmentApi.updateAppointment(editingAppointment.id, payload);
      } else {
        await appointmentApi.createAppointment(payload);
      }

      setIsFormModalOpen(false);
      fetchAppointments();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save appointment');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!appointmentToDelete) return;
    try {
      setDeleteLoading(true);
      await appointmentApi.deleteAppointment(appointmentToDelete.id);
      setAppointmentToDelete(null);
      fetchAppointments();
    } catch (err) {
      console.error('Error deleting appointment', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Convert appointment into an active service job
  const handleStartService = async (appt: Appointment) => {
    try {
      await appointmentApi.updateAppointment(appt.id, { status: 'IN_PROGRESS' });
      navigate(`/services?new=true&appointmentId=${appt.id}&vehicleId=${appt.vehicleId}&serviceType=${encodeURIComponent(appt.serviceType)}`);
    } catch (err) {
      console.error('Failed to start service from appointment', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-blue-600" />
            Appointment Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Schedule, monitor, and transition service appointments into active bay jobs.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700 uppercase">Filters:</span>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {STATUS_LIST.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {(statusFilter || dateFilter) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setDateFilter('');
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Customer & Vehicle</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Service Type</th>
                <th className="p-4">Notes</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading appointments...
                  </td>
                </tr>
              ) : appointments.length > 0 ? (
                appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{appt.customer?.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Car className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono font-medium text-blue-700">
                          {appt.vehicle?.registrationNumber}
                        </span>
                        <span>
                          ({appt.vehicle?.brand} {appt.vehicle?.model})
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-slate-700">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(appt.date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{appt.time}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded text-xs">
                        {appt.serviceType}
                      </span>
                    </td>

                    <td className="p-4 text-slate-600 max-w-xs text-xs">
                      {appt.notes ? (
                        <span className="line-clamp-2">{appt.notes}</span>
                      ) : (
                        <span className="text-slate-400 italic">No notes</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <StatusBadge status={appt.status} type="appointment" />
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {appt.status !== 'COMPLETED' && appt.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleStartService(appt)}
                            title="Start Service / Convert to Job Card"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-md transition-colors"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Start Service</span>
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(appt)}
                          title="Edit Appointment"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setAppointmentToDelete(appt)}
                          title="Cancel / Delete Appointment"
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
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No appointments matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Appointment Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingAppointment ? `Edit Appointment #${editingAppointment.id}` : 'Book Service Appointment'}
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Customer *
            </label>
            <select
              required
              value={formData.customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Vehicle *
            </label>
            <select
              required
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={customerVehicles.length === 0}
            >
              <option value="">
                {customerVehicles.length === 0 ? '-- No vehicles for this customer --' : '-- Choose Vehicle --'}
              </option>
              {customerVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber} - {v.brand} {v.model} ({v.vehicleType})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Appointment Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Preferred Time *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 09:30 AM"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as AppointmentStatus })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Customer Notes / Issue Description
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Customer reported vibration at high speed..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              {formSubmitting ? 'Saving...' : editingAppointment ? 'Save Changes' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!appointmentToDelete}
        onClose={() => setAppointmentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Appointment"
        message={`Are you sure you want to cancel and delete appointment #${appointmentToDelete?.id}?`}
        confirmText="Yes, Delete"
        isLoading={deleteLoading}
      />
    </div>
  );
};
