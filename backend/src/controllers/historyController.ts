import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function getServiceHistory(req: Request, res: Response) {
  try {
    const { search, registrationNumber, customerName, serviceType, startDate, endDate } = req.query;

    const where: any = {};

    // Specific filters
    if (registrationNumber && typeof registrationNumber === 'string') {
      where.vehicle = {
        registrationNumber: { contains: registrationNumber.trim() },
      };
    }

    if (customerName && typeof customerName === 'string') {
      where.vehicle = {
        ...where.vehicle,
        customer: {
          name: { contains: customerName.trim() },
        },
      };
    }

    if (serviceType && typeof serviceType === 'string') {
      where.serviceType = { contains: serviceType.trim() };
    }

    // General search query
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { vehicle: { registrationNumber: { contains: q } } },
        { vehicle: { brand: { contains: q } } },
        { vehicle: { model: { contains: q } } },
        { vehicle: { customer: { name: { contains: q } } } },
        { vehicle: { customer: { phone: { contains: q } } } },
        { serviceType: { contains: q } },
        { workPerformed: { contains: q } },
        { partsUsed: { contains: q } },
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      where.serviceDate = {};
      if (startDate) {
        where.serviceDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.serviceDate.lte = end;
      }
    }

    const history = await prisma.service.findMany({
      where,
      include: {
        vehicle: {
          include: {
            customer: true,
          },
        },
        serviceItems: true,
        payment: true,
      },
      orderBy: { serviceDate: 'desc' },
    });

    return res.json({ history });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to retrieve service history', error: error.message });
  }
}
