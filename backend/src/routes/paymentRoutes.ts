// backend/src/routes/paymentRoutes.ts
// ** PASTE THIS ENTIRE FILE CONTENT **
import express from 'express';
import {
    recordPayment,
    getPaymentsForAreaAdmin,
    getAllPayments,       // <-- Import Admin handler
    updatePayment,
    deletePayment
} from '../controllers/paymentController'; // Verify path
import { protect, restrictTo } from '../middleware/authMiddleware'; // Verify path

const router = express.Router();

// --- Apply protect middleware to ALL payment routes below ---
// User must be logged in for any payment action
router.use(protect);

// --- Define Routes ---

// GET /api/payments/all - Get ALL payments (Admin only)
router.get('/all', restrictTo('admin'), getAllPayments); // <-- ** ADD THIS ROUTE **

// POST /api/payments - Record a new payment (Area Admin only)
router.post('/', restrictTo('areaAdmin'), recordPayment);

// GET /api/payments/my-area - Get payments recorded by logged-in Area Admin
router.get('/my-area', restrictTo('areaAdmin'), getPaymentsForAreaAdmin);

// Routes for operating on a specific payment by its ID
router.route('/:paymentId')
    // PUT /api/payments/:paymentId - Update a specific payment (Admin OR Area Admin who recorded it)
    .put(restrictTo('admin', 'areaAdmin'), updatePayment) // <-- ** ALLOW 'admin' **

    // DELETE /api/payments/:paymentId - Delete a specific payment (Admin OR Area Admin who recorded it)
    .delete(restrictTo('admin', 'areaAdmin'), deletePayment); // <-- ** ALLOW 'admin' **


export default router;