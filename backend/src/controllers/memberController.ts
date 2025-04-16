// backend/src/controllers/memberController.ts (Added isCurrentMonthPaid flag)
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
        // Determine filter based on role
        if (loggedInUser.role === 'areaAdmin') {
            whereClause = { assignedAreaAdminId: loggedInUser.id };
        } else if (loggedInUser.role !== 'admin') {
            // If not admin or areaAdmin, deny access
            return res.status(403).json({ message: 'Forbidden: Unknown role.' });
        }
        // Note: If role is 'admin', whereClause remains empty {}, fetching all members.

        // Fetch members based on the determined whereClause
        const members = await prisma.member.findMany({
            where: whereClause,
            include: { // Include related data
                assignedAreaAdmin: { select: { name: true } }, // Include assigned admin's name
                area: { // Ensure both id and name are selected for area
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' } // Order by creation date
        });

        console.log(`${logPrefix} Found ${members.length} members.`);

        // --- ** NEW LOGIC START: Check current month payment status ** ---

        // 1. Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
        const currentYear = now.getFullYear();
        console.log(`${logPrefix} Checking payment status for Month: ${currentMonth}, Year: ${currentYear}`);

        // 2. Extract member IDs from the fetched list
        const memberIds = members.map(member => member.id);

        // 3. Find payments for these members for the current month/year (only if there are members)
        let paidMemberIds = new Set<string>(); // Use a Set for efficient lookup
        if (memberIds.length > 0) {
            const currentMonthPayments = await prisma.payment.findMany({
                where: {
                    memberId: {
                        in: memberIds // Filter by the members fetched
                    },
                    paymentMonth: currentMonth,
                    paymentYear: currentYear
                },
                select: {
                    memberId: true // Only need memberId to know who paid
                }
            });
            // Create a Set of member IDs who have paid this month
            paidMemberIds = new Set(currentMonthPayments.map(p => p.memberId));
            console.log(`${logPrefix} Found ${paidMemberIds.size} members with payment recorded for ${currentMonth}/${currentYear}.`);
        }

        // 4. Map members to include the payment status flag
        const membersWithStatus = members.map(member => ({
            ...member, // Spread existing member data (including area, assignedAreaAdmin)
            isCurrentMonthPaid: paidMemberIds.has(member.id) // Add the boolean flag
        }));

        // --- ** NEW LOGIC END ** ---

        // 5. Send the modified list back
        console.log(`${logPrefix} Sending ${membersWithStatus.length} members with payment status.`);
        res.status(200).json(membersWithStatus); // Send members with the added flag
        // Note: The original 'res.status(200).json(members);' line is replaced by the line above

    } catch (error: any) {
        console.error(`${logPrefix} Prisma Error:`, error);
        res.status(500).json({ message: 'Error fetching members' });
    }
};

// --- Controller to CREATE a new Member ---
export const createMember = async (req: Request, res: Response) => {
    const logPrefix = `[${new Date().toISOString()}] createMember:`;
    console.log(`${logPrefix} --- Received POST /api/members ---`);
    const { name, phone, monthlyAmount, areaId, assignedAreaAdminId = null } = req.body;
    console.log(`${logPrefix} Request Body:`, req.body);

    // Validation
    if (!name || !phone || !areaId || monthlyAmount === undefined || monthlyAmount === null) {
         console.log(`${logPrefix} FAIL Validation: Missing fields (name, phone, areaId, monthlyAmount).`);
         return res.status(400).json({ message: 'Missing required fields (name, phone, areaId, monthlyAmount)' });
    }
    const amount = Number(monthlyAmount);
    if (isNaN(amount) || amount < 0) { console.log(`${logPrefix} FAIL Validation: Invalid amount.`); return res.status(400).json({ message: 'Invalid monthly amount' }); }
    console.log(`${logPrefix} Input validation passed.`);

    try {
        // Validate Area ID exists
        console.log(`${logPrefix} Validating areaId: ${areaId}...`);
        const areaExists = await prisma.area.findUnique({ where: { id: areaId } });
        if (!areaExists) {
            console.log(`${logPrefix} FAIL Validation: Area ID ${areaId} not found.`);
            return res.status(400).json({ message: `Invalid Area ID: Area not found.` });
        }
        console.log(`${logPrefix} areaId validation passed.`);

        // Validate assignedAreaAdminId if provided (assuming validation exists)
        if (assignedAreaAdminId) { /* ... keep validation ... */ }

        // Create member in DB
        const dataToCreate = { name, phone, monthlyAmount: amount, areaId: areaId, assignedAreaAdminId: assignedAreaAdminId || null };
        console.log(`${logPrefix} Attempting prisma.member.create...`);
        const newMember = await prisma.member.create({
             data: dataToCreate,
             // Optionally include related area name in response
             include: { area: { select: { name: true } } } // Only name needed on create response usually
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
         if (monthlyAmount !== undefined) {
            const amount = Number(monthlyAmount);
            if (isNaN(amount) || amount < 0) {
                 console.log(`${logPrefix} FAIL Validation: Invalid amount.`);
                 return res.status(400).json({ message: 'Invalid monthly amount' });
            }
            updateData.monthlyAmount = amount;
         }
         if (assignedAreaAdminId !== undefined) {
            // Add validation for assignee ID if needed
            updateData.assignedAreaAdminId = assignedAreaAdminId === '' ? null : assignedAreaAdminId;
         }

        // Validate and add areaId if present
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
         if (error.code === 'P2025') { // Record to update not found
            console.log(`${logPrefix} Prisma Error P2025: Member to update not found.`);
            return res.status(404).json({ message: 'Member not found' });
         }
        console.error(`${logPrefix} !!! Prisma/DB Error updating member:`, error);
        res.status(500).json({ message: 'Error updating member' });
    }
     console.log(`${logPrefix} --- Finished PUT /api/members/${id} ---`);
};

// --- Controller to DELETE a Member ---
export const deleteMember = async (req: Request, res: Response) => {
    const { id } = req.params; // Get the ID from the URL parameter
    const logPrefix = `[${new Date().toISOString()}] deleteMember (ID: ${id}):`;
    console.log(`${logPrefix} --- Received DELETE /api/members/${id} ---`);

    if (!id) {
        console.log(`${logPrefix} FAIL Validation: Missing ID.`);
        return res.status(400).json({ message: "Member ID parameter is required." });
    }

    try {
        console.log(`${logPrefix} Attempting prisma.member.delete({ where: { id: ${id} } })...`);

        // Use Prisma to delete the member by its unique ID
        await prisma.member.delete({
            where: { id: id },
        });

        console.log(`${logPrefix} Prisma delete successful for ID: ${id}.`);
        console.log(`${logPrefix} Sending SUCCESS response (204 No Content).`);

        // Send HTTP 204 No Content status for successful DELETE requests
        res.status(204).send();

    } catch (error: any) {
        // Prisma throws an error if the record to delete doesn't exist (P2025)
        // @ts-ignore
        if (error.code === 'P2025') {
            console.log(`${logPrefix} Prisma Error P2025: Record to delete not found.`);
            return res.status(404).json({ message: 'Member not found' }); // Specific error for not found
        }

        // Log any other unexpected errors
        console.error(`${logPrefix} !!! Prisma/DB Error deleting member:`, error);
        // Send a generic server error response
        res.status(500).json({ message: 'Error deleting member in database' });
    }
     console.log(`${logPrefix} --- Finished DELETE /api/members/${id} ---`);
};