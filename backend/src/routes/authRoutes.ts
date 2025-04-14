// backend/src/routes/authRoutes.ts (MODIFIED)
import express from 'express';
import {
    adminLoginHandler,
    getAdminProfile,
    updateAdminProfile,
    areaAdminLoginHandler // <-- 1. Import the new handler
} from '../controllers/authController'; // Verify controller path
import { protect, restrictTo } from '../middleware/authMiddleware'; // Verify middleware path

const router = express.Router();

// --- Public Auth Routes (These run BEFORE the 'protect' middleware) ---
router.post('/admin/login', adminLoginHandler);
router.post('/area-admin/login', areaAdminLoginHandler); // <-- 2. Add/Uncomment this route

// --- Protected Routes ---
// All routes defined BELOW this line will first run the 'protect' middleware
router.use(protect);

// Specific routes for the logged-in admin ('/api/auth/admin/me')
// These require a valid token (from protect) AND the 'admin' role (from restrictTo)
router.route('/admin/me')
    .get(restrictTo('admin'), getAdminProfile)
    .put(restrictTo('admin'), updateAdminProfile);

// Add other PROTECTED auth-related routes here later if needed

export default router;