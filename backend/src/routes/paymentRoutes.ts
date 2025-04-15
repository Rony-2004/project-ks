// backend/src/routes/paymentRoutes.ts (ADDED PUT and DELETE routes)
import express from 'express';
import {
    recordPayment,
    getPaymentsForAreaAdmin,
    updatePayment,           // <-- Import update handler
    deletePayment            // <-- Import delete handler
} from '../controllers/paymentController'; // Verify path
import { protect, restrictTo } from '../middleware/authMiddleware'; // Verify path

const router = express.Router();

// --- Apply protect middleware to ALL payment routes below ---
// User must be logged in for any payment action
router.use(protect);

// --- Define Routes ---

// POST /api/payments - Record a new payment (Area Admin only)
router.post('/', restrictTo('areaAdmin'), recordPayment);

// GET /api/payments/my-area - Get payments recorded by logged-in Area Admin
router.get('/my-area', restrictTo('areaAdmin'), getPaymentsForAreaAdmin);

// **NEW** Routes for operating on a specific payment by its ID
router.route('/:paymentId') // Use a parameter name like :paymentId
    // PUT /api/payments/:paymentId - Update a specific payment (Area Admin only)
    .put(restrictTo('areaAdmin'), updatePayment)

    // DELETE /api/payments/:paymentId - Delete a specific payment (Area Admin only)
    .delete(restrictTo('areaAdmin'), deletePayment);

// Add GET / route for Admin later if needed
// router.get('/', restrictTo('admin'), getAllPaymentsAdmin);

export default router;