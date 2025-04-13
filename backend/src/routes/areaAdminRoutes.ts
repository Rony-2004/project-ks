// backend/src/routes/areaAdminRoutes.ts
import express from 'express';
import {
    getAllAreaAdmins,
    createAreaAdmin,
    deleteAreaAdmin, // <-- Import delete handler
    updateAreaAdmin   // <-- Import update handler
} from '../controllers/areaAdminController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Apply middleware to ALL routes in this file
router.use(protect);
router.use(restrictTo('admin'));

// Routes for /api/area-admins
router.route('/')
    .get(getAllAreaAdmins)
    .post(createAreaAdmin);

// **NEW** Routes for /api/area-admins/:id
router.route('/:id')
    // .get(getAreaAdminById) // Add later if needed
    .put(updateAreaAdmin)    // Handle PUT requests for updates
    .delete(deleteAreaAdmin); // Handle DELETE requests

export default router;