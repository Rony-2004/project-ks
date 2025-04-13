// backend/src/controllers/areaAdminController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

// Temporary In-Memory Store (Replace with Database Later!)
interface AreaAdmin {
    id: string;
    name: string;
    email: string;
    phone: string;
    areaName: string;
    passwordHash?: string;
    createdAt: Date;
}
let areaAdmins: AreaAdmin[] = []; // Temporary "database"
let nextId = 1;

// --- GET all Area Admins (Existing) ---
export const getAllAreaAdmins = async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] GET /api/area-admins requested`);
    try {
        const adminsToSend = areaAdmins.map(({ passwordHash, ...rest }) => rest);
        res.status(200).json(adminsToSend);
    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Error fetching area admins:`, error);
        res.status(500).json({ message: 'Error fetching area admins' });
    }
};

// --- CREATE a new Area Admin (Existing) ---
export const createAreaAdmin = async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] POST /api/area-admins requested`);
    const { name, email, phone, areaName, password } = req.body;
    if (!name || !email || !phone || !areaName || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    if (areaAdmins.some(admin => admin.email === email)) {
        return res.status(409).json({ message: 'Email already in use' });
    }
    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const newAdmin: AreaAdmin = {
            id: (nextId++).toString(), name, email, phone, areaName, passwordHash, createdAt: new Date()
        };
        areaAdmins.push(newAdmin);
        console.log(`[${new Date().toISOString()}] Area Admin created:`, { id: newAdmin.id, name: newAdmin.name });
        const { passwordHash: _, ...adminToSend } = newAdmin;
        res.status(201).json(adminToSend);
    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Error creating area admin:`, error);
        res.status(500).json({ message: 'Error creating area admin' });
    }
};

// --- **NEW** DELETE an Area Admin ---
export const deleteAreaAdmin = async (req: Request, res: Response) => {
    const { id } = req.params; // Get ID from URL parameter
    console.log(`[<span class="math-inline">\{new Date\(\)\.toISOString\(\)\}\] DELETE /api/area\-admins/</span>{id} requested`);

    const initialLength = areaAdmins.length;
    areaAdmins = areaAdmins.filter(admin => admin.id !== id); // Filter out the admin with the matching ID

    if (areaAdmins.length < initialLength) {
        // If the length decreased, deletion was successful
        console.log(`[<span class="math-inline">\{new Date\(\)\.toISOString\(\)\}\] Area Admin deleted successfully\: ID\=</span>{id}`);
        res.status(204).send(); // 204 No Content is standard for successful DELETE
    } else {
        // If the length is the same, the ID was not found
        console.log(`[<span class="math-inline">\{new Date\(\)\.toISOString\(\)\}\] Area Admin not found for deletion\: ID\=</span>{id}`);
        res.status(404).json({ message: 'Area Admin not found' });
    }
};

// --- **NEW** UPDATE an Area Admin ---
export const updateAreaAdmin = async (req: Request, res: Response) => {
    const { id } = req.params; // Get ID from URL parameter
    // Get updated data from request body - **excluding password** for simplicity
    const { name, email, phone, areaName } = req.body;
    console.log(`[<span class="math-inline">\{new Date\(\)\.toISOString\(\)\}\] PUT /api/area\-admins/</span>{id} requested with data:`, req.body);


    // Basic Validation (check if at least one field is provided)
    if (!name && !email && !phone && !areaName) {
        return res.status(400).json({ message: 'No update data provided (name, email, phone, areaName)' });
    }

    const adminIndex = areaAdmins.findIndex(admin => admin.id === id);

    if (adminIndex === -1) {
        console.log(`[<span class="math-inline">\{new Date\(\)\.toISOString\(\)\}\] Area Admin not found for update\: ID\=</span>{id}`);
        return res.status(404).json({ message: 'Area Admin not found' });
    }

    // Check for email conflict if email is being changed
    if (email && email !== areaAdmins[adminIndex].email) {
        if (areaAdmins.some(admin => admin.email === email && admin.id !== id)) {
             console.log(`[${new Date().toISOString()}] Email conflict during update: ${email}`);
            return res.status(409).json({ message: 'Email already in use by another admin' });
        }
    }

    try {
        // Update the found admin (only provided fields)
        const originalAdmin = areaAdmins[adminIndex];
        const updatedAdmin = {
            ...originalAdmin,
            name: name ?? originalAdmin.name, // Use new value or keep original
            email: email ?? originalAdmin.email,
            phone: phone ?? originalAdmin.phone,
            areaName: areaName ?? originalAdmin.areaName,
        };

        // **Password Change Handling - Optional - Add later if needed**
        // If a 'password' field is included in req.body and is not empty:
        // const { password } = req.body;
        // if (password) {
        //     console.log(`[${new Date().toISOString()}] Hashing new password for update...`);
        //     const saltRounds = 10;
        //     updatedAdmin.passwordHash = await bcrypt.hash(password, saltRounds);
        // }

        // Replace the old admin with the updated one in our "database"
        areaAdmins[adminIndex] = updatedAdmin;
        console.log(`[<span class="math-inline">\{new Date\(\)\.toISOString\(\)\}\] Area Admin updated successfully\: ID\=</span>{id}`);

        // Respond with the updated admin data (excluding hash)
        const { passwordHash: _, ...adminToSend } = updatedAdmin;
        res.status(200).json(adminToSend);

    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Error updating area admin:`, error);
        res.status(500).json({ message: 'Error updating area admin' });
    }
};