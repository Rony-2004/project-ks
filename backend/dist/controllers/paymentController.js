"use strict";
// backend/src/controllers/paymentController.ts
// ** Removed redundant role check from recordPaymentByAdmin **
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordPaymentByAdmin = exports.deletePayment = exports.updatePayment = exports.getPayments = exports.getAllPayments = exports.getPaymentsForAreaAdmin = exports.recordPayment = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
// --- Record Payment (Area Admin) --- (No changes)
const recordPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const controllerStartTime = new Date();
    const logPrefix = `[${controllerStartTime.toISOString()}] recordPayment:`;
    const { memberId, amountPaid, paymentMethod, paymentMonth, paymentYear, paymentDate } = req.body;
    // @ts-ignore
    const loggedInUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    // @ts-ignore
    const loggedInUserRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    if (!loggedInUserId) {
        return res.status(401).json({ message: 'Authorization error' });
    }
    // Ensure role check here uses Enum or consistent string if UserRole enum isn't directly on req.user
    if (loggedInUserRole !== client_1.UserRole.AreaAdmin && loggedInUserRole !== 'areaAdmin') {
        return res.status(403).json({ message: 'Forbidden: Only Area Admins allowed.' });
    }
    if (!memberId || !amountPaid || !paymentMethod || !paymentMonth || !paymentYear) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!(paymentMethod in client_1.PaymentMethod)) {
        return res.status(400).json({ message: `Invalid paymentMethod.` });
    }
    const amount = Number(amountPaid);
    const month = Number(paymentMonth);
    const year = Number(paymentYear);
    if (isNaN(amount) || amount <= 0 || isNaN(month) || month < 1 || month > 12 || isNaN(year) || year < 2000 || year > 2100) {
        return res.status(400).json({ message: 'Invalid amount, month, or year.' });
    }
    let paymentDateObj = new Date();
    if (paymentDate) {
        try {
            paymentDateObj = new Date(paymentDate);
            if (isNaN(paymentDateObj.getTime()))
                throw new Error();
        }
        catch (_c) {
            return res.status(400).json({ message: 'Invalid paymentDate format.' });
        }
    }
    try {
        const member = yield prisma_1.default.member.findFirst({ where: { id: memberId, assignedAreaAdminId: loggedInUserId } });
        if (!member) {
            return res.status(403).json({ message: 'Not authorized for this member.' });
        }
        const existingPayment = yield prisma_1.default.payment.findFirst({ where: { memberId: memberId, paymentMonth: month, paymentYear: year } });
        if (existingPayment) {
            return res.status(409).json({ message: `Payment for ${month}/${year} already recorded.` });
        }
        const newPayment = yield prisma_1.default.payment.create({ data: { amountPaid: amount, paymentDate: paymentDateObj, paymentMonth: month, paymentYear: year, paymentMethod: paymentMethod, memberId: memberId, recordedById: loggedInUserId } });
        res.status(201).json(newPayment);
    }
    catch (error) {
        console.error(`${logPrefix} Prisma Error recording payment:`, error);
        res.status(500).json({ message: 'Error recording payment' });
    }
});
exports.recordPayment = recordPayment;
// --- GET Payments For Specific Area Admin --- (No changes)
const getPaymentsForAreaAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const controllerStartTime = new Date();
    // @ts-ignore
    const loggedInUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    // @ts-ignore
    const loggedInUserRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    const logPrefix = `[${controllerStartTime.toISOString()}] getPaymentsForAreaAdmin:`;
    // Ensure role check here uses Enum or consistent string
    if (!loggedInUserId || (loggedInUserRole !== client_1.UserRole.AreaAdmin && loggedInUserRole !== 'areaAdmin')) {
        return res.status(403).json({ message: 'Forbidden: Access restricted' });
    }
    try {
        const payments = yield prisma_1.default.payment.findMany({
            where: { recordedById: loggedInUserId },
            include: { member: { select: { name: true, areaId: true, area: { select: { id: true, name: true } } } } },
            orderBy: { paymentDate: 'desc' }
        });
        res.status(200).json(payments);
    }
    catch (error) {
        console.error(`${logPrefix} Prisma Error fetching payments:`, error);
        res.status(500).json({ message: 'Error fetching payment history' });
    }
});
exports.getPaymentsForAreaAdmin = getPaymentsForAreaAdmin;
// --- GET ALL Payments (For Admin Role) --- (Removed internal check)
const getAllPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const controllerStartTime = new Date();
    // @ts-ignore - Role is checked by restrictTo middleware on the route
    const loggedInUserRole = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
    const logPrefix = `[${controllerStartTime.toISOString()}] getAllPayments:`;
    console.log(`${logPrefix} Reached controller. Requested by Role: ${loggedInUserRole}`);
    // ** REMOVED redundant internal role check **
    try {
        console.log(`${logPrefix} Fetching ALL payments for Admin...`);
        const payments = yield prisma_1.default.payment.findMany({
            include: {
                member: { select: { id: true, name: true, monthlyAmount: true, areaId: true, area: { select: { id: true, name: true } } } },
                recordedBy: { select: { id: true, name: true, role: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`${logPrefix} Found ${payments.length} total payments.`);
        res.status(200).json(payments);
    }
    catch (error) {
        console.error(`${logPrefix} Prisma Error fetching all payments:`, error);
        res.status(500).json({ message: 'Error fetching all payment history' });
    }
}); // End getAllPayments
exports.getAllPayments = getAllPayments;
// --- GET Payments (Filtered by memberId) --- (Removed internal check)
const getPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const controllerStartTime = new Date();
    // @ts-ignore
    const loggedInUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    // @ts-ignore
    const loggedInUserRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role; // Role checked by middleware
    const logPrefix = `[${controllerStartTime.toISOString()}] getPayments (Filtered):`;
    const { memberId } = req.query;
    console.log(`${logPrefix} Reached controller. Requested by User: ${loggedInUserId}, Role: ${loggedInUserRole}, Query:`, req.query);
    // ** REMOVED redundant internal role check **
    if (!memberId || typeof memberId !== 'string') {
        return res.status(400).json({ message: 'memberId query parameter is required.' });
    }
    try {
        const whereClause = { memberId: memberId };
        console.log(`${logPrefix} Executing findMany with where clause:`, whereClause);
        const payments = yield prisma_1.default.payment.findMany({
            where: whereClause,
            include: {
                member: { select: { id: true, name: true, monthlyAmount: true, areaId: true, area: { select: { id: true, name: true } } } },
                recordedBy: { select: { id: true, name: true, role: true } }
            },
            orderBy: [{ paymentYear: 'asc' }, { paymentMonth: 'asc' }]
        });
        console.log(`${logPrefix} Found ${payments.length} payments matching memberId: ${memberId}.`);
        res.status(200).json(payments);
    }
    catch (error) {
        console.error(`${logPrefix} Prisma Error fetching payments:`, error);
        res.status(500).json({ message: 'Error fetching payment data' });
    }
}); // End getPayments
exports.getPayments = getPayments;
// --- UPDATE a Payment Record --- (No changes needed)
const updatePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const controllerStartTime = new Date();
    const { paymentId } = req.params;
    const { amountPaid, paymentMethod, paymentMonth, paymentYear, paymentDate } = req.body;
    // @ts-ignore
    const loggedInUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    // @ts-ignore
    const loggedInUserRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    const logPrefix = `[${controllerStartTime.toISOString()}] updatePayment (ID: ${paymentId}):`;
    console.log(`${logPrefix} Update attempt by User ID: ${loggedInUserId}, Role: ${loggedInUserRole}`);
    if (!paymentId) {
        return res.status(400).json({ message: 'Payment ID is required in URL.' });
    }
    if (amountPaid === undefined && paymentMethod === undefined && paymentMonth === undefined && paymentYear === undefined && paymentDate === undefined) {
        return res.status(400).json({ message: 'No update data provided.' });
    }
    try {
        const existingPayment = yield prisma_1.default.payment.findUnique({ where: { id: paymentId } });
        if (!existingPayment) {
            return res.status(404).json({ message: 'Payment record not found.' });
        }
        // Use actual Enum or consistent string for comparison
        const isAdmin = loggedInUserRole === client_1.UserRole.Admin || loggedInUserRole === 'admin';
        const isRecorder = existingPayment.recordedById === loggedInUserId;
        if (!isAdmin && !isRecorder) {
            console.log(`${logPrefix} Authorization FAILED.`);
            return res.status(403).json({ message: 'Forbidden: Not authorized to update this payment.' });
        }
        console.log(`${logPrefix} Authorization PASSED.`);
        const updateData = {};
        if (amountPaid !== undefined) {
            const amount = Number(amountPaid);
            if (isNaN(amount) || amount <= 0) {
                return res.status(400).json({ message: 'Invalid amount.' });
            }
            updateData.amountPaid = amount;
        }
        if (paymentMethod !== undefined) {
            if (!(paymentMethod in client_1.PaymentMethod)) {
                return res.status(400).json({ message: `Invalid paymentMethod.` });
            }
            updateData.paymentMethod = paymentMethod;
        }
        if (paymentMonth !== undefined) {
            const month = Number(paymentMonth);
            if (isNaN(month) || month < 1 || month > 12) {
                return res.status(400).json({ message: 'Invalid month.' });
            }
            updateData.paymentMonth = month;
        }
        if (paymentYear !== undefined) {
            const year = Number(paymentYear);
            if (isNaN(year) || year < 2000 || year > 2099) {
                return res.status(400).json({ message: 'Invalid year.' });
            }
            updateData.paymentYear = year;
        }
        if (paymentDate !== undefined && paymentDate !== null && paymentDate !== '') {
            const dateObj = new Date(paymentDate);
            if (isNaN(dateObj.getTime())) {
                return res.status(400).json({ message: 'Invalid date.' });
            }
            updateData.paymentDate = dateObj;
        }
        const updatedPayment = yield prisma_1.default.payment.update({ where: { id: paymentId }, data: updateData });
        res.status(200).json(updatedPayment);
    }
    catch (error) { // @ts-ignore
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Payment not found.' });
        }
        console.error(`${logPrefix} Prisma Error updating:`, error);
        res.status(500).json({ message: 'Error updating payment' });
    }
});
exports.updatePayment = updatePayment;
// --- DELETE a Payment Record --- (No changes needed)
const deletePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const controllerStartTime = new Date();
    const { paymentId } = req.params;
    // @ts-ignore
    const loggedInUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    // @ts-ignore
    const loggedInUserRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    const logPrefix = `[${controllerStartTime.toISOString()}] deletePayment (ID: ${paymentId}):`;
    console.log(`${logPrefix} Delete attempt by User ID: ${loggedInUserId}, Role: ${loggedInUserRole}`);
    if (!paymentId) {
        return res.status(400).json({ message: 'Payment ID required.' });
    }
    try {
        const existingPayment = yield prisma_1.default.payment.findUnique({ where: { id: paymentId } });
        if (!existingPayment) {
            return res.status(404).json({ message: 'Payment not found.' });
        }
        // Use actual Enum or consistent string for comparison
        const isAdmin = loggedInUserRole === client_1.UserRole.Admin || loggedInUserRole === 'admin';
        const isRecorder = existingPayment.recordedById === loggedInUserId;
        if (!isAdmin && !isRecorder) {
            console.log(`${logPrefix} Authorization FAILED.`);
            return res.status(403).json({ message: 'Forbidden: Not authorized to delete.' });
        }
        console.log(`${logPrefix} Authorization PASSED.`);
        yield prisma_1.default.payment.delete({ where: { id: paymentId } });
        console.log(`${logPrefix} Prisma delete successful.`);
        res.status(204).send();
    }
    catch (error) { // @ts-ignore
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Payment not found.' });
        }
        console.error(`${logPrefix} Prisma Error deleting:`, error);
        res.status(500).json({ message: 'Error deleting payment' });
    }
});
exports.deletePayment = deletePayment;
// --- Admin Recording Payment --- (Removed internal role check) ---
const recordPaymentByAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const controllerStartTime = new Date();
    const logPrefix = `[${controllerStartTime.toISOString()}] recordPaymentByAdmin:`;
    const { memberId, amountPaid, paymentMethod, paymentMonth, paymentYear, paymentDate } = req.body;
    // @ts-ignore - Role verified by restrictTo middleware
    const loggedInUserIdFromToken = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // ID from token (should be correct CUID now)
    // @ts-ignore
    const loggedInUserRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    console.log(`${logPrefix} Reached controller. User Token ID: ${loggedInUserIdFromToken}, Role: ${loggedInUserRole}`);
    console.log(`${logPrefix} Request Body:`, req.body);
    // ** REMOVED internal role check -> rely on restrictTo('admin') middleware on the route **
    // if (loggedInUserRole !== 'admin') { return res.status(403).json({ message: 'Forbidden: Only Admin allowed.' }); }
    if (!loggedInUserIdFromToken) {
        return res.status(401).json({ message: 'Authorization error (Admin ID missing from token)' });
    }
    // Validate request body data
    if (!memberId || !amountPaid || !paymentMethod || !paymentMonth || !paymentYear) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!(paymentMethod in client_1.PaymentMethod)) {
        return res.status(400).json({ message: `Invalid paymentMethod.` });
    }
    const amount = Number(amountPaid);
    const month = Number(paymentMonth);
    const year = Number(paymentYear);
    if (isNaN(amount) || amount <= 0 || isNaN(month) || month < 1 || month > 12 || isNaN(year) || year < 2000 || year > 2100) {
        return res.status(400).json({ message: 'Invalid amount, month, or year.' });
    }
    let paymentDateObj = new Date();
    if (paymentDate) {
        try {
            paymentDateObj = new Date(paymentDate);
            if (isNaN(paymentDateObj.getTime()))
                throw new Error();
        }
        catch (_c) {
            return res.status(400).json({ message: 'Invalid paymentDate format.' });
        }
    }
    try {
        // Find the Admin User record in the DB using the ID from the token to ensure it's valid
        const adminUser = yield prisma_1.default.user.findUnique({ where: { id: loggedInUserIdFromToken } });
        if (!adminUser) {
            console.error(`${logPrefix} CRITICAL: Admin user record with ID '${loggedInUserIdFromToken}' not found in database.`);
            return res.status(401).json({ message: 'Admin user record not found in database.' });
        }
        const actualAdminDbId = adminUser.id; // This is the correct CUID
        console.log(`${logPrefix} Found Admin DB ID: ${actualAdminDbId}`);
        // Verify Member exists
        const member = yield prisma_1.default.member.findUnique({ where: { id: memberId } });
        if (!member) {
            return res.status(404).json({ message: 'Member not found.' });
        }
        // Check for Existing Payment
        const existingPayment = yield prisma_1.default.payment.findFirst({ where: { memberId: memberId, paymentMonth: month, paymentYear: year } });
        if (existingPayment) {
            return res.status(409).json({ message: `Payment for ${month}/${year} already recorded.` });
        }
        // Create payment record using the ACTUAL Admin DB ID
        const newPayment = yield prisma_1.default.payment.create({
            data: { amountPaid: amount, paymentDate: paymentDateObj, paymentMonth: month, paymentYear: year, paymentMethod: paymentMethod, memberId: memberId, recordedById: actualAdminDbId }
        });
        console.log(`${logPrefix} Payment recorded successfully by ADMIN (DB ID: ${actualAdminDbId}) for member ${memberId}: ID=${newPayment.id}`);
        res.status(201).json(newPayment);
    }
    catch (error) {
        console.error(`${logPrefix} Prisma Error recording payment by admin:`, error);
        if (error.code === 'P2003') {
            return res.status(500).json({ message: 'Database error: Failed to link payment to recorder.' });
        }
        res.status(500).json({ message: 'Error recording payment' });
    }
}); // End recordPaymentByAdmina
exports.recordPaymentByAdmin = recordPaymentByAdmin;
