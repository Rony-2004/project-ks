// src/routes/authRoutes.ts
import express from 'express';
import { adminLoginHandler } from '../controllers/authController'; // Import the handler

const router = express.Router();

// Define the route: POST request to /api/auth/admin/login will use adminLoginHandler
router.post('/admin/login', adminLoginHandler);

// Add other auth routes later (e.g., area admin login)

export default router;