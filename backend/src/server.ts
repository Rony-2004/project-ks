// backend/src/server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import areaAdminRoutes from './routes/areaAdminRoutes';
import memberRoutes from './routes/memberRoutes';
import paymentRoutes from './routes/paymentRoutes'; // <-- Import Payment routes

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;
const API_PREFIX = process.env.API_PREFIX || '/api';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/area-admins`, areaAdminRoutes);
app.use(`${API_PREFIX}/members`, memberRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes); // <-- Use Payment routes
console.log(`Payment routes mounted at ${API_PREFIX}/payments`); // Log mounting

// Test Route
app.get('/', (req: Request, res: Response) => { res.send('Backend is Running!'); });

// Start Server
app.listen(PORT, () => { console.log(`Backend server running on http://localhost:${PORT}`); });