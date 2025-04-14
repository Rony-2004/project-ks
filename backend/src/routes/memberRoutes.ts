// backend/src/routes/memberRoutes.ts (VERIFIED)
import express from 'express';
import { getAllMembers, createMember, updateMember, deleteMember } from '../controllers/memberController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();
router.use(protect); // Apply login check to all

// GET is allowed for both roles (controller filters)
router.get('/', restrictTo('admin', 'areaAdmin'), getAllMembers);

// POST, PUT, DELETE only for Admin
router.post('/', restrictTo('admin'), createMember);
router.route('/:id')
    .put(restrictTo('admin'), updateMember)
    .delete(restrictTo('admin'), deleteMember);

export default router;