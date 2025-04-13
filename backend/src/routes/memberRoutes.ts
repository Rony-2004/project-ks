// backend/src/routes/memberRoutes.ts
import express from 'express';
import {
    getAllMembers,
    createMember,
    updateMember,
    deleteMember
} from '../controllers/memberController';
import { protect, restrictTo } from '../middleware/authMiddleware'; // Import middleware

const router = express.Router();

// Apply middleware to protect ALL member routes below
// Only logged-in Admins can manage members via these routes
router.use(protect);
router.use(restrictTo('admin'));

// Route for GET all members and POST new member
router.route('/')
    .get(getAllMembers)
    .post(createMember);

// Route for specific member operations by ID
router.route('/:id')
    // .get(getMemberById) // Add later if needed
    .put(updateMember)
    .delete(deleteMember);

// Add routes for assigning members later if needed
// Example: router.put('/:id/assign', assignMemberToAreaAdmin);

export default router;