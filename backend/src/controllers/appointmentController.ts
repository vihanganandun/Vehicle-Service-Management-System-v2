import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AppointmentStatus } from '@prisma/client';

export async function getAppointments(req: Request, res: Response) {
  try {
    const { status, date, customerId, vehicleId } = req.query;

    const where: any = {};
    if (status && typeof status === 'string' && status in AppointmentStatus) {
      where.status = status as AppointmentStatus;
    }

    if (customerId) {
      where.customerId = Number(customerId);
    }

    if (vehicleId) {
      where.vehicleId = Number(vehicleId);
    }

    if (date && typeof date === 'string') {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        vehicle: {
          select: { id: true, registrationNumber: true, brand: true, model: true },
        },
        services: {
          select: { id: true, status: true, totalCost: true },
        },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });

    return res.json({ appointments });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch appointments', error: error.message });
  }
}

export async function getAppointmentById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        vehicle: true,
        services: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    return res.json({ appointment });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch appointment', error: error.message });
  }
}

export async function createAppointment(req: Request, res: Response) {
  try {
    const { customerId, vehicleId, date, time, serviceType, notes, status } = req.body;

    if (!customerId || !vehicleId || !date || !time || !serviceType) {
      return res.status(400).json({ message: 'Customer, vehicle, date, time, and service type are required' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        customerId: Number(customerId),
        vehicleId: Number(vehicleId),
        date: new Date(date),
        time: time.trim(),
        serviceType: serviceType.trim(),
        notes: notes ? notes.trim() : null,
        status: status && status in AppointmentStatus ? (status as AppointmentStatus) : AppointmentStatus.PENDING,
      },
      include: {
        customer: true,
        vehicle: true,
      },
    });

    return res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to create appointment', error: error.message });
  }
}

export async function updateAppointment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { customerId, vehicleId, date, time, serviceType, notes, status } = req.body;

    const existing = await prisma.appointment.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        customerId: customerId ? Number(customerId) : existing.customerId,
        vehicleId: vehicleId ? Number(vehicleId) : existing.vehicleId,
        date: date ? new Date(date) : existing.date,
        time: time ? time.trim() : existing.time,
        serviceType: serviceType ? serviceType.trim() : existing.serviceType,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : existing.notes,
        status: status && status in AppointmentStatus ? (status as AppointmentStatus) : existing.status,
      },
      include: {
        customer: true,
        vehicle: true,
      },
    });

    return res.json({ message: 'Appointment updated successfully', appointment: updated });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to update appointment', error: error.message });
  }
}

export async function deleteAppointment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const appointmentId = Number(id);

    const existing = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!existing) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    await prisma.appointment.delete({ where: { id: appointmentId } });
    return res.json({ message: 'Appointment deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete appointment', error: error.message });
  }
}
