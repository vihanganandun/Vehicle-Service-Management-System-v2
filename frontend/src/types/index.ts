export type Role = 'ADMIN' | 'STAFF';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  vehicles?: Vehicle[];
  appointments?: Appointment[];
  _count?: {
    vehicles: number;
    appointments: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Vehicle {
  id: number;
  registrationNumber: string;
  brand: string;
  model: string;
  vehicleType: string;
  year?: number | null;
  engineNumber?: string | null;
  customerId: number;
  customer?: Customer;
  appointments?: Appointment[];
  services?: Service[];
  _count?: {
    services: number;
    appointments: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  id: number;
  customerId: number;
  customer?: Customer;
  vehicleId: number;
  vehicle?: Vehicle;
  date: string;
  time: string;
  serviceType: string;
  notes?: string | null;
  status: AppointmentStatus;
  services?: Service[];
  createdAt?: string;
  updatedAt?: string;
}

export type ServiceStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ServiceItem {
  id?: number;
  serviceId?: number;
  itemName: string;
  itemType: 'PART' | 'LABOUR';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Service {
  id: number;
  appointmentId?: number | null;
  appointment?: Appointment | null;
  vehicleId: number;
  vehicle?: Vehicle;
  serviceType: string;
  customerComplaint?: string | null;
  workPerformed?: string | null;
  partsUsed?: string | null;
  labourCost: number;
  partsCost: number;
  totalCost: number;
  serviceDate: string;
  status: ServiceStatus;
  serviceItems?: ServiceItem[];
  payment?: Payment | null;
  createdAt?: string;
  updatedAt?: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER';
export type PaymentStatus = 'PENDING' | 'PAID';

export interface Payment {
  id: number;
  serviceId: number;
  service?: Service;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  stats: {
    totalCustomers: number;
    totalVehicles: number;
    todayAppointments: number;
    pendingServices: number;
    completedServices: number;
    totalRevenue: number;
  };
  monthlyStats: Array<{
    month: string;
    revenue: number;
    services: number;
  }>;
  servicesByType: Array<{
    name: string;
    count: number;
  }>;
  recentAppointments: Appointment[];
  recentServices: Service[];
}

export interface ReportData {
  summary: {
    totalRevenue: number;
    totalLabourCost: number;
    totalPartsCost: number;
    totalServicesCount: number;
    completedServicesCount: number;
    paidTransactionsCount: number;
  };
  methodBreakdown: Array<{
    method: PaymentMethod;
    totalAmount: number;
    count: number;
  }>;
  services: Service[];
  payments: Payment[];
}
