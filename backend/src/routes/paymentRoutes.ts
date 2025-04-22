// backend/src/routes/paymentRoutes.ts
// ** Added import for recordPaymentByAdmin and new POST /by-admin route **

import express from 'express';
import {
    recordPayment,
    getPaymentsForAreaAdmin,
    getAllPayments,
    updatePayment,
    deletePayment,
    getPayments,
    recordPaymentByAdmin // <-- *** ADD Import for the new Admin recording function ***
} from '../controllers/paymentController'; // Verify path
import { protect, restrictTo } from '../middleware/authMiddleware'; // Verify path

const router = express.Router();

// --- Apply protect middleware to ALL payment routes below ---
router.use(protect);

// --- Define Routes ---

// GET /api/payments?memberId=... (For Admin to get specific member payments)
router.get('/', restrictTo('admin'), getPayments);

// GET /api/payments/all - Get ALL payments (Admin only)
router.get('/all', restrictTo('admin'), getAllPayments);

// *** ADD THIS NEW ROUTE for Admin recording payment ***
// POST /api/payments/by-admin - Admin records a payment for any member
router.post('/by-admin', restrictTo('admin'), recordPaymentByAdmin);
// *** END ADDED ROUTE ***

// POST /api/payments - Record a new payment (Area Admin only) - Keep original separate
router.post('/', restrictTo('areaAdmin'), recordPayment);

// GET /api/payments/my-area - Get payments recorded by logged-in Area Admin
router.get('/my-area', restrictTo('areaAdmin'), getPaymentsForAreaAdmin);

// Routes for operating on a specific payment by its ID
router.route('/:paymentId')
    .put(restrictTo('admin', 'areaAdmin'), updatePayment)
    .delete(restrictTo('admin', 'areaAdmin'), deletePayment);


export default router;