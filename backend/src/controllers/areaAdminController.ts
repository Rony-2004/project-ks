// backend/src/controllers/areaAdminController.ts (MODIFIED for Area Relations)
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { UserRole } from '@prisma/client';

// --- Controller to GET all Area Admins ---
export const getAllAreaAdmins = async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] GET /api/area-admins requested (Prisma)`);
    try {
        const admins = await prisma.user.findMany({
            where: { role: UserRole.AreaAdmin },
            select: { // Select fields including the new relation
                id: true, name: true, email: true, phone: true,
                createdAt: true, updatedAt: true,
                // Include the names and IDs of the areas assigned to this user
                assignedAreas: { // <-- INCLUDE assigned areas relation
                    select: { id: true, name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`[${new Date().toISOString()}] Found ${admins.length} area admins.`);
        res.status(200).json(admins);
    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Prisma Error fetching area admins:`, error);
        res.status(500).json({ message: 'Error fetching area admins' });
    }
};

// --- Controller to CREATE a new Area Admin ---
export const createAreaAdmin = async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] POST /api/area-admins requested (Prisma)`);
    // ** Expect assignedAreaIds (array of strings) instead of areaName **
    const { name, email, phone, password, assignedAreaIds = [] } = req.body;

    // Validation
    if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: 'Missing required fields (name, email, phone, password)' });
    }
    if (!Array.isArray(assignedAreaIds) || assignedAreaIds.some(id => typeof id !== 'string')) {
         return res.status(400).json({ message: 'assignedAreaIds must be an array of strings.' });
    }

    try {
        // Check email exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) { return res.status(409).json({ message: 'Email already in use' }); }

        // Validate Area IDs exist
        if (assignedAreaIds.length > 0) {
             console.log(`Validating area IDs: ${assignedAreaIds.join(', ')}`);
             const existingAreasCount = await prisma.area.count({ where: { id: { in: assignedAreaIds } } });
             if (existingAreasCount !== assignedAreaIds.length) {
                 return res.status(400).json({ message: 'One or more assigned Area IDs are invalid.' });
             }
             console.log("Area ID validation passed.");
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        console.log(`Hashed password.`);

        // Create user and connect related areas
        const newAdmin = await prisma.user.create({
            data: {
                name, email, phone, passwordHash, role: UserRole.AreaAdmin,
                // ** Connect assigned areas using IDs **
                assignedAreas: {
                    connect: assignedAreaIds.map((id: string) => ({ id: id }))
                }
                // No areaName field anymore
            },
            include: { assignedAreas: { select: { id: true, name: true }} } // Include in response
        });

        console.log(`Area Admin created: ID=${newAdmin.id}`);
        const { passwordHash: _, ...adminToSend } = newAdmin; // Exclude hash
        res.status(201).json(adminToSend);

    } catch (error: any) {
        console.error(`Prisma Error creating area admin:`, error);
        res.status(500).json({ message: 'Error creating area admin' });
    }
};

// --- Controller to DELETE an Area Admin ---
// (No change needed here unless you want to disconnect areas first)
export const deleteAreaAdmin = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`[${new Date().toISOString()}] DELETE /api/area-admins/${id} requested (Prisma)`);
    try {
        // Optional: Check dependencies like assigned members before deleting user
        // const assignedMemberCount = await prisma.member.count({ where: { assignedAreaAdminId: id }});
        // if (assignedMemberCount > 0) {
        //     return res.status(400).json({ message: `Cannot delete: Area Admin is assigned to ${assignedMemberCount} member(s). Reassign them first.` });
        // }

        // Delete the user record (relations might be handled by DB constraints or Prisma)
        await prisma.user.delete({ where: { id: id } });
        console.log(`Area Admin deleted: ID=${id}`);
        res.status(204).send();
    } catch (error: any) {
         // @ts-ignore
         if (error.code === 'P2025') { return res.status(404).json({ message: 'Area Admin not found' }); }
        console.error(`Prisma Error deleting area admin:`, error);
        res.status(500).json({ message: 'Error deleting area admin' });
    }
};

// --- Controller to UPDATE an Area Admin ---
export const updateAreaAdmin = async (req: Request, res: Response) => {
    const { id } = req.params;
    // ** Expect assignedAreaIds, remove areaName **
    const { name, email, phone, assignedAreaIds } = req.body;
    console.log(`[${new Date().toISOString()}] PUT /api/area-admins/${id} requested (Prisma):`, req.body);

    // Basic check for data presence
    if (name === undefined && email === undefined && phone === undefined && assignedAreaIds === undefined) {
        return res.status(400).json({ message: 'No update data provided' });
    }
    // Validate assignedAreaIds array if provided
    if (assignedAreaIds !== undefined && (!Array.isArray(assignedAreaIds) || assignedAreaIds.some(id => typeof id !== 'string'))) {
        return res.status(400).json({ message: 'assignedAreaIds must be an array of strings.' });
    }

    try {
        // Check email conflict
        if (email) { /* ... keep email conflict check ... */ }

        // Validate new Area IDs if provided
         if (assignedAreaIds && assignedAreaIds.length > 0) {
             const existingAreasCount = await prisma.area.count({ where: { id: { in: assignedAreaIds } } });
             if (existingAreasCount !== assignedAreaIds.length) {
                 return res.status(400).json({ message: 'One or more assigned Area IDs are invalid.' });
             }
        }

        // Prepare update data
        const updateData: { name?: string; email?: string; phone?: string; assignedAreas?: { set: { id: string }[] } } = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        // ** Use 'set' to replace all assigned areas with the new list **
        if (assignedAreaIds !== undefined) {
            updateData.assignedAreas = {
                set: assignedAreaIds.map((id: string) => ({ id: id }))
            };
        }

        // Update user
        const updatedAdmin = await prisma.user.update({
            where: { id: id, role: UserRole.AreaAdmin }, // Only update AreaAdmins
            data: updateData,
            include: { assignedAreas: { select: { id: true, name: true }} } // Include updated areas
        });

        console.log(`Area Admin updated: ID=${id}`);
        const { passwordHash: _, ...adminToSend } = updatedAdmin;
        res.status(200).json(adminToSend);

    } catch (error: any) {
         // @ts-ignore
         if (error.code === 'P2025') { return res.status(404).json({ message: 'Area Admin not found' }); }
         // @ts-ignore
         if (error.code === 'P2002') { return res.status(409).json({ message: 'Update failed (e.g., email already exists).' }); }
        console.error(`Prisma Error updating area admin:`, error);
        res.status(500).json({ message: 'Error updating area admin' });
    }
};

// --- Controller to GET a single Area Admin by ID ---
export const getAreaAdminById = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`[${new Date().toISOString()}] GET /api/area-admins/${id} requested (Prisma)`);
    try {
        const admin = await prisma.user.findUnique({
            where: { id: id, role: UserRole.AreaAdmin },
            select: { // Select fields including the relation
                id: true, name: true, email: true, phone: true, createdAt: true, updatedAt: true,
                assignedAreas: { select: { id: true, name: true } } // <-- INCLUDE assigned areas
            }
        });
        if (admin) { res.status(200).json(admin); }
        else { res.status(404).json({ message: 'Area Admin not found' }); }
    } catch (error: any) { res.status(500).json({ message: 'Error fetching area admin details' }); }
};