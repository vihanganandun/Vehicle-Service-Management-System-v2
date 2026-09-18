import axios from 'axios';
import {
  User,
  Customer,
  Vehicle,
  Appointment,
  Service,
  Payment,
  DashboardStats,
  ReportData,
} from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vsm_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login if 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('vsm_token');
      localStorage.removeItem('vsm_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post<{ message: string; token: string; user: User }>('/auth/login', credentials),
  getMe: () => api.get<{ user: User }>('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<{ message: string }>('/auth/change-password', data),
};

// Users API (Admin)
export const userApi = {
  getUsers: () => api.get<{ users: User[] }>('/users'),
  createUser: (data: Partial<User> & { password: string }) =>
    api.post<{ message: string; user: User }>('/users', data),
  updateUser: (id: number, data: Partial<User> & { password?: string }) =>
    api.put<{ message: string; user: User }>(`/users/${id}`, data),
  deleteUser: (id: number) => api.delete<{ message: string }>(`/users/${id}`),
};

// Customer API
export const customerApi = {
  getCustomers: (search?: string) =>
    api.get<{ customers: Customer[] }>('/customers', { params: { search } }),
  getCustomerById: (id: number) => api.get<{ customer: Customer }>(`/customers/${id}`),
  createCustomer: (data: { name: string; phone: string; email?: string; address?: string }) =>
    api.post<{ message: string; customer: Customer }>('/customers', data),
  updateCustomer: (id: number, data: Partial<Customer>) =>
    api.put<{ message: string; customer: Customer }>(`/customers/${id}`, data),
  deleteCustomer: (id: number) => api.delete<{ message: string }>(`/customers/${id}`),
};

// Vehicle API
export const vehicleApi = {
  getVehicles: (params?: { search?: string; customerId?: number }) =>
    api.get<{ vehicles: Vehicle[] }>('/vehicles', { params }),
  getVehicleById: (id: number) => api.get<{ vehicle: Vehicle }>(`/vehicles/${id}`),
  createVehicle: (data: {
    registrationNumber: string;
    brand: string;
    model: string;
    vehicleType?: string;
    year?: number;
    engineNumber?: string;
    customerId: number;
  }) => api.post<{ message: string; vehicle: Vehicle }>('/vehicles', data),
  updateVehicle: (id: number, data: Partial<Vehicle>) =>
    api.put<{ message: string; vehicle: Vehicle }>(`/vehicles/${id}`, data),
  deleteVehicle: (id: number) => api.delete<{ message: string }>(`/vehicles/${id}`),
};

// Appointment API
export const appointmentApi = {
  getAppointments: (params?: { status?: string; date?: string; customerId?: number; vehicleId?: number }) =>
    api.get<{ appointments: Appointment[] }>('/appointments', { params }),
  getAppointmentById: (id: number) => api.get<{ appointment: Appointment }>(`/appointments/${id}`),
  createAppointment: (data: {
    customerId: number;
    vehicleId: number;
    date: string;
    time: string;
    serviceType: string;
    notes?: string;
    status?: string;
  }) => api.post<{ message: string; appointment: Appointment }>('/appointments', data),
  updateAppointment: (id: number, data: Partial<Appointment>) =>
    api.put<{ message: string; appointment: Appointment }>(`/appointments/${id}`, data),
  deleteAppointment: (id: number) => api.delete<{ message: string }>(`/appointments/${id}`),
};

// Service API
export const serviceApi = {
  getServices: (params?: { status?: string; vehicleId?: number; search?: string }) =>
    api.get<{ services: Service[] }>('/services', { params }),
  getServiceById: (id: number) => api.get<{ service: Service }>(`/services/${id}`),
  createService: (data: {
    vehicleId: number;
    appointmentId?: number | null;
    serviceType: string;
    customerComplaint?: string | null;
    workPerformed?: string | null;
    partsUsed?: string | null;
    labourCost?: number;
    partsCost?: number;
    serviceDate?: string;
    status?: string;
    serviceItems?: any[];
  }) => api.post<{ message: string; service: Service }>('/services', data),
  updateService: (id: number, data: any) =>
    api.put<{ message: string; service: Service }>(`/services/${id}`, data),
  deleteService: (id: number) => api.delete<{ message: string }>(`/services/${id}`),
};

// Payment API
export const paymentApi = {
  getPayments: (params?: { status?: string; method?: string; search?: string }) =>
    api.get<{ payments: Payment[] }>('/payments', { params }),
  getPaymentById: (id: number) => api.get<{ payment: Payment }>(`/payments/${id}`),
  updatePayment: (
    id: number,
    data: {
      amount?: number;
      paymentDate?: string;
      paymentMethod?: string;
      paymentStatus?: string;
      notes?: string;
    }
  ) => api.put<{ message: string; payment: Payment }>(`/payments/${id}`, data),
  deletePayment: (id: number) => api.delete<{ message: string }>(`/payments/${id}`),
};

// Service History API
export const historyApi = {
  getServiceHistory: (params?: {
    search?: string;
    registrationNumber?: string;
    customerName?: string;
    serviceType?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get<{ history: Service[] }>('/service-history', { params }),
};

// Reports and Dashboard API
export const reportApi = {
  getDashboardStats: () => api.get<DashboardStats>('/reports/dashboard'),
  getReports: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ReportData>('/reports', { params }),
};

export default api;
