// backend/src/routes/paymentRoutes.ts (VERIFY THIS CODE)
import express from 'express';
import { recordPayment } from '../controllers/paymentController'; // Verify path
import { protect, restrictTo } from '../middleware/authMiddleware'; // Verify path
// Removed UserRole import as we use strings now
// import { UserRole } from '@prisma/client';

const router = express.Router();

// Protect all payment routes defined below
router.use(protect); // Must be logged in

// Define POST route for recording payments
// Only Area Admins can access this specific route
// Ensure 'areaAdmin' is lowercase string
router.post('/', restrictTo('areaAdmin'), recordPayment); // <-- Check this line carefully

// Add other payment routes later
// router.get('/', restrictTo('admin', 'areaAdmin'), getAllPayments);

export default router;