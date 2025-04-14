// backend/src/controllers/paymentController.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma'; // Import Prisma Client
import { PaymentMethod, UserRole } from '@prisma/client'; // Import Enums

export const recordPayment = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    console.log(`[${controllerStartTime.toISOString()}] --- Received POST ${process.env.API_PREFIX || '/api'}/payments ---`);

    // Get payment details from request body
    const {
        memberId,       // ID of the member who paid
        amountPaid,     // Amount received
        paymentMethod,  // 'Cash' or 'Online'
        paymentMonth,   // e.g., 1 for Jan, 12 for Dec
        paymentYear,    // e.g., 2024
        paymentDate     // Optional: Date received (e.g., "YYYY-MM-DD"), defaults to now if not sent
    } = req.body;

    // Get the logged-in Area Admin's ID from the request object (set by 'protect' middleware)
    // @ts-ignore
    const areaAdminId = req.user?.id;
    // @ts-ignore
    const userRole = req.user?.role;

    console.log(`[${controllerStartTime.toISOString()}] Request Body:`, req.body);
    console.log(`[${controllerStartTime.toISOString()}] Recorded by Area Admin ID: ${areaAdminId}`);

    // --- Validation ---
    if (!areaAdminId || userRole !== UserRole.AreaAdmin) {
        return res.status(403).json({ message: 'Forbidden: Only Area Admins can record payments.' });
    }
    if (!memberId || !amountPaid || !paymentMethod || !paymentMonth || !paymentYear) {
        return res.status(400).json({ message: 'Missing required fields (memberId, amountPaid, paymentMethod, paymentMonth, paymentYear)' });
    }
    // Validate payment method Enum
    if (!(paymentMethod in PaymentMethod)) {
         return res.status(400).json({ message: `Invalid paymentMethod. Must be one of: ${Object.keys(PaymentMethod).join(', ')}` });
    }
    // Validate numeric types
    const amount = Number(amountPaid);
    const month = Number(paymentMonth);
    const year = Number(paymentYear);
    if (isNaN(amount) || amount <= 0 || isNaN(month) || month < 1 || month > 12 || isNaN(year) || year < 2000 || year > 2100) {
         return res.status(400).json({ message: 'Invalid amount, month, or year provided.' });
    }
    // Validate date if provided, otherwise use current date
    let paymentDateObj = new Date(); // Default to now
    if (paymentDate) {
        paymentDateObj = new Date(paymentDate);
        if (isNaN(paymentDateObj.getTime())) {
            return res.status(400).json({ message: 'Invalid paymentDate format provided. Use YYYY-MM-DD.' });
        }
    }
    // --- End Validation ---


    try {
        // --- Authorization Check: Verify Member belongs to this Area Admin ---
        console.log(`[${controllerStartTime.toISOString()}] Verifying member assignment... MemberID: ${memberId}, AreaAdminID: ${areaAdminId}`);
        const member = await prisma.member.findFirst({
            where: {
                id: memberId,
                assignedAreaAdminId: areaAdminId // Check if member is assigned to the logged-in Area Admin
            }
        });

        if (!member) {
            console.log(`[${controllerStartTime.toISOString()}] Forbidden: Member ${memberId} not found or not assigned to Area Admin ${areaAdminId}.`);
            return res.status(403).json({ message: 'You are not authorized to record payments for this member.' });
        }
        console.log(`[${controllerStartTime.toISOString()}] Member assignment verified.`);
        // --- End Authorization Check ---


        // Create the payment record in the database
        console.log(`[${controllerStartTime.toISOString()}] Creating payment record in DB...`);
        const newPayment = await prisma.payment.create({
            data: {
                amountPaid: amount,
                paymentDate: paymentDateObj,
                paymentMonth: month,
                paymentYear: year,
                paymentMethod: paymentMethod as PaymentMethod, // Cast to enum type
                memberId: memberId,          // Link to the member
                recordedById: areaAdminId    // Link to the area admin who recorded it
            }
        });

        console.log(`[${controllerStartTime.toISOString()}] Payment recorded successfully: ID=${newPayment.id}`);
        res.status(201).json(newPayment); // Respond with the created payment record

    } catch (error: any) {
        console.error(`[${controllerStartTime.toISOString()}] Prisma Error recording payment:`, error);
        res.status(500).json({ message: 'Error recording payment' });
    }
};