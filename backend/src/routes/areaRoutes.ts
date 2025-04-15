// backend/src/routes/areaRoutes.ts
import express from 'express';
import {
    getAllAreas,
    createArea,
    updateArea,
    deleteArea
} from '../controllers/areaController'; // Import area controllers
import { protect, restrictTo } from '../middleware/authMiddleware'; // Import middleware

const router = express.Router();

// Apply authentication and ADMIN ONLY restriction to all area routes
router.use(protect);
router.use(restrictTo('admin')); // Only main admin can manage areas

// Define CRUD routes for /api/areas
router.route('/')
    .get(getAllAreas)    // GET /api/areas
    .post(createArea);   // POST /api/areas

// Define CRUD routes for /api/areas/:id
router.route('/:id')
    // GET /api/areas/:id (Add controller later if needed)
    // .get(getAreaById)
    .put(updateArea)     // PUT /api/areas/:id
    .delete(deleteArea); // DELETE /api/areas/:id

export default router;