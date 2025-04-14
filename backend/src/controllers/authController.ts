// backend/src/controllers/authController.ts (MODIFIED - Added Area Admin Login)

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
// --- ADD/Ensure these imports exist ---
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { UserRole } from '@prisma/client';
// --- End Imports ---

dotenv.config();

// --- ADMIN LOGIN HANDLER (Keep your existing plaintext version) ---
export const adminLoginHandler = (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    console.log(`[${controllerStartTime.toISOString()}] --- Received POST ${process.env.API_PREFIX || '/api'}/auth/admin/login ---`);
    const { userId, password } = req.body;
    console.log(`[${controllerStartTime.toISOString()}] Request Body: userId=${userId}, password=${password ? '******' : undefined}`);
    // ... rest of your existing plaintext admin login logic ...
    // ... (find adminUserId, adminPassword from env) ...
    // ... (check configError) ...
    console.log(`[${controllerStartTime.toISOString()}] Comparing credentials (plaintext)...`);
    const credentialsMatch = (userId === process.env.ADMIN_USERID && password === process.env.ADMIN_PASSWORD); // Direct Compare
    if (credentialsMatch) {
      // ... sign token, return 200 ...
      try {
           const payload = { id: userId, role: 'admin' };
           const jwtSecret = process.env.JWT_SECRET!; // Added ! assuming check passed
           const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';
           console.log(`[${controllerStartTime.toISOString()}] Attempting to sign JWT token (Expires: ${jwtExpiresIn})...`);
           const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
           console.log(`[${controllerStartTime.toISOString()}] JWT token signed successfully.`);
           const responseBody = { token: token, message: 'Admin login successful' };
           console.log(`[${controllerStartTime.toISOString()}] Sending SUCCESS response (200): ${JSON.stringify(responseBody)}`);
           return res.status(200).json(responseBody);
       } catch (jwtError: any) {
           console.error(`[${controllerStartTime.toISOString()}] !!! JWT Signing Error:`, jwtError.message || jwtError);
           return res.status(500).json({ message: 'Error generating session token' });
       }
    } else {
       // ... return 401 ...
        console.log(`[${controllerStartTime.toISOString()}] Credentials DO NOT MATCH for user: ${userId}`);
        return res.status(401).json({ message: 'Invalid User ID or Password' });
    }
}; // End of adminLoginHandler


// --- GET Admin Profile ('/me') (Keep your existing version) ---
export const getAdminProfile = async (req: Request, res: Response) => { /* ... Your existing code ... */ };

// --- UPDATE Admin Profile ('/me') (Keep your existing version) ---
export const updateAdminProfile = async (req: Request, res: Response) => { /* ... Your existing code ... */};


// --- **NEW** AREA ADMIN LOGIN HANDLER ---
// This function uses async/await because bcrypt.compare is asynchronous
export const areaAdminLoginHandler = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    console.log(`[${controllerStartTime.toISOString()}] --- Received POST ${process.env.API_PREFIX || '/api'}/auth/area-admin/login ---`);

    // Area Admins log in with email and password
    const { email, password } = req.body;
    console.log(`[${controllerStartTime.toISOString()}] Request Body: email=${email}, password=${password ? '******' : undefined}`);

    // 1. Validate Input
    if (!email || !password) {
        console.log(`[${controllerStartTime.toISOString()}] Validation Failed: Missing email or password.`);
        return res.status(400).json({ message: 'Email and Password are required' });
    }

    // 2. Get JWT Config (Secret should exist from Admin login check)
    console.log(`[${controllerStartTime.toISOString()}] Checking JWT environment variables...`);
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';
    if (!jwtSecret) {
        console.error(`[${controllerStartTime.toISOString()}] FATAL ERROR: JWT_SECRET missing`);
        return res.status(500).json({ message: 'Server configuration error (JWT)' });
    }
    console.log(`[${controllerStartTime.toISOString()}] JWT environment variables OK.`);


    // 3. Find Area Admin User in Database via Prisma
    console.log(`[${controllerStartTime.toISOString()}] Finding user by email: ${email}...`);
    try {
        const user = await prisma.user.findUnique({
            where: { email: email } // Find user by email
        });

        // Check if user exists AND specifically has the 'AreaAdmin' role
        if (!user || user.role !== UserRole.AreaAdmin) {
            console.log(`[${controllerStartTime.toISOString()}] User not found or not an Area Admin for email: ${email}`);
            // Return generic error for security
            return res.status(401).json({ message: 'Invalid Email or Password' });
        }
        console.log(`[${controllerStartTime.toISOString()}] Found Area Admin user: ${user.id}. Comparing password hash...`);

        // 4. Compare submitted password with stored hash using bcrypt
        const passwordMatches = await bcrypt.compare(password, user.passwordHash);

        if (passwordMatches) {
            console.log(`[${controllerStartTime.toISOString()}] Password MATCH for Area Admin: ${user.id}`);
            // 5. Generate JWT Token for Area Admin
            try {
                const payload = { id: user.id, role: user.role }; // role will be 'AreaAdmin'
                console.log(`[${controllerStartTime.toISOString()}] Attempting to sign Area Admin JWT token (Expires: ${jwtExpiresIn})...`);
                const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
                console.log(`[${controllerStartTime.toISOString()}] JWT token signed successfully.`);
                // 6. Send Success Response
                const responseBody = { token: token, message: 'Area Admin login successful' };
                console.log(`[${controllerStartTime.toISOString()}] Sending Area Admin SUCCESS response (200)`);
                return res.status(200).json(responseBody);

            } catch (jwtError: any) {
                console.error(`[${controllerStartTime.toISOString()}] !!! JWT Signing Error:`, jwtError.message || jwtError);
                return res.status(500).json({ message: 'Error generating session token' });
            }
        } else {
            // Passwords DO NOT MATCH
            console.log(`[${controllerStartTime.toISOString()}] Password MISMATCH for Area Admin: ${user.id}`);
            return res.status(401).json({ message: 'Invalid Email or Password' });
        }
    } catch (error: any) {
         console.error(`[${controllerStartTime.toISOString()}] !!! Error during Area Admin login process:`, error);
         // Could be Prisma error or other unexpected issue
         return res.status(500).json({ message: 'Error during authentication' });
    }
}; // <<<--- End of areaAdminLoginHandler