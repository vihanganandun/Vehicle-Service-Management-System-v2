import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function getCustomers(req: Request, res: Response) {
  try {
    const { search } = req.query;

    const where: any = {};
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { vehicles: true, appointments: true },
        },
        vehicles: {
          select: { id: true, registrationNumber: true, brand: true, model: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ customers });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch customers', error: error.message });
  }
}

export async function getCustomerById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) },
      include: {
        vehicles: {
          include: {
            services: {
              orderBy: { serviceDate: 'desc' },
              take: 5,
            },
          },
        },
        appointments: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    return res.json({ customer });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch customer details', error: error.message });
  }
}

export async function createCustomer(req: Request, res: Response) {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Customer name and phone number are required' });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
      },
    });

    return res.status(201).json({ message: 'Customer created successfully', customer });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to create customer', error: error.message });
  }
}

export async function updateCustomer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const updated = await prisma.customer.update({
      where: { id: Number(id) },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        phone: phone !== undefined ? phone.trim() : existing.phone,
        email: email !== undefined ? (email ? email.trim() : null) : existing.email,
        address: address !== undefined ? (address ? address.trim() : null) : existing.address,
      },
    });

    return res.json({ message: 'Customer updated successfully', customer: updated });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to update customer', error: error.message });
  }
}

export async function deleteCustomer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const customerId = Number(id);

    const existing = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!existing) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await prisma.customer.delete({ where: { id: customerId } });
    return res.json({ message: 'Customer and related records deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete customer', error: error.message });
  }
}
