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
export const updateMember = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    const { id } = req.params; // Member ID to update
    const { name, phone, address, monthlyAmount, assignedAreaAdminId } = req.body; // Data from frontend
    const logPrefix = `[${controllerStartTime.toISOString()}] updateMember (ID: ${id}):`;

    console.log(`<span class="math-inline">\{logPrefix\} \-\-\- Received PUT /api/members/</span>{id} ---`);
    console.log(`${logPrefix} Request Body:`, req.body);

    if (!id) {
        console.log(`${logPrefix} FAIL - Missing ID in URL.`);
        return res.status(400).json({ message: "Member ID required in URL parameter." });
    }

    try {
         // Prepare update data object - include fields ONLY if they were sent in the body
         const updateData: {
            name?: string;
            phone?: string;
            address?: string;
            monthlyAmount?: number;
            assignedAreaAdminId?: string | null;
         } = {};
         console.log(`${logPrefix} Preparing data for update...`);

         if (name !== undefined) updateData.name = name;
         if (phone !== undefined) updateData.phone = phone;
         if (address !== undefined) updateData.address = address;

         // Validate and add monthlyAmount if present
         if (monthlyAmount !== undefined) {
            // Allow setting amount to 0, but not invalid numbers or null
            if (monthlyAmount === null) {
                console.log(`${logPrefix} FAIL Validation: monthlyAmount cannot be null.`);
                return res.status(400).json({ message: 'Monthly amount cannot be null.' });
            }
            const amount = Number(monthlyAmount);
            if (isNaN(amount) || amount < 0) {
                console.log(`<span class="math-inline">\{logPrefix\} FAIL Validation\: Invalid monthly amount \(</span>{monthlyAmount}).`);
                return res.status(400).json({ message: 'Invalid monthly amount provided for update' });
            }
            updateData.monthlyAmount = amount;
            console.log(`${logPrefix} - Will update monthlyAmount to: ${amount}`);
         }

         // Handle assignedAreaAdminId (allow setting to null with empty string or null)
         if (assignedAreaAdminId !== undefined) {
             const finalAssigneeId = (assignedAreaAdminId === '' || assignedAreaAdminId === null) ? null : assignedAreaAdminId;
             console.log(`<span class="math-inline">\{logPrefix\} Processing assignedAreaAdminId\: Received\='</span>{assignedAreaAdminId}', Final='${finalAssigneeId}'`);
             // Optional: Validate the ID exists if it's not null
             if (finalAssigneeId) {
                 console.log(`${logPrefix} Validating assignedAreaAdminId: ${finalAssigneeId}...`);
                 const areaAdminExists = await prisma.user.findUnique({ where: { id: finalAssigneeId, role: 'AreaAdmin' } }); // Check role too
                 if (!areaAdminExists) {
                     console.log(`${logPrefix} FAIL Validation: Assigned Area Admin ID ${finalAssigneeId} not found or not AreaAdmin.`);
                     return res.status(400).json({ message: `Invalid assignedAreaAdminId: Not Found or invalid role.` });
                 }
                 console.log(`${logPrefix} Assigned Area Admin ID validation passed.`);
             }
             updateData.assignedAreaAdminId = finalAssigneeId;
             console.log(`${logPrefix} - Will update assignedAreaAdminId to: ${finalAssigneeId}`);
         }

        // Check if there's actually anything to update
        if (Object.keys(updateData).length === 0) {
             console.log(`${logPrefix} FAIL Validation: No valid fields provided for update.`);
             return res.status(400).json({ message: 'No valid fields provided for update.' });
        }

        // Use Prisma Client to update the member
        console.log(`${logPrefix} Attempting prisma.member.update with data:`, updateData);
        const updatedMember = await prisma.member.update({
            where: { id: id },
            data: updateData
        }); // <<< POTENTIAL HANG POINT?
        console.log(`${logPrefix} Prisma update successful.`);

        console.log(`[${controllerStartTime.toISOString()}] updateMember: Sending SUCCESS response (200).`);
        res.status(200).json(updatedMember); // <<< RESPONSE SENT?

    } catch (error: any) {
         console.error(`${logPrefix} !!! Prisma/DB Error updating member:`, error);
         // Handle specific Prisma error if record to update is not found
         // @ts-ignore
         if (error.code === 'P2025') { // Prisma code for 'Record to update not found'
             console.log(`<span class="math-inline">\{logPrefix\} FAIL \- Member not found in DB\: ID\=</span>{id}`);
             return res.status(404).json({ message: 'Member not found' });
        }
        // Handle other potential errors
        res.status(500).json({ message: 'Error updating member in database' });
    }
     console.log(`[<span class="math-inline">\{controllerStartTime\.toISOString\(\)\}\] \-\-\- Finished PUT /api/members/</span>{id} ---`); // Log end
};

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