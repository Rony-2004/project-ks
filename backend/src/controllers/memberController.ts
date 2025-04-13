// backend/src/controllers/memberController.ts (Using Prisma)
import { Request, Response } from 'express';
import prisma from '../lib/prisma'; // <-- Import the Prisma Client instance
import { UserRole } from '@prisma/client'; // May not be needed here unless checking assignees

// --- Remove In-Memory Store ---
// let members: Member[] = []; // NO LONGER NEEDED
// let nextMemberId = 1; // NO LONGER NEEDED

// --- Controller to GET all Members ---
export const getAllMembers = async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] GET /api/members requested (Prisma)`);
    try {
        // Use Prisma Client to find all members
        const members = await prisma.member.findMany({
            // Optional: Include assigned Area Admin's name if needed
            // include: {
            //     assignedAreaAdmin: {
            //         select: { name: true } // Select only the name
            //     }
            // },
            orderBy: { // Optional: Order by name or creation date
                createdAt: 'desc'
            }
        });
        console.log(`[${new Date().toISOString()}] Found ${members.length} members in DB.`);
        res.status(200).json(members);
    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Prisma Error fetching members:`, error);
        res.status(500).json({ message: 'Error fetching members from database' });
    }
};

// --- Controller to CREATE a new Member ---
export const createMember = async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] POST /api/members requested (Prisma)`);
    const { name, phone, address, monthlyAmount, assignedAreaAdminId = null } = req.body;

    // Basic Validation
    if (!name || !phone || !address || monthlyAmount === undefined || monthlyAmount === null) {
        return res.status(400).json({ message: 'Missing required fields (name, phone, address, monthlyAmount)' });
    }
    const amount = Number(monthlyAmount);
    if (isNaN(amount) || amount < 0) {
        return res.status(400).json({ message: 'Invalid monthly amount provided' });
    }

    try {
        // Optional: Validate assignedAreaAdminId exists in the User table
        if (assignedAreaAdminId) {
            const areaAdminExists = await prisma.user.findUnique({
                where: { id: assignedAreaAdminId, role: UserRole.AreaAdmin }
            });
            if (!areaAdminExists) {
                return res.status(400).json({ message: `Invalid assignedAreaAdminId: No Area Admin found with ID ${assignedAreaAdminId}` });
            }
        }

        // Use Prisma Client to create the new member
        const newMember = await prisma.member.create({
            data: {
                name,
                phone,
                address,
                monthlyAmount: amount, // Use the validated number
                assignedAreaAdminId: assignedAreaAdminId || null // Ensure null if empty
                // Prisma handles id, createdAt, updatedAt
            }
        });

        console.log(`[${new Date().toISOString()}] Member created in DB:`, { id: newMember.id, name: newMember.name });
        res.status(201).json(newMember);

    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Prisma Error creating member:`, error);
        res.status(500).json({ message: 'Error creating member in database' });
    }
};

// --- Controller to UPDATE a Member ---
export const updateMember = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, phone, address, monthlyAmount, assignedAreaAdminId } = req.body;
    console.log(`[${new Date().toISOString()}] PUT /api/members/${id} requested with data (Prisma):`, req.body);

    try {
         // Prepare update data object, only including fields that are present in the request
         const updateData: {
            name?: string;
            phone?: string;
            address?: string;
            monthlyAmount?: number;
            assignedAreaAdminId?: string | null;
         } = {};

         if (name !== undefined) updateData.name = name;
         if (phone !== undefined) updateData.phone = phone;
         if (address !== undefined) updateData.address = address;
         // Validate and add monthlyAmount if present
         if (monthlyAmount !== undefined && monthlyAmount !== null) {
            const amount = Number(monthlyAmount);
            if (isNaN(amount) || amount < 0) {
                return res.status(400).json({ message: 'Invalid monthly amount provided for update' });
            }
            updateData.monthlyAmount = amount;
         }
         // Handle assignedAreaAdminId (allow setting to null)
         if (assignedAreaAdminId !== undefined) {
             const finalAssigneeId = assignedAreaAdminId === '' ? null : assignedAreaAdminId;
             // Optional: Validate the ID exists if it's not null
             if (finalAssigneeId) {
                 const areaAdminExists = await prisma.user.findUnique({
                     where: { id: finalAssigneeId, role: UserRole.AreaAdmin }
                 });
                 if (!areaAdminExists) {
                     return res.status(400).json({ message: `Invalid assignedAreaAdminId: No Area Admin found with ID ${finalAssigneeId}` });
                 }
             }
             updateData.assignedAreaAdminId = finalAssigneeId;
         }

        // Use Prisma Client to update the member
        const updatedMember = await prisma.member.update({
            where: { id: id },
            data: updateData
        });

        console.log(`[${new Date().toISOString()}] Member updated in DB: ID=${id}`);
        res.status(200).json(updatedMember);

    } catch (error: any) {
        // Handle specific Prisma error if record to update is not found
         // @ts-ignore
         if (error.code === 'P2025') {
             console.log(`[${new Date().toISOString()}] Member not found for update in DB: ID=${id}`);
             return res.status(404).json({ message: 'Member not found' });
        }
        console.error(`[${new Date().toISOString()}] Prisma Error updating member:`, error);
        res.status(500).json({ message: 'Error updating member in database' });
    }
};

// --- Controller to DELETE a Member ---
export const deleteMember = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`[${new Date().toISOString()}] DELETE /api/members/${id} requested (Prisma)`);

    try {
        // Use Prisma Client to delete the member
        await prisma.member.delete({
            where: { id: id }
        });
        console.log(`[${new Date().toISOString()}] Member deleted from DB: ID=${id}`);
        res.status(204).send(); // Success, No Content

    } catch (error: any) {
        // Handle specific Prisma error if record to delete is not found
        // @ts-ignore
        if (error.code === 'P2025') {
             console.log(`[${new Date().toISOString()}] Member not found for deletion in DB: ID=${id}`);
             return res.status(404).json({ message: 'Member not found' });
        }
        console.error(`[${new Date().toISOString()}] Prisma Error deleting member:`, error);
        res.status(500).json({ message: 'Error deleting member from database' });
    }
};