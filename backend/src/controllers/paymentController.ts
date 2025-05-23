// backend/src/controllers/paymentController.ts
// ** Removed redundant role check from recordPaymentByAdmin **

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { PaymentMethod, UserRole } from '@prisma/client';

// --- Record Payment (Area Admin) --- (No changes)
export const recordPayment = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    const logPrefix = `[${controllerStartTime.toISOString()}] recordPayment:`;
    const { memberId, amountPaid, paymentMethod, paymentMonth, paymentYear, paymentDate } = req.body;
    // @ts-ignore
    const loggedInUserId = req.user?.id;
    // @ts-ignore
    const loggedInUserRole = req.user?.role;
    if (!loggedInUserId){ return res.status(401).json({ message: 'Authorization error' }); }
    // Ensure role check here uses Enum or consistent string if UserRole enum isn't directly on req.user
    if (loggedInUserRole !== UserRole.AreaAdmin && loggedInUserRole !== 'areaAdmin') { return res.status(403).json({ message: 'Forbidden: Only Area Admins allowed.' }); }
    if (!memberId || !amountPaid || !paymentMethod || !paymentMonth || !paymentYear) { return res.status(400).json({ message: 'Missing required fields' }); }
    if (!(paymentMethod in PaymentMethod)) { return res.status(400).json({ message: `Invalid paymentMethod.` }); }
    const amount = Number(amountPaid); const month = Number(paymentMonth); const year = Number(paymentYear);
    if (isNaN(amount) || amount <= 0 || isNaN(month) || month < 1 || month > 12 || isNaN(year) || year < 2000 || year > 2100) { return res.status(400).json({ message: 'Invalid amount, month, or year.' }); }
    let paymentDateObj = new Date(); if (paymentDate) { try { paymentDateObj = new Date(paymentDate); if(isNaN(paymentDateObj.getTime())) throw new Error();} catch { return res.status(400).json({ message: 'Invalid paymentDate format.' });} }
    try {
        const member = await prisma.member.findFirst({ where: { id: memberId, assignedAreaAdminId: loggedInUserId } });
        if (!member) { return res.status(403).json({ message: 'Not authorized for this member.' }); }
        const existingPayment = await prisma.payment.findFirst({ where: { memberId: memberId, paymentMonth: month, paymentYear: year } });
        if (existingPayment) { return res.status(409).json({ message: `Payment for ${month}/${year} already recorded.` }); }
        const newPayment = await prisma.payment.create({ data: { amountPaid: amount, paymentDate: paymentDateObj, paymentMonth: month, paymentYear: year, paymentMethod: paymentMethod as PaymentMethod, memberId: memberId, recordedById: loggedInUserId } });
        res.status(201).json(newPayment);
    } catch (error: any) { console.error(`${logPrefix} Prisma Error recording payment:`, error); res.status(500).json({ message: 'Error recording payment' }); }
};

// --- GET Payments For Specific Area Admin --- (No changes)
export const getPaymentsForAreaAdmin = async (req: Request, res: Response) => { /* ... existing code ... */
    const controllerStartTime = new Date();
    // @ts-ignore
    const loggedInUserId = req.user?.id;
    // @ts-ignore
    const loggedInUserRole = req.user?.role;
    const logPrefix = `[${controllerStartTime.toISOString()}] getPaymentsForAreaAdmin:`;
     // Ensure role check here uses Enum or consistent string
    if (!loggedInUserId || (loggedInUserRole !== UserRole.AreaAdmin && loggedInUserRole !== 'areaAdmin')) { return res.status(403).json({ message: 'Forbidden: Access restricted' }); }
    try {
        const payments = await prisma.payment.findMany({
            where: { recordedById: loggedInUserId },
            include: { member: { select: { name: true, areaId: true, area: { select: { id: true, name: true } } } } },
            orderBy: { paymentDate: 'desc' }
        });
        res.status(200).json(payments);
    } catch (error: any) { console.error(`${logPrefix} Prisma Error fetching payments:`, error); res.status(500).json({ message: 'Error fetching payment history' }); }
};

// --- GET ALL Payments (For Admin Role) --- (Removed internal check)
export const getAllPayments = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    // @ts-ignore - Role is checked by restrictTo middleware on the route
    const loggedInUserRole = req.user?.role;
    const logPrefix = `[${controllerStartTime.toISOString()}] getAllPayments:`;
    console.log(`${logPrefix} Reached controller. Requested by Role: ${loggedInUserRole}`);
    // ** REMOVED redundant internal role check **
    try {
        console.log(`${logPrefix} Fetching ALL payments for Admin...`);
        const payments = await prisma.payment.findMany({
            include: {
                member: { select: { id: true, name: true, monthlyAmount: true, areaId: true, area: { select: { id: true, name: true } } } },
                recordedBy: { select: { id: true, name: true, role: true } }
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


// --- GET Payments (Filtered by memberId) --- (Removed internal check)
export const getPayments = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    // @ts-ignore
    const loggedInUserId = req.user?.id;
    // @ts-ignore
    const loggedInUserRole = req.user?.role; // Role checked by middleware
    const logPrefix = `[${controllerStartTime.toISOString()}] getPayments (Filtered):`;
    const { memberId } = req.query;
    console.log(`${logPrefix} Reached controller. Requested by User: ${loggedInUserId}, Role: ${loggedInUserRole}, Query:`, req.query);
    // ** REMOVED redundant internal role check **
    if (!memberId || typeof memberId !== 'string') { return res.status(400).json({ message: 'memberId query parameter is required.' }); }
    try {
        const whereClause = { memberId: memberId };
        console.log(`${logPrefix} Executing findMany with where clause:`, whereClause);
        const payments = await prisma.payment.findMany({
            where: whereClause,
            include: {
                member: { select: { id: true, name: true, monthlyAmount: true, areaId: true, area: { select: { id: true, name: true } } } },
                recordedBy: { select: { id: true, name: true, role: true } }
            },
            orderBy: [ { paymentYear: 'asc' }, { paymentMonth: 'asc' } ]
        });
        console.log(`${logPrefix} Found ${payments.length} payments matching memberId: ${memberId}.`);
        res.status(200).json(payments);
    } catch (error: any) { console.error(`${logPrefix} Prisma Error fetching payments:`, error); res.status(500).json({ message: 'Error fetching payment data' }); }
}; // End getPayments


// --- UPDATE a Payment Record --- (No changes needed)
export const updatePayment = async (req: Request, res: Response) => { /* ... existing code ... */
    const controllerStartTime = new Date();
    const { paymentId } = req.params;
    const { amountPaid, paymentMethod, paymentMonth, paymentYear, paymentDate } = req.body;
    // @ts-ignore
    const loggedInUserId = req.user?.id;
    // @ts-ignore
    const loggedInUserRole = req.user?.role;
    const logPrefix = `[${controllerStartTime.toISOString()}] updatePayment (ID: ${paymentId}):`;
    console.log(`${logPrefix} Update attempt by User ID: ${loggedInUserId}, Role: ${loggedInUserRole}`);
    if (!paymentId) { return res.status(400).json({ message: 'Payment ID is required in URL.' }); }
    if (amountPaid === undefined && paymentMethod === undefined && paymentMonth === undefined && paymentYear === undefined && paymentDate === undefined) { return res.status(400).json({ message: 'No update data provided.' }); }
    try {
        const existingPayment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!existingPayment) { return res.status(404).json({ message: 'Payment record not found.' }); }
        // Use actual Enum or consistent string for comparison
        const isAdmin = loggedInUserRole === UserRole.Admin || loggedInUserRole === 'admin';
        const isRecorder = existingPayment.recordedById === loggedInUserId;
        if (!isAdmin && !isRecorder) { console.log(`${logPrefix} Authorization FAILED.`); return res.status(403).json({ message: 'Forbidden: Not authorized to update this payment.' }); }
         console.log(`${logPrefix} Authorization PASSED.`);
        const updateData: { amountPaid?: number; paymentMethod?: PaymentMethod; paymentMonth?: number; paymentYear?: number; paymentDate?: Date; } = {};
        if (amountPaid !== undefined) { const amount = Number(amountPaid); if (isNaN(amount) || amount <= 0) { return res.status(400).json({ message: 'Invalid amount.' }); } updateData.amountPaid = amount; }
        if (paymentMethod !== undefined) { if (!(paymentMethod in PaymentMethod)) { return res.status(400).json({ message: `Invalid paymentMethod.` }); } updateData.paymentMethod = paymentMethod as PaymentMethod; }
        if (paymentMonth !== undefined) { const month = Number(paymentMonth); if (isNaN(month) || month < 1 || month > 12) { return res.status(400).json({ message: 'Invalid month.' }); } updateData.paymentMonth = month; }
        if (paymentYear !== undefined) { const year = Number(paymentYear); if (isNaN(year) || year < 2000 || year > 2099) { return res.status(400).json({ message: 'Invalid year.' }); } updateData.paymentYear = year; }
        if (paymentDate !== undefined && paymentDate !== null && paymentDate !== '') { const dateObj = new Date(paymentDate); if (isNaN(dateObj.getTime())) { return res.status(400).json({ message: 'Invalid date.' }); } updateData.paymentDate = dateObj; }
        const updatedPayment = await prisma.payment.update({ where: { id: paymentId }, data: updateData });
        res.status(200).json(updatedPayment);
    } catch (error: any) { // @ts-ignore
         if (error.code === 'P2025') { return res.status(404).json({ message: 'Payment not found.' }); } console.error(`${logPrefix} Prisma Error updating:`, error); res.status(500).json({ message: 'Error updating payment' }); }
};

// --- DELETE a Payment Record --- (No changes needed)
export const deletePayment = async (req: Request, res: Response) => { /* ... existing code ... */
    const controllerStartTime = new Date();
    const { paymentId } = req.params;
    // @ts-ignore
    const loggedInUserId = req.user?.id;
    // @ts-ignore
    const loggedInUserRole = req.user?.role;
    const logPrefix = `[${controllerStartTime.toISOString()}] deletePayment (ID: ${paymentId}):`;
    console.log(`${logPrefix} Delete attempt by User ID: ${loggedInUserId}, Role: ${loggedInUserRole}`);
    if (!paymentId) { return res.status(400).json({ message: 'Payment ID required.' }); }
    try {
        const existingPayment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!existingPayment) { return res.status(404).json({ message: 'Payment not found.' }); }
         // Use actual Enum or consistent string for comparison
        const isAdmin = loggedInUserRole === UserRole.Admin || loggedInUserRole === 'admin';
        const isRecorder = existingPayment.recordedById === loggedInUserId;
        if (!isAdmin && !isRecorder) { console.log(`${logPrefix} Authorization FAILED.`); return res.status(403).json({ message: 'Forbidden: Not authorized to delete.' }); }
         console.log(`${logPrefix} Authorization PASSED.`);
        await prisma.payment.delete({ where: { id: paymentId } });
        console.log(`${logPrefix} Prisma delete successful.`);
        res.status(204).send();
    } catch (error: any) { // @ts-ignore
         if (error.code === 'P2025') { return res.status(404).json({ message: 'Payment not found.' }); } console.error(`${logPrefix} Prisma Error deleting:`, error); res.status(500).json({ message: 'Error deleting payment' }); }
};

// --- Admin Recording Payment --- (Removed internal role check) ---
export const recordPaymentByAdmin = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    const logPrefix = `[${controllerStartTime.toISOString()}] recordPaymentByAdmin:`;
    const { memberId, amountPaid, paymentMethod, paymentMonth, paymentYear, paymentDate } = req.body;
    // @ts-ignore - Role verified by restrictTo middleware
    const loggedInUserIdFromToken = req.user?.id; // ID from token (should be correct CUID now)
    // @ts-ignore
    const loggedInUserRole = req.user?.role;

    console.log(`${logPrefix} Reached controller. User Token ID: ${loggedInUserIdFromToken}, Role: ${loggedInUserRole}`);
    console.log(`${logPrefix} Request Body:`, req.body);

    // ** REMOVED internal role check -> rely on restrictTo('admin') middleware on the route **
    // if (loggedInUserRole !== 'admin') { return res.status(403).json({ message: 'Forbidden: Only Admin allowed.' }); }

    if (!loggedInUserIdFromToken){ return res.status(401).json({ message: 'Authorization error (Admin ID missing from token)' }); }

    // Validate request body data
    if (!memberId || !amountPaid || !paymentMethod || !paymentMonth || !paymentYear) { return res.status(400).json({ message: 'Missing required fields' }); }
    if (!(paymentMethod in PaymentMethod)) { return res.status(400).json({ message: `Invalid paymentMethod.` }); }
    const amount = Number(amountPaid); const month = Number(paymentMonth); const year = Number(paymentYear);
    if (isNaN(amount) || amount <= 0 || isNaN(month) || month < 1 || month > 12 || isNaN(year) || year < 2000 || year > 2100) { return res.status(400).json({ message: 'Invalid amount, month, or year.' }); }
    let paymentDateObj = new Date(); if (paymentDate) { try { paymentDateObj = new Date(paymentDate); if(isNaN(paymentDateObj.getTime())) throw new Error();} catch { return res.status(400).json({ message: 'Invalid paymentDate format.' });} }

    try {
        // Find the Admin User record in the DB using the ID from the token to ensure it's valid
        const adminUser = await prisma.user.findUnique({ where: { id: loggedInUserIdFromToken } });
        if (!adminUser) { console.error(`${logPrefix} CRITICAL: Admin user record with ID '${loggedInUserIdFromToken}' not found in database.`); return res.status(401).json({ message: 'Admin user record not found in database.' }); }
        const actualAdminDbId = adminUser.id; // This is the correct CUID
        console.log(`${logPrefix} Found Admin DB ID: ${actualAdminDbId}`);

        // Verify Member exists
        const member = await prisma.member.findUnique({ where: { id: memberId } });
        if (!member) { return res.status(404).json({ message: 'Member not found.' }); }

        // Check for Existing Payment
        const existingPayment = await prisma.payment.findFirst({ where: { memberId: memberId, paymentMonth: month, paymentYear: year } });
        if (existingPayment) { return res.status(409).json({ message: `Payment for ${month}/${year} already recorded.` }); }

        // Create payment record using the ACTUAL Admin DB ID
        const newPayment = await prisma.payment.create({
            data: { amountPaid: amount, paymentDate: paymentDateObj, paymentMonth: month, paymentYear: year, paymentMethod: paymentMethod as PaymentMethod, memberId: memberId, recordedById: actualAdminDbId }
        });
        console.log(`${logPrefix} Payment recorded successfully by ADMIN (DB ID: ${actualAdminDbId}) for member ${memberId}: ID=${newPayment.id}`);
        res.status(201).json(newPayment);
    } catch (error: any) {
        console.error(`${logPrefix} Prisma Error recording payment by admin:`, error);
        if (error.code === 'P2003') { return res.status(500).json({ message: 'Database error: Failed to link payment to recorder.' }); }
        res.status(500).json({ message: 'Error recording payment' });
    }
}; // End recordPaymentByAdmina