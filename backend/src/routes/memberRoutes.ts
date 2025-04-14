// backend/src/routes/memberRoutes.ts (VERIFIED)
import express from 'express';
import {
    getAllMembers,
    createMember,
    updateMember,
    deleteMember
} from '../controllers/memberController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Apply middleware to protect ALL member routes below
router.use(protect);
// Allow ONLY admin to Create, Update, Delete members via these routes for now
router.use(restrictTo('admin')); // Use lowercase string 'admin'

// Route for GET all members (filtered by controller) and POST new member
router.route('/')
    .get(getAllMembers) // Controller handles role filtering
    .post(createMember); // Restricted to admin by middleware above

// Route for specific member operations by ID
router.route('/:id')
    // .get(getMemberById) // Restricted to admin
    .put(updateMember)    // Restricted to admin
    .delete(deleteMember); // Restricted to admin

export default router;