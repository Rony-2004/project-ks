// backend/src/controllers/paymentController.ts
// ** Added 'getPayments' function **

import { Request, Response } from 'express';
import prisma from '../lib/prisma'; // Import Prisma Client instance
import { PaymentMethod, UserRole } from '@prisma/client'; // Import Enums

// --- Record Payment (Area Admin) ---
export const recordPayment = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    const logPrefix = `[${controllerStartTime.toISOString()}] recordPayment:`;
    const { memberId, amountPaid, paymentMethod, paymentMonth, paymentYear, paymentDate } = req.body;
    // @ts-ignore
    const loggedInUserId = req.user?.id;
    // @ts-ignore
    const loggedInUserRole = req.user?.role;

    // Basic Validation
    if (!loggedInUserId){ console.error(`${logPrefix} Middleware error: loggedInUserId missing!`); return res.status(401).json({ message: 'Authorization error' }); }
    if (loggedInUserRole !== 'areaAdmin') { console.error(`${logPrefix} Unauthorized role: ${loggedInUserRole}`); return res.status(403).json({ message: 'Forbidden: Only Area Admins can record payments this way.' }); }
    if (!memberId || !amountPaid || !paymentMethod || !paymentMonth || !paymentYear) { return res.status(400).json({ message: 'Missing required fields' }); }
    if (!(paymentMethod in PaymentMethod)) { return res.status(400).json({ message: `Invalid paymentMethod.` }); }
    const amount = Number(amountPaid); const month = Number(paymentMonth); const year = Number(paymentYear);
    if (isNaN(amount) || amount <= 0 || isNaN(month) || month < 1 || month > 12 || isNaN(year) || year < 2000 || year > 2100) { return res.status(400).json({ message: 'Invalid amount, month, or year.' }); }
    let paymentDateObj = new Date(); if (paymentDate) { try { paymentDateObj = new Date(paymentDate); if(isNaN(paymentDateObj.getTime())) throw new Error();} catch { return res.status(400).json({ message: 'Invalid paymentDate format.' });} }

    try {
        // Authorization: Verify Member belongs to this Area Admin
        const member = await prisma.member.findFirst({ where: { id: memberId, assignedAreaAdminId: loggedInUserId } });
        if (!member) { console.log(`${logPrefix} Forbidden check failed. Member ${memberId} not found or not assigned to AreaAdmin ${loggedInUserId}.`); return res.status(403).json({ message: 'Not authorized for this member.' }); }

        // Check for Existing Payment
        const existingPayment = await prisma.payment.findFirst({ where: { memberId: memberId, paymentMonth: month, paymentYear: year } });
        if (existingPayment) { console.log(`${logPrefix} Duplicate Payment Found: ID=${existingPayment.id}. Aborting.`); return res.status(409).json({ message: `Payment for ${month}/${year} already recorded.` }); }

        // Create payment record
        const newPayment = await prisma.payment.create({
            data: { amountPaid: amount, paymentDate: paymentDateObj, paymentMonth: month, paymentYear: year, paymentMethod: paymentMethod as PaymentMethod, memberId: memberId, recordedById: loggedInUserId } // Recorded by the Area Admin
        });
        console.log(`${logPrefix} Payment recorded successfully by AreaAdmin ${loggedInUserId}: ID=${newPayment.id}`);
        res.status(201).json(newPayment);
    } catch (error: any) { console.error(`${logPrefix} Prisma Error recording payment:`, error); res.status(500).json({ message: 'Error recording payment' }); }
};

// --- GET Payments For Specific Area Admin (Keep existing) ---
export const getPaymentsForAreaAdmin = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    // @ts-ignore
    const loggedInUserId = req.user?.id;
    // @ts-ignore
    const loggedInUserRole = req.user?.role;
    const logPrefix = `[${controllerStartTime.toISOString()}] getPaymentsForAreaAdmin:`;
    if (!loggedInUserId || loggedInUserRole !== 'areaAdmin') { return res.status(403).json({ message: 'Forbidden: Access restricted' }); }

    try {
        const payments = await prisma.payment.findMany({
            where: { recordedById: loggedInUserId },
            include: {
                member: {
                    select: {
                        name: true,
                        areaId: true,
                        area: { select: { id: true, name: true } }
                    }
                }
            },
            orderBy: { paymentDate: 'desc' }
        });
        res.status(200).json(payments);
    } catch (error: any) { console.error(`${logPrefix} Prisma Error fetching payments:`, error); res.status(500).json({ message: 'Error fetching payment history' }); }
};

// --- GET ALL Payments (For Admin Role) ---
// This handles GET /api/payments/all
export const getAllPayments = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    // @ts-ignore
    const loggedInUserRole = req.user?.role;
    const logPrefix = `[${controllerStartTime.toISOString()}] getAllPayments:`;
    console.log(`${logPrefix} Requested by Role: ${loggedInUserRole}`);

    if (loggedInUserRole !== 'admin') {
        console.log(`${logPrefix} Forbidden: Access denied. Role was '${loggedInUserRole}', expected 'admin'.`);
        return res.status(403).json({ message: 'Forbidden: Access restricted to Admin.' });
    }
    console.log(`${logPrefix} Admin access GRANTED for /all.`);

    try {
        console.log(`${logPrefix} Fetching ALL payments for Admin...`);
        const payments = await prisma.payment.findMany({
            include: {
                member: {
                    select: {
                        id: true, name: true, monthlyAmount: true, // Include monthlyAmount
                        areaId: true, area: { select: { id: true, name: true } }
                    }
                },
                recordedBy: {
                    select: { id: true, name: true, role: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`${logPrefix} Found ${payments.length} total payments.`);
        res.status(200).json(payments);
    } catch (error: any) {
        console.error(`${logPrefix} Prisma Error fetching all payments:`, error);
        res.status(500).json({ message: 'Error fetching all payment history' });
    }
}; // End getAllPayments


// +++ START ADDED FUNCTION +++
// --- GET Payments (Handles Filtering by Query Params like memberId) ---
// Handles GET /api/payments?memberId=...
export const getPayments = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    // @ts-ignore - User info from middleware
    const loggedInUserId = req.user?.id;
    // @ts-ignore
    const loggedInUserRole = req.user?.role;
    const logPrefix = `[${controllerStartTime.toISOString()}] getPayments (Filtered):`;

    // Extract potential query parameters
    const { memberId } = req.query; // Get memberId from query string like ?memberId=xyz

    console.log(`${logPrefix} Requested by User: ${loggedInUserId}, Role: ${loggedInUserRole}, Query:`, req.query);

    // Authorization: Ensure only admin can use this endpoint for member-specific queries
    if (loggedInUserRole !== 'admin') {
        console.log(`${logPrefix} Forbidden: Role '${loggedInUserRole}' not authorized.`);
        return res.status(403).json({ message: 'Forbidden: Access restricted' });
    }

    // Ensure memberId is provided for this specific use case
    if (!memberId || typeof memberId !== 'string') {
         console.log(`${logPrefix} Bad Request: memberId query parameter is required.`);
         return res.status(400).json({ message: 'memberId query parameter is required for this request.' });
    }

    try {
        // Build the filter based ONLY on memberId for this request
        const whereClause = { memberId: memberId };

        console.log(`${logPrefix} Executing findMany with where clause:`, whereClause);
        const payments = await prisma.payment.findMany({
            where: whereClause,
            include: { // Include necessary details
                member: {
                    select: {
                        id: true, name: true, monthlyAmount: true, // Include monthlyAmount
                        areaId: true, area: { select: { id: true, name: true } }
                    }
                },
                recordedBy: {
                    select: { id: true, name: true, role: true }
                }
            },
            // Order by the month/year the payment was FOR
            orderBy: [
                { paymentYear: 'asc' },
                { paymentMonth: 'asc' }
            ]
        });

        console.log(`${logPrefix} Found ${payments.length} payments matching memberId: ${memberId}.`);
        res.status(200).json(payments);

    } catch (error: any) {
        console.error(`${logPrefix} Prisma Error fetching payments:`, error);
        res.status(500).json({ message: 'Error fetching payment data' });
    }
}; // End getPayments
// +++ END ADDED FUNCTION +++


// --- UPDATE a Payment Record (Admin or Original Recorder) ---
export const updatePayment = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    const { paymentId } = req.params;
    const { amountPaid, paymentMethod, paymentMonth, paymentYear, paymentDate } = req.body;
    // @ts-ignore
    const loggedInUserId = req.user?.id;
    // @ts-ignore
    const loggedInUserRole = req.user?.role;
    const logPrefix = `[${controllerStartTime.toISOString()}] updatePayment (ID: ${paymentId}):`;

    console.log(`${logPrefix} Update attempt by User ID: ${loggedInUserId}, Role: ${loggedInUserRole}`);
    console.log(`${logPrefix} Request Body:`, req.body);

    if (!paymentId) { return res.status(400).json({ message: 'Payment ID is required in URL.' }); }
    if (amountPaid === undefined && paymentMethod === undefined && paymentMonth === undefined && paymentYear === undefined && paymentDate === undefined) { return res.status(400).json({ message: 'No update data provided.' }); }

    try {
        const existingPayment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!existingPayment) { return res.status(404).json({ message: 'Payment record not found.' }); }

        console.log(`${logPrefix} Verifying updater. Payment recordedBy=${existingPayment.recordedById}, LoggedInUser=${loggedInUserId}, Role=${loggedInUserRole}`);
        const isAdmin = loggedInUserRole === 'admin';
        const isRecorder = existingPayment.recordedById === loggedInUserId;
        if (!isAdmin && !isRecorder) { console.log(`${logPrefix} Authorization FAILED.`); return res.status(403).json({ message: 'Forbidden: You can only update payments you recorded or if you are an Admin.' }); }
         console.log(`${logPrefix} Authorization PASSED.`);

        const updateData: { amountPaid?: number; paymentMethod?: PaymentMethod; paymentMonth?: number; paymentYear?: number; paymentDate?: Date; } = {};
        if (amountPaid !== undefined) { const amount = Number(amountPaid); if (isNaN(amount) || amount <= 0) { return res.status(400).json({ message: 'Invalid amount provided.' }); } updateData.amountPaid = amount; }
        if (paymentMethod !== undefined) { if (!(paymentMethod in PaymentMethod)) { return res.status(400).json({ message: `Invalid paymentMethod.` }); } updateData.paymentMethod = paymentMethod as PaymentMethod; }
        if (paymentMonth !== undefined) { const month = Number(paymentMonth); if (isNaN(month) || month < 1 || month > 12) { return res.status(400).json({ message: 'Invalid month.' }); } updateData.paymentMonth = month; }
        if (paymentYear !== undefined) { const year = Number(paymentYear); if (isNaN(year) || year < 2000 || year > 2099) { return res.status(400).json({ message: 'Invalid year.' }); } updateData.paymentYear = year; }
        if (paymentDate !== undefined && paymentDate !== null && paymentDate !== '') { const dateObj = new Date(paymentDate); if (isNaN(dateObj.getTime())) { return res.status(400).json({ message: 'Invalid paymentDate format.' }); } updateData.paymentDate = dateObj; }

        const updatedPayment = await prisma.payment.update({ where: { id: paymentId }, data: updateData });
        console.log(`${logPrefix} Prisma update successful.`);
        res.status(200).json(updatedPayment);
    } catch (error: any) {
         console.error(`${logPrefix} !!! Prisma/DB Error updating payment:`, error);
         // @ts-ignore
         if (error.code === 'P2025') { return res.status(404).json({ message: 'Payment record not found during update.' }); }
        res.status(500).json({ message: 'Error updating payment record' });
    }
}; // End updatePayment


// --- DELETE a Payment Record (Admin or Original Recorder) ---
export const deletePayment = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    const { paymentId } = req.params;
    // @ts-ignore
    const loggedInUserId = req.user?.id;
    // @ts-ignore
    const loggedInUserRole = req.user?.role;
    const logPrefix = `[${controllerStartTime.toISOString()}] deletePayment (ID: ${paymentId}):`;

    console.log(`${logPrefix} Delete attempt by User ID: ${loggedInUserId}, Role: ${loggedInUserRole}`);
    if (!paymentId) { return res.status(400).json({ message: 'Payment ID is required.' }); }

    try {
        const existingPayment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!existingPayment) { return res.status(404).json({ message: 'Payment record not found.' }); }

        console.log(`${logPrefix} Verifying deleter. Payment recordedBy=${existingPayment.recordedById}, LoggedInUser=${loggedInUserId}, Role=${loggedInUserRole}`);
        const isAdmin = loggedInUserRole === 'admin';
        const isRecorder = existingPayment.recordedById === loggedInUserId;
        if (!isAdmin && !isRecorder) { console.log(`${logPrefix} Authorization FAILED.`); return res.status(403).json({ message: 'Forbidden: You can only delete payments you recorded or if you are an Admin.' }); }
         console.log(`${logPrefix} Authorization PASSED.`);

        await prisma.payment.delete({ where: { id: paymentId } });
        console.log(`${logPrefix} Prisma delete successful.`);
        res.status(204).send(); // Success, No Content
    } catch (error: any) {
        console.error(`${logPrefix} !!! Prisma/DB Error deleting payment:`, error);
         // @ts-ignore
         if (error.code === 'P2025') { return res.status(404).json({ message: 'Payment record not found during deletion.' }); }
        res.status(500).json({ message: 'Error deleting payment record' });
    }
}; // End deletePayment