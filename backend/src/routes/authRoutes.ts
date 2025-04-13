// backend/src/routes/authRoutes.ts
import express from 'express';
import {
    adminLoginHandler,
    getAdminProfile,    // <-- Import new handler
    updateAdminProfile  // <-- Import new handler
} from '../controllers/authController';
import { protect, restrictTo } from '../middleware/authMiddleware'; // Import middleware

const router = express.Router();

// --- Public Auth Routes ---
router.post('/admin/login', adminLoginHandler);
// router.post('/area-admin/login', areaAdminLoginHandler); // Add later

// --- Protected Profile Routes ---
// All routes below require a valid token (checked by 'protect')
router.use(protect);

// Specific routes for the logged-in admin ('/api/auth/admin/me')
router.route('/admin/me')
    .get(restrictTo('admin'), getAdminProfile)      // Only Admin can get their profile
    .put(restrictTo('admin'), updateAdminProfile);     // Only Admin can update their profile

// Maybe add a general '/me' route later for any logged-in user?
// router.get('/me', getLoggedInUserProfile);

export default router;