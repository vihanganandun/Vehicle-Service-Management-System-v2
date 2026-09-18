import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { hashPassword } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth';
import { Role } from '@prisma/client';

export async function getUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ users });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to retrieve users', error: error.message });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const userRole = role === 'ADMIN' ? Role.ADMIN : Role.STAFF;

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: userRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();
    if (role) updateData.role = role === 'ADMIN' ? Role.ADMIN : Role.STAFF;
    if (password && password.trim() !== '') {
      updateData.password = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userIdToDelete = Number(id);

    if (req.user && req.user.userId === userIdToDelete) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await prisma.user.delete({ where: { id: userIdToDelete } });
    return res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
}
