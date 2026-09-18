import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function getVehicles(req: Request, res: Response) {
  try {
    const { search, customerId } = req.query;

    const where: any = {};
    if (customerId) {
      where.customerId = Number(customerId);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { registrationNumber: { contains: q } },
        { brand: { contains: q } },
        { model: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { phone: { contains: q } } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        _count: {
          select: { services: true, appointments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ vehicles });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch vehicles', error: error.message });
  }
}

export async function getVehicleById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        services: {
          include: {
            serviceItems: true,
            payment: true,
          },
          orderBy: { serviceDate: 'desc' },
        },
        appointments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    return res.json({ vehicle });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch vehicle details', error: error.message });
  }
}

export async function createVehicle(req: Request, res: Response) {
  try {
    const { registrationNumber, brand, model, vehicleType, year, engineNumber, customerId } = req.body;

    if (!registrationNumber || !brand || !model || !customerId) {
      return res.status(400).json({ message: 'Registration number, brand, model, and customer are required' });
    }

    const regUpper = registrationNumber.trim().toUpperCase();

    const existingReg = await prisma.vehicle.findUnique({
      where: { registrationNumber: regUpper },
    });

    if (existingReg) {
      return res.status(400).json({ message: `Vehicle with registration number "${regUpper}" already exists` });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: Number(customerId) },
    });

    if (!customer) {
      return res.status(404).json({ message: 'Selected customer does not exist' });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNumber: regUpper,
        brand: brand.trim(),
        model: model.trim(),
        vehicleType: vehicleType ? vehicleType.trim() : 'Car',
        year: year ? parseInt(year, 10) : null,
        engineNumber: engineNumber ? engineNumber.trim() : null,
        customerId: Number(customerId),
      },
      include: {
        customer: true,
      },
    });

    return res.status(201).json({ message: 'Vehicle added successfully', vehicle });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to create vehicle', error: error.message });
  }
}

export async function updateVehicle(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { registrationNumber, brand, model, vehicleType, year, engineNumber, customerId } = req.body;

    const existing = await prisma.vehicle.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const regUpper = registrationNumber ? registrationNumber.trim().toUpperCase() : existing.registrationNumber;

    if (regUpper !== existing.registrationNumber) {
      const duplicate = await prisma.vehicle.findUnique({ where: { registrationNumber: regUpper } });
      if (duplicate) {
        return res.status(400).json({ message: `Vehicle with registration number "${regUpper}" already exists` });
      }
    }

    const updated = await prisma.vehicle.update({
      where: { id: Number(id) },
      data: {
        registrationNumber: regUpper,
        brand: brand !== undefined ? brand.trim() : existing.brand,
        model: model !== undefined ? model.trim() : existing.model,
        vehicleType: vehicleType !== undefined ? vehicleType.trim() : existing.vehicleType,
        year: year !== undefined ? (year ? parseInt(year, 10) : null) : existing.year,
        engineNumber: engineNumber !== undefined ? (engineNumber ? engineNumber.trim() : null) : existing.engineNumber,
        customerId: customerId !== undefined ? Number(customerId) : existing.customerId,
      },
      include: {
        customer: true,
      },
    });

    return res.json({ message: 'Vehicle updated successfully', vehicle: updated });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to update vehicle', error: error.message });
  }
}

export async function deleteVehicle(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const vehicleId = Number(id);

    const existing = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!existing) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await prisma.vehicle.delete({ where: { id: vehicleId } });
    return res.json({ message: 'Vehicle and related history deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete vehicle', error: error.message });
  }
}
