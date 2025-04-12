// backend/src/controllers/authController.ts (Ensure it uses process.env)
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
// import bcrypt from 'bcrypt'; // Keep commented out for now

// Ensure dotenv is configured early (usually in server.ts is enough, but doesn't hurt here)
dotenv.config();

export const adminLoginHandler = async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] --- Received POST ${process.env.API_PREFIX || '/api'}/auth/admin/login ---`); // Updated log

    const { userId, password } = req.body;
    console.log(`[<span class="math-inline">\{new Date\(\)\.toISOString\(\)\}\] Request Body\: userId\=</span>{userId}, password=${password ? '******' : undefined}`);

    // 1. Validate Input
    if (!userId || !password) {
        console.log(`[${new Date().toISOString()}] Validation Failed: Missing userId or password.`);
        return res.status(400).json({ message: 'User ID and Password are required' });
    }

    // 2. Get Values from Environment Variables
    console.log(`[${new Date().toISOString()}] Checking environment variables...`);
    const adminUserId = process.env.ADMIN_USERID;
    const adminPassword = process.env.ADMIN_PASSWORD; // INSECURE!
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d'; // Default expiry

    // Explicitly check each required variable
    if (!adminUserId) { console.error(`[${new Date().toISOString()}] FATAL ERROR: ADMIN_USERID not found in .env`); return res.status(500).json({ message: 'Server config error (AID)' }); }
    if (!adminPassword) { console.error(`[${new Date().toISOString()}] FATAL ERROR: ADMIN_PASSWORD not found in .env`); return res.status(500).json({ message: 'Server config error (APW)' }); } // Adjust check when using hash
    if (!jwtSecret) { console.error(`[${new Date().toISOString()}] FATAL ERROR: JWT_SECRET not found in .env`); return res.status(500).json({ message: 'Server config error (JWT)' }); }
    console.log(`[${new Date().toISOString()}] Environment variables seem OK.`);

    // 3. Authenticate User (INSECURE COMPARISON - Replace with bcrypt later)
    console.log(`[${new Date().toISOString()}] Comparing credentials...`);
    const credentialsMatch = (userId === adminUserId && password === adminPassword);

    if (credentialsMatch) {
        console.log(`[${new Date().toISOString()}] Credentials MATCH for user: ${userId}`);
        // 4. Generate JWT Token
        try {
            const payload = { id: userId, role: 'admin' };
            console.log(`[${new Date().toISOString()}] Attempting to sign JWT token...`);
            const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
            console.log(`[${new Date().toISOString()}] JWT token signed successfully.`);
            // 5. Send Success Response
            return res.status(200).json({ token: token, message: 'Admin login successful' });
        } catch (jwtError: any) {
            console.error(`[${new Date().toISOString()}] !!! JWT Signing Error:`, jwtError.message || jwtError);
            return res.status(500).json({ message: 'Error generating session token' });
        }
    } else {
        console.log(`[${new Date().toISOString()}] Credentials DO NOT MATCH for user: ${userId}`);
        return res.status(401).json({ message: 'Invalid User ID or Password' });
    }
};

// Define areaAdminLoginHandler later...