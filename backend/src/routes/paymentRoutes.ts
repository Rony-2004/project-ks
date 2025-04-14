// backend/src/routes/paymentRoutes.ts (FIXED)
import express from 'express';
import { recordPayment } from '../controllers/paymentController';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { UserRole } from '@prisma/client'; // <-- ADD THIS IMPORT

const router = express.Router();

// Protect all payment routes defined below
router.use(protect); // Must be logged in

// Define POST route for recording payments
// Only Area Admins can access this specific route
// Now UserRole.AreaAdmin can be correctly referenced
router.post('/', restrictTo(UserRole.AreaAdmin), recordPayment);

// Add other payment routes later (e.g., GET payments for admin/area-admin)
// router.get('/', restrictTo(UserRole.Admin, UserRole.AreaAdmin), getAllPayments);

export default router;