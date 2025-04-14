// backend/src/controllers/memberController.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { UserRole } from '@prisma/client';

// --- GET all Members ---
export const getAllMembers = async (req: Request, res: Response) => {
    // @ts-ignore
    const loggedInUser: { id: string; role: string } | undefined = req.user;
    const logPrefix = `[${new Date().toISOString()}] getAllMembers:`;
    console.log(`${logPrefix} Requested by User ID: ${loggedInUser?.id}, Role: ${loggedInUser?.role}`);

    if (!loggedInUser?.role) { return res.status(401).json({ message: 'Not authorized' }); }
    try {
        let whereClause = {};
        console.log(`${logPrefix} Checking Role - req.user.role value: '${loggedInUser.role}'`);
        if (loggedInUser.role === 'areaAdmin') {
            console.log(`${logPrefix} Condition matched 'areaAdmin'. Filtering for ID: ${loggedInUser.id}`);
            whereClause = { assignedAreaAdminId: loggedInUser.id };
        } else if (loggedInUser.role === 'admin') {
             console.log(`${logPrefix} Condition matched 'admin'. Fetching all.`);
        } else {
             console.warn(`${logPrefix} Forbidden: Unknown role ('${loggedInUser.role}')`);
             return res.status(403).json({ message: 'Forbidden: Unknown role.' });
        }
        const members = await prisma.member.findMany({ where: whereClause, include: { assignedAreaAdmin: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
        console.log(`${logPrefix} Found ${members.length} members.`);
        res.status(200).json(members);
    } catch (error: any) { console.error(`${logPrefix} Prisma Error:`, error); res.status(500).json({ message: 'Error fetching members' }); }
};

// --- CREATE a new Member (Detailed Logging) ---
export const createMember = async (req: Request, res: Response) => {
    const logPrefix = `[${new Date().toISOString()}] createMember:`;
    console.log(`${logPrefix} --- Received POST /api/members ---`);
    const { name, phone, address, monthlyAmount, assignedAreaAdminId = null } = req.body;
    console.log(`${logPrefix} Request Body:`, req.body);

    // Validation
    if (!name || !phone || !address || monthlyAmount === undefined || monthlyAmount === null) { console.log(`${logPrefix} FAIL Validation: Missing fields.`); return res.status(400).json({ message: 'Missing required fields' }); }
    const amount = Number(monthlyAmount);
    if (isNaN(amount) || amount < 0) { console.log(`${logPrefix} FAIL Validation: Invalid amount.`); return res.status(400).json({ message: 'Invalid monthly amount' }); }
    console.log(`${logPrefix} Input validation passed.`);

    try {
        // Validate assignedAreaAdminId if provided
        if (assignedAreaAdminId) {
            console.log(`${logPrefix} Validating assignedAreaAdminId: ${assignedAreaAdminId}...`);
            const areaAdminExists = await prisma.user.findUnique({ where: { id: assignedAreaAdminId, role: UserRole.AreaAdmin } });
            if (!areaAdminExists) { console.log(`${logPrefix} FAIL assignedAreaAdminId ${assignedAreaAdminId} not found.`); return res.status(400).json({ message: `Invalid assignedAreaAdminId: Not Found` }); }
            console.log(`${logPrefix} assignedAreaAdminId validation passed.`);
        } else { console.log(`${logPrefix} No assignedAreaAdminId provided.`); }

        // Create member in DB
        const dataToCreate = { name, phone, address, monthlyAmount: amount, assignedAreaAdminId: assignedAreaAdminId || null };
        console.log(`${logPrefix} Attempting prisma.member.create...`);
        const newMember = await prisma.member.create({ data: dataToCreate }); // <<< HANG POINT?
        console.log(`${logPrefix} Prisma create successful. New Member ID: ${newMember.id}`);

        console.log(`${logPrefix} Sending SUCCESS response (201).`);
        res.status(201).json(newMember); // <<< RESPONSE SENT?

    } catch (error: any) {
        console.error(`${logPrefix} !!! Prisma/DB Error creating member:`, error);
        res.status(500).json({ message: 'Error creating member in database' });
    }
    console.log(`${logPrefix} --- Finished POST /api/members ---`);
};

// --- UPDATE a Member ---
export const updateMember = async (req: Request, res: Response) => { /* ... Keep previous Prisma version ... */ };

// --- DELETE a Member (Detailed Logging) ---
export const deleteMember = async (req: Request, res: Response) => {
    const logPrefix = `[${new Date().toISOString()}] deleteMember:`;
    const { id } = req.params;
    console.log(`${logPrefix} --- Received DELETE /api/members/${id} ---`);
    if (!id) { return res.status(400).json({ message: 'Member ID required.' }); }
    try {
        console.log(`${logPrefix} Attempting prisma.member.delete for ID: ${id}...`);
        await prisma.member.delete({ where: { id: id } }); // <<< HANG POINT?
        console.log(`${logPrefix} Prisma delete successful for ID: ${id}`);
        console.log(`${logPrefix} Sending SUCCESS response (204).`);
        res.status(204).send(); // <<< RESPONSE SENT?
    } catch (error: any) {
         console.error(`${logPrefix} !!! Prisma/DB Error deleting member:`, error);
         // @ts-ignore
         if (error.code === 'P2025') { return res.status(404).json({ message: 'Member not found' }); }
        res.status(500).json({ message: 'Error deleting member' });
    }
    console.log(`${logPrefix} --- Finished DELETE /api/members/${id} ---`);
};