// backend/src/controllers/memberController.ts
// ** CORRECTED getAllMembers role check based on logs ('Admin' vs 'areaAdmin') **

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { UserRole } from '@prisma/client'; // Keep Enum import for reference

// --- Controller to GET all Members ---
export const getAllMembers = async (req: Request, res: Response) => {
    // @ts-ignore
    // Expect role as string 'Admin' or 'areaAdmin' based on logs
    const loggedInUser: { id: string; role: string } | undefined = req.user;
    const logPrefix = `[${new Date().toISOString()}] getAllMembers:`;
    console.log(`${logPrefix} Requested by User ID: ${loggedInUser?.id}, Role: ${loggedInUser?.role}`);

    if (!loggedInUser?.role) {
        console.error(`${logPrefix} Auth middleware error: User role not found.`);
        return res.status(401).json({ message: 'Not authorized (user role missing)' });
    }

    try {
        let whereClause = {};
        const roleFromToken = loggedInUser.role;

        // Log details
        console.log(`${logPrefix} Value of roleFromToken: "${roleFromToken}"`);

        // ** CORRECTED Logic: Compare against actual STRING roles seen in logs **
        if (roleFromToken === 'areaAdmin') { // <<< Compare against lowercase 'areaAdmin'
             console.log(`${logPrefix} User is AreaAdmin. Filtering members...`);
            whereClause = { assignedAreaAdminId: loggedInUser.id };
        }
        else if (roleFromToken === 'Admin') { // <<< Compare against uppercase 'Admin'
             console.log(`${logPrefix} User is Admin. Fetching all members...`);
             // whereClause remains {}
        } else {
            // Role is unexpected
            console.warn(`${logPrefix} Forbidden check failed: Role "${roleFromToken}" did not match 'Admin' or 'areaAdmin'.`);
             return res.status(403).json({ message: 'Forbidden: Role not permitted.' });
        }

        // Fetch members (rest of function is the same)
        const members = await prisma.member.findMany({
            where: whereClause,
            include: { assignedAreaAdmin: { select: { name: true } }, area: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`${logPrefix} Found ${members.length} members.`);
        // Add payment status check (assuming backend calculates isCurrentMonthPaid)
        const now = new Date(); const currentMonth = now.getMonth() + 1; const currentYear = now.getFullYear();
        const memberIds = members.map(member => member.id); let paidMemberIds = new Set<string>();
        if (memberIds.length > 0) { try { const currentMonthPayments = await prisma.payment.findMany({ where: { memberId: { in: memberIds }, paymentMonth: currentMonth, paymentYear: currentYear }, select: { memberId: true } }); paidMemberIds = new Set(currentMonthPayments.map(p => p.memberId)); } catch (e) { console.error("Payment check error", e); } }
        const membersWithStatus = members.map((member: any) => ({ ...member, isCurrentMonthPaid: paidMemberIds.has(member.id) }));
        console.log(`${logPrefix} Sending ${membersWithStatus.length} members.`);
        res.status(200).json(membersWithStatus);

    } catch (error: any) {
        console.error(`${logPrefix} Prisma Error:`, error);
        res.status(500).json({ message: 'Error fetching members' });
    }
};

// --- Other controllers (createMember, updateMember, deleteMember) ---
// Keep the rest of the functions exactly as you provided them in the previous step
// Make sure the validation using UserRole.AreaAdmin remains in create/update

export const createMember = async (req: Request, res: Response) => { /* ... code from previous step ... */
    const logPrefix = `[${new Date().toISOString()}] createMember:`;
    console.log(`${logPrefix} --- Received POST /api/members ---`);
    const { name, phone, monthlyAmount, areaId, assignedAreaAdminId = null } = req.body;
    console.log(`${logPrefix} Request Body:`, req.body);
    if (!name || !phone || !areaId || monthlyAmount === undefined || monthlyAmount === null) { return res.status(400).json({ message: 'Missing required fields' }); }
    const amount = Number(monthlyAmount);
    if (isNaN(amount) || amount < 0) { return res.status(400).json({ message: 'Invalid monthly amount' }); }
    try {
        const areaExists = await prisma.area.findUnique({ where: { id: areaId } });
        if (!areaExists) { return res.status(400).json({ message: `Invalid Area ID` }); }
        let finalAssignedAdminId: string | null = null;
        if (assignedAreaAdminId && typeof assignedAreaAdminId === 'string' && assignedAreaAdminId.trim() !== '') {
            const trimmedAdminId = assignedAreaAdminId.trim();
            const areaAdminExists = await prisma.user.findFirst({ where: { id: trimmedAdminId, role: UserRole.AreaAdmin } }); // Use Enum for DB check
            if (!areaAdminExists) { return res.status(400).json({ message: `Invalid Assigned Area Admin ID.` }); }
             finalAssignedAdminId = trimmedAdminId;
        } else { finalAssignedAdminId = null; }
        const dataToCreate = { name: name, phone: phone, monthlyAmount: amount, areaId: areaId, assignedAreaAdminId: finalAssignedAdminId };
        console.log(`${logPrefix} Attempting prisma.member.create...`);
        const newMember = await prisma.member.create({ data: dataToCreate, include: { area: { select: { name: true } } } });
        console.log(`${logPrefix} Member created successfully.`);
        res.status(201).json(newMember);
    } catch (error: any) { console.error(`${logPrefix} Error creating member:`, error); res.status(500).json({ message: 'Error creating member' }); }
};
export const updateMember = async (req: Request, res: Response) => { /* ... code from previous step ... */
    const { id } = req.params;
    const { name, phone, monthlyAmount, areaId, assignedAreaAdminId } = req.body;
    const logPrefix = `[${new Date().toISOString()}] updateMember (ID: ${id}):`;
    if (!id) { return res.status(400).json({ message: "Member ID required." }); }
    try {
       const updateData: { name?: string; phone?: string; monthlyAmount?: number; areaId?: string; assignedAreaAdminId?: string | null; } = {};
       if (name !== undefined) updateData.name = name;
       if (phone !== undefined) updateData.phone = phone;
       if (monthlyAmount !== undefined) { const amount = Number(monthlyAmount); if (isNaN(amount) || amount < 0) { return res.status(400).json({ message: 'Invalid amount' }); } updateData.monthlyAmount = amount; }
       if (assignedAreaAdminId !== undefined) {
             const trimmedAdminId = typeof assignedAreaAdminId === 'string' ? assignedAreaAdminId.trim() : null;
            if (trimmedAdminId && trimmedAdminId !== '') {
                const areaAdminExists = await prisma.user.findFirst({ where: { id: trimmedAdminId, role: UserRole.AreaAdmin } }); // Use Enum
                if (!areaAdminExists) { return res.status(400).json({ message: `Invalid Assigned Area Admin ID.` }); }
                updateData.assignedAreaAdminId = trimmedAdminId;
            } else { updateData.assignedAreaAdminId = null; }
       }
       if (areaId !== undefined) { if (typeof areaId !== 'string' || areaId.trim() === '') { return res.status(400).json({ message: 'Area ID missing.' }); } const areaExists = await prisma.area.findUnique({ where: { id: areaId } }); if (!areaExists) { return res.status(400).json({ message: `Invalid Area ID.` }); } updateData.areaId = areaId; }
       if (Object.keys(updateData).length === 0) { return res.status(400).json({ message: 'No fields to update.' }); }
       const updatedMember = await prisma.member.update({ where: { id: id }, data: updateData, include: { area: { select: { name: true } }, assignedAreaAdmin: {select: { name: true }} } });
       res.status(200).json(updatedMember);
    } catch (error: any) { // @ts-ignore
        if (error.code === 'P2025') { return res.status(404).json({ message: 'Member not found' }); } console.error(`${logPrefix} Error updating member:`, error); res.status(500).json({ message: 'Error updating member' }); }
};
export const deleteMember = async (req: Request, res: Response) => { /* ... code from previous step ... */
    const { id } = req.params;
    const logPrefix = `[${new Date().toISOString()}] deleteMember (ID: ${id}):`;
    if (!id) { return res.status(400).json({ message: "Member ID required." }); }
    try {
        await prisma.member.delete({ where: { id: id }, });
        console.log(`${logPrefix} Prisma delete successful for ID: ${id}.`);
        res.status(204).send();
    } catch (error: any) { // @ts-ignore
        if (error.code === 'P2025') { return res.status(404).json({ message: 'Member not found' }); } console.error(`${logPrefix} Error deleting member:`, error); res.status(500).json({ message: 'Error deleting member' }); }
};