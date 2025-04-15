// backend/src/controllers/areaController.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma'; // Import Prisma Client

// --- GET All Areas ---
export const getAllAreas = async (req: Request, res: Response) => {
    const logPrefix = `[${new Date().toISOString()}] getAllAreas:`;
    console.log(`${logPrefix} Request received.`);
    try {
        const areas = await prisma.area.findMany({
            orderBy: { name: 'asc' } // Order alphabetically
        });
        console.log(`${logPrefix} Found ${areas.length} areas.`);
        res.status(200).json(areas);
    } catch (error) {
        console.error(`${logPrefix} Error fetching areas:`, error);
        res.status(500).json({ message: 'Failed to fetch areas' });
    }
};

// --- CREATE New Area ---
export const createArea = async (req: Request, res: Response) => {
    const logPrefix = `[${new Date().toISOString()}] createArea:`;
    const { name } = req.body; // Expecting { "name": "Area Name" }
    console.log(`${logPrefix} Request received. Body:`, req.body);

    if (!name || typeof name !== 'string' || name.trim() === '') {
        console.log(`${logPrefix} FAIL Validation: Name is required.`);
        return res.status(400).json({ message: 'Area name is required.' });
    }
    const trimmedName = name.trim();

    try {
        // Check if area name already exists (case-insensitive)
        console.log(`${logPrefix} Checking for existing area name: ${trimmedName}`);
        const existingArea = await prisma.area.findFirst({
             where: { name: { equals: trimmedName, mode: 'insensitive' } }
        });
        if (existingArea) {
            console.log(`<span class="math-inline">\{logPrefix\} FAIL Conflict\: Area name '</span>{trimmedName}' already exists.`);
            return res.status(409).json({ message: `Area name '${trimmedName}' already exists.` });
        }

        // Create new area
        console.log(`${logPrefix} Attempting prisma.area.create...`);
        const newArea = await prisma.area.create({
            data: { name: trimmedName }
        });
        console.log(`${logPrefix} Prisma create successful. ID: ${newArea.id}`);
        res.status(201).json(newArea);

    } catch (error: any) {
        console.error(`${logPrefix} !!! Prisma/DB Error creating area:`, error);
         // @ts-ignore
         if (error.code === 'P2002') { // Unique constraint failed
            return res.status(409).json({ message: `Area name '${trimmedName}' already exists.` });
         }
        res.status(500).json({ message: 'Failed to create area' });
    }
     console.log(`${logPrefix} --- Finished POST /api/areas ---`);
};

// --- UPDATE Area ---
export const updateArea = async (req: Request, res: Response) => {
    const { id } = req.params; // Area ID from URL
    const { name } = req.body; // New name from body
    const logPrefix = `[${new Date().toISOString()}] updateArea (ID: ${id}):`;
    console.log(`${logPrefix} Request received. Body:`, req.body);

    if (!id) { return res.status(400).json({ message: 'Area ID required in URL.' }); }
    if (!name || typeof name !== 'string' || name.trim() === '') { return res.status(400).json({ message: 'New area name is required.' }); }
    const trimmedName = name.trim();

    try {
         // Check if new name conflicts with another existing area
         console.log(`${logPrefix} Checking for name conflict: ${trimmedName}`);
         const existingArea = await prisma.area.findFirst({
            where: { name: { equals: trimmedName, mode: 'insensitive' }, NOT: { id: id } } // Exclude self
         });
         if (existingArea) { return res.status(409).json({ message: `Area name '${trimmedName}' already exists.` }); }

        // Update the area
        console.log(`${logPrefix} Attempting prisma.area.update...`);
        const updatedArea = await prisma.area.update({
            where: { id: id },
            data: { name: trimmedName }
        });
         console.log(`${logPrefix} Prisma update successful.`);
        res.status(200).json(updatedArea);

    } catch (error: any) {
        console.error(`${logPrefix} !!! Prisma/DB Error updating area:`, error);
         // @ts-ignore
         if (error.code === 'P2025') { return res.status(404).json({ message: 'Area not found' }); } // Record not found
         // @ts-ignore
          if (error.code === 'P2002') { return res.status(409).json({ message: `Area name '${trimmedName}' already exists.` }); } // Unique constraint
        res.status(500).json({ message: 'Failed to update area' });
    }
     console.log(`<span class="math-inline">\{logPrefix\} \-\-\- Finished PUT /api/areas/</span>{id} ---`);
};

// --- DELETE Area ---
export const deleteArea = async (req: Request, res: Response) => {
    const { id } = req.params; // Area ID from URL
    const logPrefix = `[${new Date().toISOString()}] deleteArea (ID: ${id}):`;
    console.log(`${logPrefix} Request received.`);

    if (!id) { return res.status(400).json({ message: 'Area ID is required.' }); }

    try {
        // Check dependencies: Members assigned to this Area or Users assigned to this Area
        console.log(`${logPrefix} Checking dependencies...`);
        const relatedMembersCount = await prisma.member.count({ where: { areaId: id } });
        const relatedUsersCount = await prisma.user.count({ where: { assignedAreas: { some: { id: id } } } });

        if (relatedMembersCount > 0 || relatedUsersCount > 0) {
             console.log(`${logPrefix} FAIL Conflict: Area in use (Members: ${relatedMembersCount}, Users: ${relatedUsersCount}).`);
            return res.status(400).json({ message: `Cannot delete area: It is assigned to ${relatedMembersCount} member(s) and ${relatedUsersCount} area admin(s).` });
        }
         console.log(`${logPrefix} No dependencies found. Proceeding with delete...`);

        // Delete the area
        await prisma.area.delete({ where: { id: id } });
         console.log(`${logPrefix} Prisma delete successful.`);
        res.status(204).send(); // Success, No Content

    } catch (error: any) {
        console.error(`${logPrefix} !!! Prisma/DB Error deleting area:`, error);
         // @ts-ignore
         if (error.code === 'P2025') { return res.status(404).json({ message: 'Area not found' }); } // Record not found
        res.status(500).json({ message: 'Failed to delete area' });
    }
     console.log(`<span class="math-inline">\{logPrefix\} \-\-\- Finished DELETE /api/areas/</span>{id} ---`);
};