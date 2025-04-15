// backend/src/controllers/memberController.ts (MODIFIED for Area Relation)
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { UserRole } from '@prisma/client';

// --- Controller to GET all Members ---
export const getAllMembers = async (req: Request, res: Response) => {
    // @ts-ignore
    const loggedInUser: { id: string; role: string } | undefined = req.user;
    const logPrefix = `[${new Date().toISOString()}] getAllMembers:`;
    console.log(`${logPrefix} Requested by User ID: ${loggedInUser?.id}, Role: ${loggedInUser?.role}`);

    if (!loggedInUser?.role) { return res.status(401).json({ message: 'Not authorized' }); }
    try {
        let whereClause = {};
        if (loggedInUser.role === 'areaAdmin') {
            whereClause = { assignedAreaAdminId: loggedInUser.id };
        } else if (loggedInUser.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Unknown role.' });
        }

        const members = await prisma.member.findMany({
            where: whereClause,
            include: { // Include BOTH related models' names
                assignedAreaAdmin: { select: { name: true } },
                area: { select: { name: true } } // <-- INCLUDE Area name
            },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`${logPrefix} Found ${members.length} members.`);
        res.status(200).json(members);
    } catch (error: any) { console.error(`${logPrefix} Prisma Error:`, error); res.status(500).json({ message: 'Error fetching members' }); }
};

// --- Controller to CREATE a new Member ---
export const createMember = async (req: Request, res: Response) => {
    const logPrefix = `[${new Date().toISOString()}] createMember:`;
    console.log(`${logPrefix} --- Received POST /api/members ---`);
    // ** CHANGED: Expect areaId instead of address **
    const { name, phone, monthlyAmount, areaId, assignedAreaAdminId = null } = req.body;
    console.log(`${logPrefix} Request Body:`, req.body);

    // Validation
    // ** CHANGED: Validate areaId instead of address **
    if (!name || !phone || !areaId || monthlyAmount === undefined || monthlyAmount === null) {
         console.log(`${logPrefix} FAIL Validation: Missing fields (name, phone, areaId, monthlyAmount).`);
         return res.status(400).json({ message: 'Missing required fields (name, phone, areaId, monthlyAmount)' });
    }
    const amount = Number(monthlyAmount);
    if (isNaN(amount) || amount < 0) { console.log(`${logPrefix} FAIL Validation: Invalid amount.`); return res.status(400).json({ message: 'Invalid monthly amount' }); }
    console.log(`${logPrefix} Input validation passed.`);

    try {
        // ** NEW: Validate Area ID exists **
        console.log(`${logPrefix} Validating areaId: ${areaId}...`);
        const areaExists = await prisma.area.findUnique({ where: { id: areaId } });
        if (!areaExists) {
            console.log(`${logPrefix} FAIL Validation: Area ID ${areaId} not found.`);
            return res.status(400).json({ message: `Invalid Area ID: Area not found.` });
        }
        console.log(`${logPrefix} areaId validation passed.`);

        // Validate assignedAreaAdminId if provided (keep as is)
        if (assignedAreaAdminId) { /* ... keep validation ... */ }

        // Create member in DB
        // ** CHANGED: Use areaId, remove address **
        const dataToCreate = { name, phone, monthlyAmount: amount, areaId: areaId, assignedAreaAdminId: assignedAreaAdminId || null };
        console.log(`${logPrefix} Attempting prisma.member.create...`);
        const newMember = await prisma.member.create({
             data: dataToCreate,
             // Optionally include related area name in response
             include: { area: { select: { name: true } } }
        });
        console.log(`${logPrefix} Prisma create successful. New Member ID: ${newMember.id}`);

        console.log(`${logPrefix} Sending SUCCESS response (201).`);
        res.status(201).json(newMember);

    } catch (error: any) {
        console.error(`${logPrefix} !!! Prisma/DB Error creating member:`, error);
        res.status(500).json({ message: 'Error creating member in database' });
    }
    console.log(`${logPrefix} --- Finished POST /api/members ---`);
};

// --- Controller to UPDATE a Member ---
export const updateMember = async (req: Request, res: Response) => {
    const { id } = req.params;
    // ** CHANGED: Expect areaId instead of address **
    const { name, phone, monthlyAmount, areaId, assignedAreaAdminId } = req.body;
    const logPrefix = `[${new Date().toISOString()}] updateMember (ID: ${id}):`;
    console.log(`${logPrefix} Request Body:`, req.body);

    if (!id) { return res.status(400).json({ message: "Member ID required." }); }

    try {
         // Prepare update data object
         const updateData: { name?: string; phone?: string; monthlyAmount?: number; areaId?: string; assignedAreaAdminId?: string | null; } = {};
         console.log(`${logPrefix} Preparing data for update...`);

         if (name !== undefined) updateData.name = name;
         if (phone !== undefined) updateData.phone = phone;
         // REMOVED address
         if (monthlyAmount !== undefined) { /* ... amount validation ... */ updateData.monthlyAmount = Number(monthlyAmount); }
         if (assignedAreaAdminId !== undefined) { /* ... assignee validation ... */ updateData.assignedAreaAdminId = assignedAreaAdminId === '' ? null : assignedAreaAdminId; }

        // ** NEW: Validate and add areaId if present **
         if (areaId !== undefined) {
             if (typeof areaId !== 'string' || areaId.trim() === '') {
                 return res.status(400).json({ message: 'Area ID must be a non-empty string.' });
             }
             console.log(`${logPrefix} Validating areaId: ${areaId}...`);
             const areaExists = await prisma.area.findUnique({ where: { id: areaId } });
             if (!areaExists) {
                 console.log(`${logPrefix} FAIL Validation: Area ID ${areaId} not found.`);
                 return res.status(400).json({ message: `Invalid Area ID: Area not found.` });
             }
             console.log(`${logPrefix} areaId validation passed.`);
             updateData.areaId = areaId;
             console.log(`${logPrefix} - Will update areaId to: ${areaId}`);
         }

        // Check if there's actually anything to update
        if (Object.keys(updateData).length === 0) { return res.status(400).json({ message: 'No valid fields provided for update.' }); }

        // Update the member
        console.log(`${logPrefix} Attempting prisma.member.update...`);
        const updatedMember = await prisma.member.update({
            where: { id: id },
            data: updateData,
            include: { area: { select: { name: true } } } // Include new area name in response
        });
        console.log(`${logPrefix} Prisma update successful.`);

        console.log(`${logPrefix} Sending SUCCESS response (200).`);
        res.status(200).json(updatedMember);

    } catch (error: any) {
         // @ts-ignore
         if (error.code === 'P2025') { return res.status(404).json({ message: 'Member not found' }); }
        console.error(`${logPrefix} !!! Prisma/DB Error updating member:`, error);
        res.status(500).json({ message: 'Error updating member' });
    }
     console.log(`${logPrefix} --- Finished PUT /api/members/${id} ---`);
};

// --- Controller to DELETE a Member ---
// (No changes needed here based on schema update)
export const deleteMember = async (req: Request, res: Response) => { /* ... Keep existing Prisma code ... */ };