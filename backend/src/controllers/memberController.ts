// backend/src/controllers/memberController.ts (Using Prisma, Checks Admin Role)
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { UserRole } from '@prisma/client'; // Use Prisma enum

// --- GET all Members (Filters based on role from middleware)---
export const getAllMembers = async (req: Request, res: Response) => {
    // @ts-ignore
    const loggedInUser: { id: string; role: string } | undefined = req.user;
    const controllerStartTime = new Date();
    console.log(`[${controllerStartTime.toISOString()}] GET /api/members requested by User ID: ${loggedInUser?.id}, Role: ${loggedInUser?.role}`);

    if (!loggedInUser?.role) { return res.status(401).json({ message: 'Not authorized (user data missing)' }); }

    try {
        let whereClause = {}; // Default: Admin gets all
        console.log(`[getAllMembers] Checking Role - req.user.role value: '${loggedInUser.role}'`);

        // If Area Admin calls this, filter by their ID
        if (loggedInUser.role === 'areaAdmin') { // Comparing string from token with string
            console.log(`[getAllMembers] Condition matched 'areaAdmin'. Filtering...`);
            whereClause = { assignedAreaAdminId: loggedInUser.id };
        } else if (loggedInUser.role === 'admin') { // Comparing string from token with string
             console.log(`[getAllMembers] Condition matched 'admin'. Fetching all.`);
        } else {
             console.warn(`[getAllMembers] Forbidden: Unknown role ('${loggedInUser.role}')`);
             return res.status(403).json({ message: 'Forbidden: Unknown role.' });
        }

        const members = await prisma.member.findMany({
            where: whereClause,
            include: { assignedAreaAdmin: { select: { name: true } } }, // Always include name
            orderBy: { createdAt: 'desc' }
        });
        console.log(`[${controllerStartTime.toISOString()}] Found ${members.length} members in DB.`);
        res.status(200).json(members);
    } catch (error: any) {
        console.error(`[${controllerStartTime.toISOString()}] Prisma Error fetching members:`, error);
        res.status(500).json({ message: 'Error fetching members from database' });
    }
};

// --- CREATE a new Member (Admin Only via this route) ---
export const createMember = async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] POST /api/members requested (Prisma)`);
    const { name, phone, address, monthlyAmount, assignedAreaAdminId = null } = req.body;
    // Basic Validation (keep as before) ...
    if (!name || !phone || !address || monthlyAmount === undefined || monthlyAmount === null) { return res.status(400).json({ message: 'Missing required fields' }); }
    const amount = Number(monthlyAmount);
    if (isNaN(amount) || amount < 0) { return res.status(400).json({ message: 'Invalid monthly amount' }); }

    try {
        // Optional: Validate assignedAreaAdminId exists
        if (assignedAreaAdminId) {
            const areaAdminExists = await prisma.user.findUnique({ where: { id: assignedAreaAdminId, role: UserRole.AreaAdmin } });
            if (!areaAdminExists) { return res.status(400).json({ message: `Invalid assignedAreaAdminId` }); }
        }
        // Create using Prisma
        const newMember = await prisma.member.create({
            data: { name, phone, address, monthlyAmount: amount, assignedAreaAdminId: assignedAreaAdminId || null }
        });
        console.log(`[${new Date().toISOString()}] Member created in DB: ID=${newMember.id}`);
        res.status(201).json(newMember);
    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Prisma Error creating member:`, error);
        res.status(500).json({ message: 'Error creating member' });
    }
};

// --- UPDATE a Member (Admin Only via this route) ---
export const updateMember = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, phone, address, monthlyAmount, assignedAreaAdminId } = req.body;
    console.log(`[${new Date().toISOString()}] PUT /api/members/${id} requested (Prisma)`);
    try {
         const updateData: any = {}; // Build update object dynamically
         if (name !== undefined) updateData.name = name;
         if (phone !== undefined) updateData.phone = phone;
         if (address !== undefined) updateData.address = address;
         if (monthlyAmount !== undefined && monthlyAmount !== null) { /* ... amount validation ... */ updateData.monthlyAmount = Number(monthlyAmount); }
         if (assignedAreaAdminId !== undefined) { /* ... assignee validation ... */ updateData.assignedAreaAdminId = assignedAreaAdminId === '' ? null : assignedAreaAdminId; }

        if (Object.keys(updateData).length === 0) {
             return res.status(400).json({ message: 'No valid fields provided for update.' });
        }

        const updatedMember = await prisma.member.update({ where: { id: id }, data: updateData });
        console.log(`[${new Date().toISOString()}] Member updated in DB: ID=${id}`);
        res.status(200).json(updatedMember);
    } catch (error: any) {
         // @ts-ignore
         if (error.code === 'P2025') { return res.status(404).json({ message: 'Member not found' }); }
        console.error(`[${new Date().toISOString()}] Prisma Error updating member:`, error);
        res.status(500).json({ message: 'Error updating member' });
    }
};

// --- DELETE a Member (Admin Only via this route) ---
export const deleteMember = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`[${new Date().toISOString()}] DELETE /api/members/${id} requested (Prisma)`);
    try {
        await prisma.member.delete({ where: { id: id } });
        console.log(`[${new Date().toISOString()}] Member deleted from DB: ID=${id}`);
        res.status(204).send();
    } catch (error: any) {
        // @ts-ignore
        if (error.code === 'P2025') { return res.status(404).json({ message: 'Member not found' }); }
        console.error(`[${new Date().toISOString()}] Prisma Error deleting member:`, error);
        res.status(500).json({ message: 'Error deleting member' });
    }
};