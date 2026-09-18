import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { PaymentMethod, PaymentStatus, ServiceStatus } from '@prisma/client';

export async function getPayments(req: Request, res: Response) {
  try {
    const { status, method, search } = req.query;

    const where: any = {};
    if (status && typeof status === 'string' && status in PaymentStatus) {
      where.paymentStatus = status as PaymentStatus;
    }

    if (method && typeof method === 'string' && method in PaymentMethod) {
      where.paymentMethod = method as PaymentMethod;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { notes: { contains: q } },
        { service: { serviceType: { contains: q } } },
        { service: { vehicle: { registrationNumber: { contains: q } } } },
        { service: { vehicle: { customer: { name: { contains: q } } } } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        service: {
          include: {
            vehicle: {
              include: {
                customer: {
                  select: { id: true, name: true, phone: true, email: true },
                },
              },
            },
            serviceItems: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return res.json({ payments });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch payments', error: error.message });
  }
}

export async function getPaymentById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({
      where: { id: Number(id) },
      include: {
        service: {
          include: {
            vehicle: {
              include: {
                customer: true,
              },
            },
            serviceItems: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    return res.json({ payment });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch payment details', error: error.message });
  }
}

export async function updatePayment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { amount, paymentDate, paymentMethod, paymentStatus, notes } = req.body;

    const existing = await prisma.payment.findUnique({
      where: { id: Number(id) },
      include: { service: true },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    const targetStatus = paymentStatus && paymentStatus in PaymentStatus ? (paymentStatus as PaymentStatus) : existing.paymentStatus;
    const targetMethod = paymentMethod && paymentMethod in PaymentMethod ? (paymentMethod as PaymentMethod) : existing.paymentMethod;

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: existing.id },
        data: {
          amount: amount !== undefined ? parseFloat(amount) : existing.amount,
          paymentDate: paymentDate ? new Date(paymentDate) : existing.paymentDate,
          paymentMethod: targetMethod,
          paymentStatus: targetStatus,
          notes: notes !== undefined ? (notes ? notes.trim() : null) : existing.notes,
        },
        include: {
          service: {
            include: {
              vehicle: { include: { customer: true } },
            },
          },
        },
      });

      // If payment is marked as PAID, also make sure service is completed if requested
      if (targetStatus === PaymentStatus.PAID && existing.service.status === ServiceStatus.IN_PROGRESS) {
        await tx.service.update({
          where: { id: existing.serviceId },
          data: { status: ServiceStatus.COMPLETED },
        });
      }

      return p;
    });

    return res.json({ message: 'Payment updated successfully', payment: updated });
  } catch (error: any) {
    console.error('Error updating payment:', error);
    return res.status(500).json({ message: 'Failed to update payment', error: error.message });
  }
}

export async function deletePayment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const paymentId = Number(id);

    const existing = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!existing) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    await prisma.payment.delete({ where: { id: paymentId } });
    return res.json({ message: 'Payment record deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete payment', error: error.message });
  }
}
