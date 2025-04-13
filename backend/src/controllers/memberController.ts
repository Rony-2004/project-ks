// backend/src/controllers/memberController.ts
import { Request, Response } from 'express';

// Temporary In-Memory Store for Members (Replace with Database Later!)
interface Member {
    id: string;
    name: string;
    phone: string;
    address: string;
    monthlyAmount: number; // Store amount as number
    assignedAreaAdminId: string | null; // ID of the Area Admin assigned, or null
    createdAt: Date;
}
let members: Member[] = []; // Our temporary "database" for members
let nextMemberId = 1; // Simple ID counter

// --- Controller to GET all Members ---
export const getAllMembers = async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] GET /api/members requested`);
    try {
        // TODO: Add filtering/pagination later
        res.status(200).json(members);
    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Error fetching members:`, error);
        res.status(500).json({ message: 'Error fetching members' });
    }
};

// --- Controller to CREATE a new Member ---
export const createMember = async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] POST /api/members requested`);
    const { name, phone, address, monthlyAmount, assignedAreaAdminId = null } = req.body;

    // Basic Validation
    if (!name || !phone || !address || monthlyAmount === undefined || monthlyAmount === null) {
        return res.status(400).json({ message: 'Missing required fields (name, phone, address, monthlyAmount)' });
    }
    const amount = Number(monthlyAmount); // Ensure amount is a number
    if (isNaN(amount) || amount < 0) {
        return res.status(400).json({ message: 'Invalid monthly amount provided' });
    }

    // Optional: Validate assignedAreaAdminId exists if provided (requires access to areaAdmin data/DB)

    try {
        const newMember: Member = {
            id: (nextMemberId++).toString(),
            name,
            phone,
            address,
            monthlyAmount: amount,
            assignedAreaAdminId: assignedAreaAdminId || null, // Ensure it's null if empty/falsy
            createdAt: new Date()
        };

        members.push(newMember);
        console.log(`[${new Date().toISOString()}] Member created:`, { id: newMember.id, name: newMember.name });

        res.status(201).json(newMember); // 201 Created

    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Error creating member:`, error);
        res.status(500).json({ message: 'Error creating member' });
    }
};

// --- Controller to UPDATE a Member ---
export const updateMember = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, phone, address, monthlyAmount, assignedAreaAdminId } = req.body;
    console.log(`[${new Date().toISOString()}] PUT /api/members/${id} requested with data:`, req.body);

    const memberIndex = members.findIndex(m => m.id === id);

    if (memberIndex === -1) {
        console.log(`[${new Date().toISOString()}] Member not found for update: ID=${id}`);
        return res.status(404).json({ message: 'Member not found' });
    }

    // Validate amount if provided
    let amount: number | undefined = undefined;
    if (monthlyAmount !== undefined && monthlyAmount !== null) {
         amount = Number(monthlyAmount);
         if (isNaN(amount) || amount < 0) {
            return res.status(400).json({ message: 'Invalid monthly amount provided for update' });
         }
    }
    // Optional: Validate assignedAreaAdminId if provided

    try {
        const originalMember = members[memberIndex];
        const updatedMember = {
            ...originalMember,
            name: name ?? originalMember.name,
            phone: phone ?? originalMember.phone,
            address: address ?? originalMember.address,
            monthlyAmount: amount ?? originalMember.monthlyAmount,
            // Allow explicitly setting assignedAreaAdminId to null or a new ID
            assignedAreaAdminId: assignedAreaAdminId !== undefined ? (assignedAreaAdminId || null) : originalMember.assignedAreaAdminId,
        };

        members[memberIndex] = updatedMember;
        console.log(`[${new Date().toISOString()}] Member updated successfully: ID=${id}`);
        res.status(200).json(updatedMember);

    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] Error updating member:`, error);
        res.status(500).json({ message: 'Error updating member' });
    }
};

// --- Controller to DELETE a Member ---
export const deleteMember = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`[${new Date().toISOString()}] DELETE /api/members/${id} requested`);

    const initialLength = members.length;
    members = members.filter(m => m.id !== id); // Remove member

    if (members.length < initialLength) {
        console.log(`[${new Date().toISOString()}] Member deleted successfully: ID=${id}`);
        res.status(204).send(); // Success, No Content
    } else {
        console.log(`[${new Date().toISOString()}] Member not found for deletion: ID=${id}`);
        res.status(404).json({ message: 'Member not found' });
    }
};