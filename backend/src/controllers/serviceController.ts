import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ServiceStatus, AppointmentStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

export async function getServices(req: Request, res: Response) {
  try {
    const { status, vehicleId, search } = req.query;

    const where: any = {};
    if (status && typeof status === 'string' && status in ServiceStatus) {
      where.status = status as ServiceStatus;
    }

    if (vehicleId) {
      where.vehicleId = Number(vehicleId);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { serviceType: { contains: q } },
        { customerComplaint: { contains: q } },
        { workPerformed: { contains: q } },
        { vehicle: { registrationNumber: { contains: q } } },
        { vehicle: { customer: { name: { contains: q } } } },
      ];
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        vehicle: {
          include: {
            customer: {
              select: { id: true, name: true, phone: true, email: true },
            },
          },
        },
        appointment: {
          select: { id: true, date: true, time: true },
        },
        payment: true,
        serviceItems: true,
      },
      orderBy: { serviceDate: 'desc' },
    });

    return res.json({ services });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch services', error: error.message });
  }
}

export async function getServiceById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({
      where: { id: Number(id) },
      include: {
        vehicle: {
          include: {
            customer: true,
          },
        },
        appointment: true,
        payment: true,
        serviceItems: true,
      },
    });

    if (!service) {
      return res.status(404).json({ message: 'Service record not found' });
    }

    return res.json({ service });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch service details', error: error.message });
  }
}

export async function createService(req: Request, res: Response) {
  try {
    const {
      vehicleId,
      appointmentId,
      serviceType,
      customerComplaint,
      workPerformed,
      partsUsed,
      labourCost = 0,
      partsCost = 0,
      serviceDate,
      status = 'IN_PROGRESS',
      serviceItems = [],
    } = req.body;

    if (!vehicleId || !serviceType) {
      return res.status(400).json({ message: 'Vehicle and service type are required' });
    }

    const numLabour = parseFloat(labourCost) || 0;
    const numParts = parseFloat(partsCost) || 0;
    const totalCost = Math.round((numLabour + numParts) * 100) / 100;

    const parsedStatus = status in ServiceStatus ? (status as ServiceStatus) : ServiceStatus.IN_PROGRESS;

    // Create service record with items and initial pending payment
    const newService = await prisma.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: {
          vehicleId: Number(vehicleId),
          appointmentId: appointmentId ? Number(appointmentId) : null,
          serviceType: serviceType.trim(),
          customerComplaint: customerComplaint ? customerComplaint.trim() : null,
          workPerformed: workPerformed ? workPerformed.trim() : null,
          partsUsed: partsUsed ? partsUsed.trim() : null,
          labourCost: numLabour,
          partsCost: numParts,
          totalCost: totalCost,
          serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
          status: parsedStatus,
          serviceItems: {
            create: Array.isArray(serviceItems)
              ? serviceItems.map((item: any) => ({
                  itemName: item.itemName,
                  itemType: item.itemType || 'PART',
                  quantity: parseInt(item.quantity, 10) || 1,
                  unitPrice: parseFloat(item.unitPrice) || 0,
                  totalPrice: (parseInt(item.quantity, 10) || 1) * (parseFloat(item.unitPrice) || 0),
                }))
              : [],
          },
          payment: {
            create: {
              amount: totalCost,
              paymentDate: new Date(),
              paymentMethod: PaymentMethod.CASH,
              paymentStatus: PaymentStatus.PENDING,
              notes: 'Pending payment settlement upon completion',
            },
          },
        },
        include: {
          vehicle: { include: { customer: true } },
          serviceItems: true,
          payment: true,
        },
      });

      // Update appointment status if linked
      if (appointmentId) {
        await tx.appointment.update({
          where: { id: Number(appointmentId) },
          data: {
            status: parsedStatus === ServiceStatus.COMPLETED ? AppointmentStatus.COMPLETED : AppointmentStatus.IN_PROGRESS,
          },
        });
      }

      return service;
    });

    return res.status(201).json({ message: 'Service record created successfully', service: newService });
  } catch (error: any) {
    console.error('Error creating service:', error);
    return res.status(500).json({ message: 'Failed to create service', error: error.message });
  }
}

export async function updateService(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      vehicleId,
      appointmentId,
      serviceType,
      customerComplaint,
      workPerformed,
      partsUsed,
      labourCost,
      partsCost,
      serviceDate,
      status,
      serviceItems,
    } = req.body;

    const existing = await prisma.service.findUnique({
      where: { id: Number(id) },
      include: { payment: true, serviceItems: true },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Service record not found' });
    }

    const numLabour = labourCost !== undefined ? parseFloat(labourCost) || 0 : existing.labourCost;
    const numParts = partsCost !== undefined ? parseFloat(partsCost) || 0 : existing.partsCost;
    const totalCost = Math.round((numLabour + numParts) * 100) / 100;

    const parsedStatus = status && status in ServiceStatus ? (status as ServiceStatus) : existing.status;

    const updatedService = await prisma.$transaction(async (tx) => {
      // Replace service items if provided
      if (Array.isArray(serviceItems)) {
        await tx.serviceItem.deleteMany({ where: { serviceId: existing.id } });
        if (serviceItems.length > 0) {
          await tx.serviceItem.createMany({
            data: serviceItems.map((item: any) => ({
              serviceId: existing.id,
              itemName: item.itemName,
              itemType: item.itemType || 'PART',
              quantity: parseInt(item.quantity, 10) || 1,
              unitPrice: parseFloat(item.unitPrice) || 0,
              totalPrice: (parseInt(item.quantity, 10) || 1) * (parseFloat(item.unitPrice) || 0),
            })),
          });
        }
      }

      const service = await tx.service.update({
        where: { id: existing.id },
        data: {
          vehicleId: vehicleId ? Number(vehicleId) : existing.vehicleId,
          appointmentId: appointmentId !== undefined ? (appointmentId ? Number(appointmentId) : null) : existing.appointmentId,
          serviceType: serviceType ? serviceType.trim() : existing.serviceType,
          customerComplaint: customerComplaint !== undefined ? (customerComplaint ? customerComplaint.trim() : null) : existing.customerComplaint,
          workPerformed: workPerformed !== undefined ? (workPerformed ? workPerformed.trim() : null) : existing.workPerformed,
          partsUsed: partsUsed !== undefined ? (partsUsed ? partsUsed.trim() : null) : existing.partsUsed,
          labourCost: numLabour,
          partsCost: numParts,
          totalCost: totalCost,
          serviceDate: serviceDate ? new Date(serviceDate) : existing.serviceDate,
          status: parsedStatus,
        },
        include: {
          vehicle: { include: { customer: true } },
          serviceItems: true,
          payment: true,
        },
      });

      // If existing payment is still PENDING, update its amount to match new totalCost
      if (existing.payment && existing.payment.paymentStatus === PaymentStatus.PENDING) {
        await tx.payment.update({
          where: { id: existing.payment.id },
          data: { amount: totalCost },
        });
      }

      // Update linked appointment if status changed to COMPLETED
      if (existing.appointmentId && parsedStatus === ServiceStatus.COMPLETED) {
        await tx.appointment.update({
          where: { id: existing.appointmentId },
          data: { status: AppointmentStatus.COMPLETED },
        });
      }

      return service;
    });

    return res.json({ message: 'Service updated successfully', service: updatedService });
  } catch (error: any) {
    console.error('Error updating service:', error);
    return res.status(500).json({ message: 'Failed to update service', error: error.message });
  }
}

export async function deleteService(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const serviceId = Number(id);

    const existing = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!existing) {
      return res.status(404).json({ message: 'Service record not found' });
    }

    await prisma.service.delete({ where: { id: serviceId } });
    return res.json({ message: 'Service record deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete service', error: error.message });
  }
}
