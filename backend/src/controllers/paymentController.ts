// backend/src/controllers/paymentController.ts (REMOVING internal role check)
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { PaymentMethod } from '@prisma/client';
// Removed UserRole import as it's not directly needed here anymore

export const recordPayment = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    console.log(`[${controllerStartTime.toISOString()}] --- Received POST ${process.env.API_PREFIX || '/api'}/payments ---`);

    const { memberId, amountPaid, paymentMethod, paymentMonth, paymentYear, paymentDate } = req.body;
    // @ts-ignore
    const loggedInUserId = req.user?.id; // We still need the ID for recording and auth check
    // @ts-ignore
    const loggedInUserRole = req.user?.role; // Log it, but don't block based on it here

    console.log(`[${controllerStartTime.toISOString()}] Request Body:`, req.body);
    // Log the info received from middleware, but don't use loggedInUserRole for primary check here
    console.log(`>>> [recordPayment] Recorded by User ID: ${loggedInUserId}, Role from middleware: ${loggedInUserRole}`);

    // --- REMOVED/COMMENTED OUT THIS BLOCK ---
    // if (!loggedInUserId || loggedInUserRole !== 'areaAdmin') {
    //     console.log(`[recordPayment] Permission Check Failed: Role is '${loggedInUserRole}', expected 'areaAdmin'`);
    //     return res.status(403).json({ message: 'Forbidden: Only Area Admins can record payments.' });
    // }
    // --- END REMOVED BLOCK ---

    // --- Validation (Keep other validation) ---
    if (!loggedInUserId){ // Still need to ensure user ID exists from middleware
         console.error("Middleware error: loggedInUserId missing!");
         return res.status(401).json({ message: 'Authorization error' });
    }
    if (!memberId || !amountPaid || !paymentMethod || !paymentMonth || !paymentYear) { /* ... */ return res.status(400).json({ message: 'Missing required fields...' }); }
    if (!(paymentMethod in PaymentMethod)) { /* ... */ return res.status(400).json({ message: `Invalid paymentMethod.` }); }
    const amount = Number(amountPaid); const month = Number(paymentMonth); const year = Number(paymentYear);
    if (isNaN(amount) || amount <= 0 || isNaN(month) || month < 1 || month > 12 || isNaN(year) || year < 2000 || year > 2100) { /* ... */ return res.status(400).json({ message: 'Invalid amount, month, or year.' }); }
    let paymentDateObj = new Date(); if (paymentDate) { /* ... date parsing ... */ }
    // --- End Validation ---

    try {
        // --- Authorization Check: Verify Member belongs to this Area Admin ---
        // This check remains crucial!
        console.log(`[${controllerStartTime.toISOString()}] Verifying member assignment... MemberID: ${memberId}, AreaAdminID: ${loggedInUserId}`);
        const member = await prisma.member.findFirst({
            where: { id: memberId, assignedAreaAdminId: loggedInUserId } // Check assignment
        });
        if (!member) {
            console.log(`[${controllerStartTime.toISOString()}] Forbidden: Member ${memberId} not found or not assigned.`);
            return res.status(403).json({ message: 'You are not authorized to record payments for this member.' });
        }
        console.log(`[${controllerStartTime.toISOString()}] Member assignment verified.`);

        // Create payment record
        console.log(`[${controllerStartTime.toISOString()}] Creating payment record in DB...`);
        const newPayment = await prisma.payment.create({
            data: {
                amountPaid: amount, paymentDate: paymentDateObj, paymentMonth: month,
                paymentYear: year, paymentMethod: paymentMethod as PaymentMethod,
                memberId: memberId, recordedById: loggedInUserId // Use ID from middleware
            }
        });
        console.log(`[<span class="math-inline">\{controllerStartTime\.toISOString\(\)\}\] Payment recorded successfully\: ID\=</span>{newPayment.id}`);
        res.status(201).json(newPayment);

    } catch (error: any) {
        console.error(`[${controllerStartTime.toISOString()}] Prisma Error recording payment:`, error);
        res.status(500).json({ message: 'Error recording payment' });
    }
}; // End recordPayment

// Keep other controllers (getAllAreaAdmins etc.) if they are in this filea