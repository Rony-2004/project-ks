// backend/src/controllers/areaAdminController.ts (Adding ONLY password logic to YOUR code)
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { UserRole } from '@prisma/client';

// --- Controller to GET all Area Admins ---
export const getAllAreaAdmins = async (req: Request, res: Response) => {
    // ... (This function is UNCHANGED from your paste) ...
    console.log(`[${new Date().toISOString()}] GET /api/area-admins requested (Prisma)`);
    try {
        const admins = await prisma.user.findMany({
            where: { role: UserRole.AreaAdmin },
            select: { id: true, name: true, email: true, phone: true, createdAt: true, updatedAt: true,
                assignedAreas: { select: { id: true, name: true } }
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
    // ... (This function is UNCHANGED from your paste) ...
    console.log(`[${new Date().toISOString()}] POST /api/area-admins requested (Prisma)`);
    const { name, email, phone, password, assignedAreaIds = [] } = req.body;
    if (!name || !email || !phone || !password) { return res.status(400).json({ message: 'Missing required fields (name, email, phone, password)' }); }
    if (!Array.isArray(assignedAreaIds) || assignedAreaIds.some(id => typeof id !== 'string')) { return res.status(400).json({ message: 'assignedAreaIds must be an array of strings.' }); }
    // Optional: Consider adding password length check here too for consistency
    // Optional: Consider adding mandatory area check here if needed
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) { return res.status(409).json({ message: 'Email already in use' }); }
        if (assignedAreaIds.length > 0) {
            console.log(`Validating area IDs: ${assignedAreaIds.join(', ')}`);
            const existingAreasCount = await prisma.area.count({ where: { id: { in: assignedAreaIds } } });
            if (existingAreasCount !== assignedAreaIds.length) { return res.status(400).json({ message: 'One or more assigned Area IDs are invalid.' }); }
            console.log("Area ID validation passed.");
        }
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        console.log(`Hashed password.`);
        const newAdmin = await prisma.user.create({
            data: { name, email, phone, passwordHash, role: UserRole.AreaAdmin, assignedAreas: { connect: assignedAreaIds.map((id: string) => ({ id: id })) } },
            include: { assignedAreas: { select: { id: true, name: true }} }
        });
        console.log(`Area Admin created: ID=${newAdmin.id}`);
        const { passwordHash: _, ...adminToSend } = newAdmin;
        res.status(201).json(adminToSend);
    } catch (error: any) {
        console.error(`Prisma Error creating area admin:`, error);
        res.status(500).json({ message: 'Error creating area admin' });
    }
};

// --- Controller to DELETE an Area Admin ---
// In backend/src/controllers/areaAdminController.ts

export const deleteAreaAdmin = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`[${new Date().toISOString()}] DELETE /api/area-admins/${id} requested (Prisma)`);
    try {
        // Attempt to delete the user
        await prisma.user.delete({
            where: { id: id, role: UserRole.AreaAdmin } // Ensure only deleting AreaAdmins via this route
        });
        console.log(`[${new Date().toISOString()}] Area Admin deleted: ID=${id}`);
        res.status(204).send(); // Success, No Content

    } catch (error: any) {
        // Handle 'Record Not Found' error
        if (error.code === 'P2025') {
            console.log(`[${new Date().toISOString()}] Area Admin ${id} not found for deletion.`);
            return res.status(404).json({ message: 'Area Admin not found' });
        }
        // ** ADDED/CONFIRM: Handle Foreign Key Constraint Error **
        if (error.code === 'P2003') {
             console.error(`[${new Date().toISOString()}] Prisma Error deleting area admin ${id} due to foreign key constraint:`, error.meta?.field_name); // Log which constraint failed if available
             // Return a specific 400 Bad Request error
             return res.status(400).json({ message: 'Cannot delete: Area Admin is still linked to other records (e.g., members, payments). Please reassign or delete related records first.' });
        }
        // Handle other generic errors
        console.error(`[${new Date().toISOString()}] Prisma Error deleting area admin ${id}:`, error);
        res.status(500).json({ message: 'Error deleting area admin' }); // Generic 500 for other unexpected errors
    }
};
// --- Controller to UPDATE an Area Admin ---
export const updateAreaAdmin = async (req: Request, res: Response) => {
    const { id } = req.params;
    // ** Step 1: ADD 'password' to destructuring **
    const { name, email, phone, assignedAreaIds, password } = req.body;
    // ** Step 2: Modify log (optional) **
    console.log(`[${new Date().toISOString()}] PUT /api/area-admins/${id} requested (Prisma):`, { name, email, phone, assignedAreaIds: Array.isArray(assignedAreaIds) ? `(${assignedAreaIds.length} areas)` : 'Not Provided', password: password ? 'Provided' : 'Not Provided' });

    // ** Step 3: Add 'password' to the initial check **
    if (name === undefined && email === undefined && phone === undefined && assignedAreaIds === undefined && password === undefined) {
        return res.status(400).json({ message: 'No update data provided' });
    }
    // Keep existing assignedAreaIds validation
    if (assignedAreaIds !== undefined && (!Array.isArray(assignedAreaIds) || assignedAreaIds.some(id => typeof id !== 'string'))) {
        return res.status(400).json({ message: 'assignedAreaIds must be an array of strings.' });
    }
    // ** Step 4: ADD password validation block **
    if (password !== undefined && (typeof password !== 'string' || password.length < 6)) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        // Keep existing email conflict check
        if (email) {
             const existingUser = await prisma.user.findFirst({ where: { email: email, NOT: { id: id } } });
             if (existingUser) { return res.status(409).json({ message: 'Email already in use by another user' }); }
         }

        // Keep existing Area ID validation
        if (assignedAreaIds && assignedAreaIds.length > 0) {
            const existingAreasCount = await prisma.area.count({ where: { id: { in: assignedAreaIds } } });
            if (existingAreasCount !== assignedAreaIds.length) {
                return res.status(400).json({ message: 'One or more assigned Area IDs are invalid.' });
            }
        }

        // ** Step 5: ADD passwordHash to updateData type definition **
        const updateData: {
            name?: string;
            email?: string;
            phone?: string | null; // <-- Step 6: Ensure phone allows null
            assignedAreas?: { set: { id: string }[] };
            passwordHash?: string; // <-- Add this
        } = {};

        // Populate updateData (keep existing logic, modify phone slightly)
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        // ** Step 6: Refine phone handling (optional) **
        if (phone !== undefined) updateData.phone = phone === '' ? null : phone; // Handle empty string -> null
        if (assignedAreaIds !== undefined) {
            updateData.assignedAreas = {
                set: assignedAreaIds.map((id: string) => ({ id: id }))
            };
        }

        // ** Step 7: ADD password hashing block **
        if (password) {
            console.log(`[${new Date().toISOString()}] Hashing new password for user ${id}`);
            const saltRounds = 10;
            updateData.passwordHash = await bcrypt.hash(password, saltRounds);
            console.log(`[${new Date().toISOString()}] Password hashed.`);
        }

        // ** Step 8: ADD check if updateData has any keys **
        if (Object.keys(updateData).length === 0) {
             return res.status(400).json({ message: 'No valid update fields provided after processing.' });
        }

        // Keep existing prisma update call
        const updatedAdmin = await prisma.user.update({
            where: { id: id, role: UserRole.AreaAdmin },
            data: updateData, // Uses the potentially modified updateData
            include: { assignedAreas: { select: { id: true, name: true }} }
        });

        console.log(`Area Admin updated: ID=${id}`);
        // Keep existing response handling (Step 9)
        const { passwordHash: _, ...adminToSend } = updatedAdmin;
        res.status(200).json(adminToSend);

    } catch (error: any) {
        // ** Step 10: Modify error handling (optional) **
        if (error.code === 'P2025') { return res.status(404).json({ message: 'Area Admin not found' }); }
        if (error.code === 'P2002') { return res.status(409).json({ message: 'Update failed due to conflict (e.g., email already exists).' }); }
        console.error(`[${new Date().toISOString()}] Prisma Error updating area admin ${id}:`, error); // Add ID here
        res.status(500).json({ message: 'Error updating area admin' });
    }
};

// --- Controller to GET a single Area Admin by ID ---
export const getAreaAdminById = async (req: Request, res: Response) => {
    // ... (This function is UNCHANGED from your paste) ...
    const { id } = req.params;
    console.log(`[${new Date().toISOString()}] GET /api/area-admins/${id} requested (Prisma)`);
    try {
        const admin = await prisma.user.findUnique({
            where: { id: id, role: UserRole.AreaAdmin },
            select: { id: true, name: true, email: true, phone: true, createdAt: true, updatedAt: true,
                assignedAreas: { select: { id: true, name: true } }
            }
        });
        if (admin) { res.status(200).json(admin); }
        else { res.status(404).json({ message: 'Area Admin not found' }); }
    } catch (error: any) { res.status(500).json({ message: 'Error fetching area admin details' }); }
};