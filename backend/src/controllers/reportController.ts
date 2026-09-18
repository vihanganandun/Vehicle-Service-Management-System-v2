import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AppointmentStatus, ServiceStatus, PaymentStatus } from '@prisma/client';

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Run parallel counts
    const [
      totalCustomers,
      totalVehicles,
      todayAppointments,
      pendingServices,
      completedServices,
      paymentsAgg,
      recentAppointments,
      recentServices,
      servicesByType,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.vehicle.count(),
      prisma.appointment.count({
        where: {
          date: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
      prisma.service.count({
        where: { status: ServiceStatus.IN_PROGRESS },
      }),
      prisma.service.count({
        where: { status: ServiceStatus.COMPLETED },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paymentStatus: PaymentStatus.PAID },
      }),
      prisma.appointment.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          customer: { select: { name: true, phone: true } },
          vehicle: { select: { registrationNumber: true, brand: true, model: true } },
        },
      }),
      prisma.service.findMany({
        take: 5,
        orderBy: { serviceDate: 'desc' },
        include: {
          vehicle: {
            select: {
              registrationNumber: true,
              brand: true,
              model: true,
              customer: { select: { name: true } },
            },
          },
          payment: { select: { paymentStatus: true, amount: true } },
        },
      }),
      prisma.service.groupBy({
        by: ['serviceType'],
        _count: { id: true },
      }),
    ]);

    // Monthly revenue and service count for the last 6 months
    const monthlyStats: Array<{ month: string; revenue: number; services: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthName = startOfMonth.toLocaleString('default', { month: 'short', year: 'numeric' });

      const [monthRevenue, monthCount] = await Promise.all([
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            paymentStatus: PaymentStatus.PAID,
            paymentDate: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        prisma.service.count({
          where: {
            serviceDate: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
      ]);

      monthlyStats.push({
        month: monthName,
        revenue: monthRevenue._sum.amount || 0,
        services: monthCount,
      });
    }

    return res.json({
      stats: {
        totalCustomers,
        totalVehicles,
        todayAppointments,
        pendingServices,
        completedServices,
        totalRevenue: paymentsAgg._sum.amount || 0,
      },
      monthlyStats,
      servicesByType: servicesByType.map((s) => ({
        name: s.serviceType,
        count: s._count.id,
      })),
      recentAppointments,
      recentServices,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ message: 'Failed to fetch dashboard statistics', error: error.message });
  }
}

export async function getReports(req: Request, res: Response) {
  try {
    const { startDate, endDate, reportType } = req.query;

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const whereService: any = {};
    if (Object.keys(dateFilter).length > 0) {
      whereService.serviceDate = dateFilter;
    }

    const wherePayment: any = { paymentStatus: PaymentStatus.PAID };
    if (Object.keys(dateFilter).length > 0) {
      wherePayment.paymentDate = dateFilter;
    }

    const [services, payments, methodBreakdown] = await Promise.all([
      prisma.service.findMany({
        where: whereService,
        include: {
          vehicle: { include: { customer: true } },
          payment: true,
          serviceItems: true,
        },
        orderBy: { serviceDate: 'desc' },
      }),
      prisma.payment.findMany({
        where: wherePayment,
        include: {
          service: {
            include: {
              vehicle: { include: { customer: true } },
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
      }),
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        _sum: { amount: true },
        _count: { id: true },
        where: wherePayment,
      }),
    ]);

    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalLabourCost = services.reduce((acc, s) => acc + s.labourCost, 0);
    const totalPartsCost = services.reduce((acc, s) => acc + s.partsCost, 0);
    const totalServicesCount = services.length;
    const completedServicesCount = services.filter((s) => s.status === ServiceStatus.COMPLETED).length;

    return res.json({
      summary: {
        totalRevenue,
        totalLabourCost,
        totalPartsCost,
        totalServicesCount,
        completedServicesCount,
        paidTransactionsCount: payments.length,
      },
      methodBreakdown: methodBreakdown.map((m) => ({
        method: m.paymentMethod,
        totalAmount: m._sum.amount || 0,
        count: m._count.id,
      })),
      services,
      payments,
    });
  } catch (error: any) {
    console.error('Error generating reports:', error);
    return res.status(500).json({ message: 'Failed to generate reports', error: error.message });
  }
}
