// backend/src/server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes'; // Import the auth routes

// Load .env variables **very early**
dotenv.config();

const app = express();

// Read Port from .env, default to 5001 if not found
const PORT = process.env.PORT || 5001;
// Read API Prefix from .env, default to /api if not found
const API_PREFIX = process.env.API_PREFIX || '/api';

// Middleware - ORDER MATTERS
app.use(cors()); // 1. Enable CORS
app.use(express.json()); // 2. Parse JSON body
app.use(express.urlencoded({ extended: true })); // 3. Parse URL-encoded body

// Use Routes - Prefixed with value from .env
// Example: Will mount auth routes at /api/auth/...
app.use(`${API_PREFIX}/auth`, authRoutes);
console.log(`Auth routes mounted at ${API_PREFIX}/auth`); // Log route mounting

// Add other API routes later using API_PREFIX
// Example: app.use(`${API_PREFIX}/members`, memberRoutes);

// Test Route
app.get('/', (req: Request, res: Response) => {
    res.send('Backend is Running!');
});

// Start Server on the configured port
app.listen(PORT, () => {
    // Log the actual port being used
    console.log(`Backend server running on http://localhost:${PORT}`);
});