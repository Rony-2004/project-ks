// backend/src/controllers/areaAdminController.ts (Using Prisma)
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma'; // <-- Import the Prisma Client instance
import { UserRole } from '@prisma/client'; // <-- Import generated Enum type

// --- Remove In-Memory Store ---
// let areaAdmins: AreaAdmin[] = []; // NO LONGER NEEDED
// let nextId = 1; // NO LONGER NEEDED

// --- Controller to GET all Area Admins ---
export const getAllAreaAdmins = async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] GET /api/area-admins requested (Prisma)`);
    try {
        // Use Prisma Client to find users with the 'AreaAdmin' role
        const admins = await prisma.user.findMany({
            where: {
                role: UserRole.AreaAdmin // Use the enum for type safety
            },
            select: { // Select only the fields safe to send back
                id: true,
                name: true,
                email: true,
                phone: true,
                areaName: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' } // Optional ordering
        });
        console.log(`[${new Date().toISOString()}] Found ${admins.length} area admins in DB.`);
        res.status(200).json(admins);
    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Prisma Error fetching area admins:`, error);
        res.status(500).json({ message: 'Error fetching area admins from database' });
    }
};

// --- Controller to CREATE a new Area Admin ---
export const createAreaAdmin = async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] POST /api/area-admins requested (Prisma)`);
    const { name, email, phone, areaName, password } = req.body;

    // Validation
    if (!name || !email || !phone || !areaName || !password) {
        return res.status(400).json({ message: 'Missing required fields (name, email, phone, areaName, password)' });
    }
    // TODO: Add more robust validation (email format, password strength etc.)

    try {
        // Check if email already exists in the database
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            console.log(`[${new Date().toISOString()}] Email conflict: ${email} already exists.`);
            return res.status(409).json({ message: 'Email already in use' }); // 409 Conflict
        }

        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        console.log(`[${new Date().toISOString()}] Hashed password for new area admin.`);

        // Use Prisma Client to create the new user in the database
        const newAdmin = await prisma.user.create({
            data: {
                name,
                email,
                phone, // Ensure phone is included if required or handle optionality
                areaName,
                passwordHash, // Store the hash
                role: UserRole.AreaAdmin // Set the role explicitly
                // Prisma handles id, createdAt, updatedAt based on schema defaults
            }
        });

        console.log(`[${new Date().toISOString()}] Area Admin created in DB:`, { id: newAdmin.id, name: newAdmin.name, email: newAdmin.email });

        // Respond with the created admin data (excluding password hash)
        const { passwordHash: _, ...adminToSend } = newAdmin;
        res.status(201).json(adminToSend);

    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Prisma Error creating area admin:`, error);
        res.status(500).json({ message: 'Error creating area admin in database' });
    }
};

// --- Controller to DELETE an Area Admin ---
export const deleteAreaAdmin = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`[${new Date().toISOString()}] DELETE /api/area-admins/${id} requested (Prisma)`);

    try {
        // Use Prisma Client to delete the user (ensure it's an AreaAdmin for safety)
        await prisma.user.delete({
            where: {
                id: id,
                // Optional: Add role check if only AreaAdmins should be deleted via this endpoint
                // role: UserRole.AreaAdmin
            }
            // Note: Prisma will throw an error if the ID doesn't exist (P2025)
        });
        console.log(`[${new Date().toISOString()}] Area Admin deleted from DB: ID=${id}`);
        res.status(204).send(); // Success, No Content

    } catch (error: any) {
         // Handle specific Prisma error if record to delete is not found
        // @ts-ignore - Check if error has a code property
        if (error.code === 'P2025') {
             console.log(`[${new Date().toISOString()}] Area Admin not found for deletion in DB: ID=${id}`);
             return res.status(404).json({ message: 'Area Admin not found' });
        }
        console.error(`[${new Date().toISOString()}] Prisma Error deleting area admin:`, error);
        res.status(500).json({ message: 'Error deleting area admin from database' });
    }
};

// --- Controller to UPDATE an Area Admin ---
export const updateAreaAdmin = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, phone, areaName } = req.body; // Exclude password updates here
    console.log(`[${new Date().toISOString()}] PUT /api/area-admins/${id} requested with data (Prisma):`, req.body);

    if (!name && !email && !phone && !areaName) {
        return res.status(400).json({ message: 'No update data provided' });
    }

    try {
        // Optional: Check for email conflict before updating
        if (email) {
             const existingUser = await prisma.user.findFirst({
                where: { email: email, NOT: { id: id } } // Find other users with the same new email
             });
             if (existingUser) {
                 console.log(`[${new Date().toISOString()}] Email conflict during update (Prisma): ${email}`);
                return res.status(409).json({ message: 'Email already in use by another user' });
             }
        }

        // Prepare data object with only the fields that were provided
        const updateData: { name?: string; email?: string; phone?: string; areaName?: string } = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (areaName !== undefined) updateData.areaName = areaName;
        // Add updatedAt manually if needed, or let Prisma handle it via @updatedAt

        // Use Prisma Client to update the user (ensure it's an AreaAdmin if desired)
        const updatedAdmin = await prisma.user.update({
            where: {
                id: id,
                // Optional: Add role check
                // role: UserRole.AreaAdmin
            },
            data: updateData
        });

        console.log(`[${new Date().toISOString()}] Area Admin updated in DB: ID=${id}`);

        // Respond with updated data (excluding hash)
        const { passwordHash: _, ...adminToSend } = updatedAdmin;
        res.status(200).json(adminToSend);

    } catch (error: any) {
         // Handle specific Prisma error if record to update is not found
         // @ts-ignore
         if (error.code === 'P2025') {
             console.log(`[${new Date().toISOString()}] Area Admin not found for update in DB: ID=${id}`);
             return res.status(404).json({ message: 'Area Admin not found' });
        }
        console.error(`[${new Date().toISOString()}] Prisma Error updating area admin:`, error);
        res.status(500).json({ message: 'Error updating area admin in database' });
    }
};

// --- Controller to GET a single Area Admin by ID ---
export const getAreaAdminById = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`[${new Date().toISOString()}] GET /api/area-admins/${id} requested (Prisma)`);
    try {
        const admin = await prisma.user.findUnique({
            where: {
                id: id,
                role: UserRole.AreaAdmin // Ensure we only fetch AreaAdmins by this endpoint
            },
            select: { // Select only needed fields, exclude hash
                 id: true, name: true, email: true, phone: true, areaName: true, createdAt: true, updatedAt: true
            }
        });

        if (admin) {
            console.log(`[${new Date().toISOString()}] Found Area Admin by ID (Prisma):`, { id: admin.id, name: admin.name });
            res.status(200).json(admin);
        } else {
            console.log(`[${new Date().toISOString()}] Area Admin not found by ID (Prisma): ${id}`);
            res.status(404).json({ message: 'Area Admin not found' });
        }
    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Prisma Error fetching area admin by ID:`, error);
        res.status(500).json({ message: 'Error fetching area admin details' });
    }
};