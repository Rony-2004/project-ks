// backend/src/routes/paymentRoutes.ts
// ** Added import for getPayments and new GET / route **

import express from 'express';
import {
    recordPayment,
    getPaymentsForAreaAdmin,
    getAllPayments,
    updatePayment,
    deletePayment,
    getPayments // <-- *** ADD Import for the new controller function ***
} from '../controllers/paymentController'; // Verify path
import { protect, restrictTo } from '../middleware/authMiddleware'; // Verify path

const router = express.Router();

// --- Apply protect middleware to ALL payment routes below ---
router.use(protect);

// --- Define Routes ---

// *** ADD THIS NEW ROUTE ***
// Handles GET /api/payments?memberId=... (and potentially other filters later)
router.get('/', restrictTo('admin'), getPayments);
// *** END ADDED ROUTE ***

// GET /api/payments/all - Get ALL payments (Admin only) - Can potentially be merged with '/' later
router.get('/all', restrictTo('admin'), getAllPayments);

// POST /api/payments - Record a new payment (Area Admin only) - Stays specific
router.post('/', restrictTo('areaAdmin'), recordPayment);

// GET /api/payments/my-area - Get payments recorded by logged-in Area Admin
router.get('/my-area', restrictTo('areaAdmin'), getPaymentsForAreaAdmin);

// Routes for operating on a specific payment by its ID
router.route('/:paymentId')
    .put(restrictTo('admin', 'areaAdmin'), updatePayment)
    .delete(restrictTo('admin', 'areaAdmin'), deletePayment);


export default router;