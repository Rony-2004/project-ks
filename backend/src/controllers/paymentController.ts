// backend/src/controllers/paymentController.ts (ADDED Update and Delete)
import { Request, Response } from 'express';
import prisma from '../lib/prisma'; // Import Prisma Client instance
import { PaymentMethod, UserRole } from '@prisma/client'; // Import Enums

// --- Record Payment (Keep existing) ---
export const recordPayment = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    const logPrefix = `[${controllerStartTime.toISOString()}] recordPayment:`;
    console.log(`${logPrefix} --- Received POST /api/payments ---`);
    const { memberId, amountPaid, paymentMethod, paymentMonth, paymentYear, paymentDate } = req.body;
    // @ts-ignore
    const loggedInUserId = req.user?.id;
    // @ts-ignore
    const loggedInUserRole = req.user?.role; // Logged in user info from middleware
    console.log(`${logPrefix} Request Body:`, req.body);
    console.log(`>>> ${logPrefix} Recorded by User ID: ${loggedInUserId}, Role: ${loggedInUserRole}`);

    // Validation
    if (!loggedInUserId){ console.error("Middleware error: loggedInUserId missing!"); return res.status(401).json({ message: 'Authorization error' }); }
    if (!memberId || !amountPaid || !paymentMethod || !paymentMonth || !paymentYear) { return res.status(400).json({ message: 'Missing required fields' }); }
    if (!(paymentMethod in PaymentMethod)) { return res.status(400).json({ message: `Invalid paymentMethod.` }); }
    const amount = Number(amountPaid); const month = Number(paymentMonth); const year = Number(paymentYear);
    if (isNaN(amount) || amount <= 0 || isNaN(month) || month < 1 || month > 12 || isNaN(year) || year < 2000 || year > 2100) { return res.status(400).json({ message: 'Invalid amount, month, or year.' }); }
    let paymentDateObj = new Date(); if (paymentDate) { try { paymentDateObj = new Date(paymentDate); if(isNaN(paymentDateObj.getTime())) throw new Error();} catch { return res.status(400).json({ message: 'Invalid paymentDate format.' });} }
    console.log(`${logPrefix} Input validation passed.`);

    try {
        // Authorization Check: Verify Member belongs to this Area Admin
        console.log(`${logPrefix} Verifying member assignment... MemberID: ${memberId}, AreaAdminID: ${loggedInUserId}`);
        const member = await prisma.member.findFirst({ where: { id: memberId, assignedAreaAdminId: loggedInUserId } });
        if (!member) { console.log(`${logPrefix} Forbidden check failed.`); return res.status(403).json({ message: 'Not authorized for this member.' }); }
        console.log(`${logPrefix} Member assignment verified.`);

        // Check for Existing Payment for this Member/Month/Year
        console.log(`${logPrefix} Checking for existing payment for Member ${memberId}, Month ${month}, Year ${year}...`);
        const existingPayment = await prisma.payment.findFirst({ where: { memberId: memberId, paymentMonth: month, paymentYear: year } });
        if (existingPayment) { console.log(`${logPrefix} Duplicate Payment Found: ID=${existingPayment.id}. Aborting.`); return res.status(409).json({ message: `Payment for ${month}/${year} already recorded.` }); }
        console.log(`${logPrefix} No duplicate payment found. Proceeding...`);

        // Create payment record
        console.log(`${logPrefix} Creating payment record in DB...`);
        const newPayment = await prisma.payment.create({
            data: { amountPaid: amount, paymentDate: paymentDateObj, paymentMonth: month, paymentYear: year, paymentMethod: paymentMethod as PaymentMethod, memberId: memberId, recordedById: loggedInUserId }
        });
        console.log(`${logPrefix} Payment recorded successfully: ID=${newPayment.id}`);
        res.status(201).json(newPayment);
    } catch (error: any) { console.error(`${logPrefix} Prisma Error recording payment:`, error); res.status(500).json({ message: 'Error recording payment' }); }
    console.log(`${logPrefix} --- Finished POST /api/payments ---`);
}; // End recordPayment


// --- GET Payments For Area Admin (Keep existing) ---
export const getPaymentsForAreaAdmin = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    // @ts-ignore
    const loggedInUserId = req.user?.id;
    // @ts-ignore
    const loggedInUserRole = req.user?.role;
    const logPrefix = `[${controllerStartTime.toISOString()}] getPaymentsForAreaAdmin:`;
    console.log(`${logPrefix} Requested by User ID: ${loggedInUserId}, Role: ${loggedInUserRole}`);
    if (!loggedInUserId || loggedInUserRole !== 'areaAdmin') { return res.status(403).json({ message: 'Forbidden: Access restricted' }); }

    try {
        console.log(`${logPrefix} Fetching payments recorded by Area Admin ID: ${loggedInUserId}`);
        // Inside getPaymentsForAreaAdmin function in paymentController.ts

      const payments = await prisma.payment.findMany({
        // 1. Filter by the logged-in user (RESTORED)
        where: { recordedById: loggedInUserId },

        // 2. Include the necessary related data (CORRECT STRUCTURE)
        include: {
            member: {           // Include the related member
                select: {         // Select only needed member fields
                    name: true,       // Keep member name
                    areaId: true,     // Keep areaId (needed for frontend filtering)
                    area: {           // Include nested area object
                        select: {
                            id: true,     // Need area id
                            name: true    // Need area name
                        }
                    }
                }
            }
            // Add other includes for the Payment model itself if needed
        },

        // 3. Order the results (RESTORED)
        orderBy: { paymentDate: 'desc' }
    });
        console.log(`${logPrefix} Found ${payments.length} payments.`);
        res.status(200).json(payments);
    } catch (error: any) { console.error(`${logPrefix} Prisma Error fetching payments:`, error); res.status(500).json({ message: 'Error fetching payment history' }); }
     console.log(`${logPrefix} --- Finished GET /api/payments/my-area ---`);
}; // End getPaymentsForAreaAdmin


// --- **NEW** UPDATE a Payment Record ---
export const updatePayment = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    const { paymentId } = req.params; // Get payment ID from URL
    const { amountPaid, paymentMethod, paymentMonth, paymentYear, paymentDate } = req.body; // Get updated data
    // @ts-ignore
    const loggedInUserId = req.user?.id; // ID of logged-in Area Admin
    const logPrefix = `[${controllerStartTime.toISOString()}] updatePayment (ID: ${paymentId}):`;

    console.log(`${logPrefix} --- Received PUT /api/payments/${paymentId} ---`);
    console.log(`${logPrefix} Request Body:`, req.body);

    // Basic Validation
    if (!paymentId) { return res.status(400).json({ message: 'Payment ID is required in URL.' }); }
    // Validate that at least one field to update is present
    if (amountPaid === undefined && paymentMethod === undefined && paymentMonth === undefined && paymentYear === undefined && paymentDate === undefined) {
         return res.status(400).json({ message: 'No update data provided.' });
    }

    try {
        // 1. Find the existing payment
        console.log(`${logPrefix} Fetching existing payment...`);
        const existingPayment = await prisma.payment.findUnique({
            where: { id: paymentId }
        });

        if (!existingPayment) {
            console.log(`${logPrefix} Payment not found.`);
            return res.status(404).json({ message: 'Payment record not found.' });
        }

        // 2. Authorization: Check if logged-in user recorded this payment
        console.log(`${logPrefix} Verifying recorder ID. Payment recordedBy=${existingPayment.recordedById}, LoggedInUser=${loggedInUserId}`);
        if (existingPayment.recordedById !== loggedInUserId) {
            console.log(`${logPrefix} Authorization failed.`);
            return res.status(403).json({ message: 'Forbidden: You can only update payments you recorded.' });
        }
        console.log(`${logPrefix} Authorization passed.`);

        // 3. Prepare update data object & Validate fields if they are provided
        const updateData: { amountPaid?: number; paymentMethod?: PaymentMethod; paymentMonth?: number; paymentYear?: number; paymentDate?: Date; } = {};

        if (amountPaid !== undefined) {
            const amount = Number(amountPaid);
            if (isNaN(amount) || amount <= 0) { return res.status(400).json({ message: 'Invalid amount provided.' }); }
            updateData.amountPaid = amount;
        }
        if (paymentMethod !== undefined) {
            if (!(paymentMethod in PaymentMethod)) { return res.status(400).json({ message: `Invalid paymentMethod.` }); }
            updateData.paymentMethod = paymentMethod as PaymentMethod;
        }
        if (paymentMonth !== undefined) {
            const month = Number(paymentMonth);
            if (isNaN(month) || month < 1 || month > 12) { return res.status(400).json({ message: 'Invalid month.' }); }
            updateData.paymentMonth = month;
        }
        if (paymentYear !== undefined) {
            const year = Number(paymentYear);
            if (isNaN(year) || year < 2000 || year > 2099) { return res.status(400).json({ message: 'Invalid year.' }); }
            updateData.paymentYear = year;
        }
        if (paymentDate !== undefined) {
            const dateObj = new Date(paymentDate);
            if (isNaN(dateObj.getTime())) { return res.status(400).json({ message: 'Invalid paymentDate format.' }); }
            updateData.paymentDate = dateObj;
        }
        console.log(`${logPrefix} Prepared update data:`, updateData);

        // 4. Update payment in database
        console.log(`${logPrefix} Attempting prisma.payment.update...`);
        const updatedPayment = await prisma.payment.update({
            where: { id: paymentId },
            data: updateData
        });
        console.log(`${logPrefix} Prisma update successful.`);

        // 5. Send back updated payment
        res.status(200).json(updatedPayment);

    } catch (error: any) {
         console.error(`${logPrefix} !!! Prisma/DB Error updating payment:`, error);
         // @ts-ignore - Check Prisma specific error codes
         if (error.code === 'P2025') { // Record to update not found (might happen if deleted between check and update)
             return res.status(404).json({ message: 'Payment record not found during update.' });
         }
        res.status(500).json({ message: 'Error updating payment record' });
    }
     console.log(`${logPrefix} --- Finished PUT /api/payments/${paymentId} ---`);
};


// --- **NEW** DELETE a Payment Record ---
export const deletePayment = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    const { paymentId } = req.params; // Get payment ID from URL
    // @ts-ignore
    const loggedInUserId = req.user?.id; // ID of logged-in Area Admin
    const logPrefix = `[${controllerStartTime.toISOString()}] deletePayment (ID: ${paymentId}):`;

    console.log(`${logPrefix} --- Received DELETE /api/payments/${paymentId} ---`);

    if (!paymentId) { return res.status(400).json({ message: 'Payment ID is required.' }); }

    try {
        // 1. Find the existing payment to check ownership
        console.log(`${logPrefix} Fetching existing payment...`);
        const existingPayment = await prisma.payment.findUnique({
            where: { id: paymentId }
        });

        if (!existingPayment) {
            console.log(`${logPrefix} Payment not found.`);
            return res.status(404).json({ message: 'Payment record not found.' });
        }

        // 2. Authorization: Check if logged-in user recorded this payment
        console.log(`${logPrefix} Verifying recorder ID. Payment recordedBy=${existingPayment.recordedById}, LoggedInUser=${loggedInUserId}`);
        if (existingPayment.recordedById !== loggedInUserId) {
            console.log(`${logPrefix} Authorization failed.`);
            return res.status(403).json({ message: 'Forbidden: You can only delete payments you recorded.' });
        }
         console.log(`${logPrefix} Authorization passed.`);

        // 3. Delete payment from database
        console.log(`${logPrefix} Attempting prisma.payment.delete...`);
        await prisma.payment.delete({
            where: { id: paymentId }
        });
        console.log(`${logPrefix} Prisma delete successful.`);

        // 4. Send Success Response
        console.log(`${logPrefix} Sending SUCCESS response (204).`);
        res.status(204).send(); // Success, No Content

    } catch (error: any) {
        console.error(`${logPrefix} !!! Prisma/DB Error deleting payment:`, error);
        // @ts-ignore - Check Prisma specific error codes
        if (error.code === 'P2025') { // Record to delete not found
             return res.status(404).json({ message: 'Payment record not found during deletion.' });
        }
        res.status(500).json({ message: 'Error deleting payment record' });
    }
     console.log(`${logPrefix} --- Finished DELETE /api/payments/${paymentId} ---`);
};