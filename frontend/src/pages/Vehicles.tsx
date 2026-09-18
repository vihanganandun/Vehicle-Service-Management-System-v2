import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  User,
  History,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { vehicleApi, customerApi } from '../services/api';
import { Vehicle, Customer } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

const VEHICLE_TYPES = ['Car', 'SUV', 'Van', 'Motorcycle', 'Lorry / Truck', 'Bus', 'Other'];

export const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    brand: '',
    model: '',
    vehicleType: 'Car',
    year: '',
    engineNumber: '',
    customerId: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // View Details Modal
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Delete Confirm Modal
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchVehicles();
    fetchCustomersList();
  }, []);

  const fetchVehicles = async (searchQuery = '') => {
    try {
      setLoading(true);
      const res = await vehicleApi.getVehicles({ search: searchQuery });
      setVehicles(res.data.vehicles);
    } catch (err) {
      console.error('Error fetching vehicles', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersList = async () => {
    try {
      const res = await customerApi.getCustomers();
      setCustomers(res.data.customers);
    } catch (err) {
      console.error('Error fetching customers list', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVehicles(search);
  };

  const openCreateModal = () => {
    setEditingVehicle(null);
    setFormData({
      registrationNumber: '',
      brand: '',
      model: '',
      vehicleType: 'Car',
      year: new Date().getFullYear().toString(),
      engineNumber: '',
      customerId: customers.length > 0 ? customers[0].id.toString() : '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormData({
      registrationNumber: v.registrationNumber,
      brand: v.brand,
      model: v.model,
      vehicleType: v.vehicleType || 'Car',
      year: v.year ? v.year.toString() : '',
      engineNumber: v.engineNumber || '',
      customerId: v.customerId.toString(),
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.registrationNumber.trim() || !formData.brand.trim() || !formData.model.trim() || !formData.customerId) {
      setFormError('Registration number, brand, model, and owner are required.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);
      const payload = {
        registrationNumber: formData.registrationNumber.trim().toUpperCase(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        vehicleType: formData.vehicleType,
        year: formData.year ? parseInt(formData.year, 10) : undefined,
        engineNumber: formData.engineNumber ? formData.engineNumber.trim() : undefined,
        customerId: parseInt(formData.customerId, 10),
      };

      if (editingVehicle) {
        await vehicleApi.updateVehicle(editingVehicle.id, payload);
      } else {
        await vehicleApi.createVehicle(payload);
      }

      setIsFormModalOpen(false);
      fetchVehicles(search);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save vehicle');
    } finally {
      setFormSubmitting(false);
    }
  };

  const openDetails = async (id: number) => {
    try {
      setDetailsLoading(true);
      setIsDetailsOpen(true);
      const res = await vehicleApi.getVehicleById(id);
      setSelectedVehicle(res.data.vehicle);
    } catch (err) {
      console.error('Error fetching vehicle details', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!vehicleToDelete) return;
    try {
      setDeleteLoading(true);
      await vehicleApi.deleteVehicle(vehicleToDelete.id);
      setVehicleToDelete(null);
      fetchVehicles(search);
    } catch (err) {
      console.error('Error deleting vehicle', err);
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
            <Car className="w-6 h-6 text-blue-600" />
            Vehicle Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Register and manage customer vehicles, specifications, and service history.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by registration number (e.g. CAB-4521), brand, model, or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                fetchVehicles('');
              }}
              className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Reg Number</th>
                <th className="p-4">Vehicle Details</th>
                <th className="p-4">Type</th>
                <th className="p-4">Owner / Customer</th>
                <th className="p-4 text-center">Services</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading vehicles...
                  </td>
                </tr>
              ) : vehicles.length > 0 ? (
                vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <span className="font-mono font-bold text-sm tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                        {v.registrationNumber}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-900">
                        {v.brand} {v.model}
                      </p>
                      <span className="text-xs text-slate-500">
                        {v.year ? `Year: ${v.year}` : ''} {v.engineNumber ? `• Eng: ${v.engineNumber}` : ''}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {v.vehicleType}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{v.customer?.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{v.customer?.phone}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {v._count?.services || 0} services
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetails(v.id)}
                          title="View Vehicle Details & History"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(v)}
                          title="Edit Vehicle"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setVehicleToDelete(v)}
                          title="Delete Vehicle"
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
                    No vehicles found. Try another search or add a vehicle.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Vehicle Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingVehicle ? `Edit Vehicle: ${editingVehicle.registrationNumber}` : 'Register New Vehicle'}
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
              Vehicle Owner (Customer) *
            </label>
            <select
              required
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Registration No. *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CAB-4521"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Vehicle Type
              </label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {VEHICLE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Brand *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Toyota, Honda"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Model *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Prius, Vezel"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Manufacture Year
              </label>
              <input
                type="number"
                placeholder="e.g. 2018"
                min="1950"
                max="2030"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Engine Number
              </label>
              <input
                type="text"
                placeholder="e.g. ENG-883921"
                value={formData.engineNumber}
                onChange={(e) => setFormData({ ...formData, engineNumber: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
              {formSubmitting ? 'Saving...' : editingVehicle ? 'Save Changes' : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Vehicle Details & Service History Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Vehicle Specifications & Service History"
        maxWidth="2xl"
      >
        {detailsLoading ? (
          <p className="text-sm text-slate-500 py-6 text-center">Loading vehicle record...</p>
        ) : selectedVehicle ? (
          <div className="space-y-6">
            {/* Vehicle Card Header */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Reg Number</p>
                <p className="font-mono font-bold text-blue-700 text-base mt-0.5">
                  {selectedVehicle.registrationNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Vehicle</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedVehicle.brand} {selectedVehicle.model}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Type</p>
                <p className="text-slate-800 mt-0.5">{selectedVehicle.vehicleType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Year</p>
                <p className="text-slate-800 mt-0.5">{selectedVehicle.year || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Engine No.</p>
                <p className="text-slate-800 mt-0.5">{selectedVehicle.engineNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Customer</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedVehicle.customer?.name} ({selectedVehicle.customer?.phone})
                </p>
              </div>
            </div>

            {/* Service History Timeline */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  Service History ({selectedVehicle.services?.length || 0})
                </h4>
                <button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    navigate(`/service-history?registrationNumber=${selectedVehicle.registrationNumber}`);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Full History Search &rarr;
                </button>
              </div>

              {selectedVehicle.services && selectedVehicle.services.length > 0 ? (
                <div className="space-y-3">
                  {selectedVehicle.services.map((s) => (
                    <div
                      key={s.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 text-sm">{s.serviceType}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {formatCurrency(s.totalCost)}
                          </span>
                          <StatusBadge status={s.status} type="service" />
                        </div>
                      </div>

                      <p className="text-xs text-slate-500">Date: {formatDate(s.serviceDate)}</p>

                      {s.workPerformed && (
                        <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded">
                          <span className="font-semibold">Work:</span> {s.workPerformed}
                        </p>
                      )}

                      <div className="flex justify-between items-center text-xs text-slate-500 pt-1 border-t border-slate-100">
                        <span>Labour: {formatCurrency(s.labourCost)} | Parts: {formatCurrency(s.partsCost)}</span>
                        {s.payment && (
                          <span
                            className={`font-semibold ${
                              s.payment.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            Payment: {s.payment.paymentStatus} ({s.payment.paymentMethod})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-lg text-center">
                  No service records recorded for this vehicle yet.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!vehicleToDelete}
        onClose={() => setVehicleToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Vehicle"
        message={`Are you sure you want to delete vehicle ${vehicleToDelete?.registrationNumber}? All service logs and appointments for this vehicle will also be deleted.`}
        confirmText="Yes, Delete"
        isLoading={deleteLoading}
      />
    </div>
  );
};
