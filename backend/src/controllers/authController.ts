// backend/src/controllers/authController.ts (Plaintext Password Check - As Requested)
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
// No bcrypt needed for this version
// import bcrypt from 'bcrypt';

dotenv.config();

// --- ADMIN LOGIN HANDLER ---
export const adminLoginHandler = (req: Request, res: Response) => { // Removed async
    const controllerStartTime = new Date();
    console.log(`[${controllerStartTime.toISOString()}] --- Received POST ${process.env.API_PREFIX || '/api'}/auth/admin/login ---`);

    const { userId, password } = req.body;
    console.log(`[${controllerStartTime.toISOString()}] Request Body: userId=${userId}, password=${password ? '******' : undefined}`);

    // 1. Validate Input
    if (!userId || !password) {
        console.log(`[${controllerStartTime.toISOString()}] Validation Failed: Missing userId or password.`);
        return res.status(400).json({ message: 'User ID and Password are required' });
    }

    // 2. Get & Validate Environment Variables
    console.log(`[${controllerStartTime.toISOString()}] Checking environment variables...`);
    const adminUserId = process.env.ADMIN_USERID;
    const adminPassword = process.env.ADMIN_PASSWORD; // <<<--- Reading Plaintext Password
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';

    let configError = false;
    if (!adminUserId) { console.error(`[${controllerStartTime.toISOString()}] FATAL ERROR: ADMIN_USERID missing`); configError = true; }
    if (!adminPassword) { console.error(`[${controllerStartTime.toISOString()}] FATAL ERROR: ADMIN_PASSWORD missing`); configError = true; } // <<<--- Checking for Plaintext Password variable
    if (!jwtSecret) { console.error(`[${controllerStartTime.toISOString()}] FATAL ERROR: JWT_SECRET missing`); configError = true; }

    if (configError) {
        return res.status(500).json({ message: 'Server configuration error. Check .env file.' });
    }
    console.log(`[${controllerStartTime.toISOString()}] Environment variables seem OK.`);

    // 3. Authenticate User (Direct String Comparison - INSECURE!)
    console.log(`[${controllerStartTime.toISOString()}] Comparing credentials (plaintext)...`);
    const credentialsMatch = (userId === adminUserId && password === adminPassword); // <<<--- Direct Comparison

    if (credentialsMatch) {
        console.log(`[${controllerStartTime.toISOString()}] Credentials MATCH for user: ${userId}`);
        // 4. Generate JWT Token
        try {
            const payload = { id: userId, role: 'admin' };
            console.log(`[${controllerStartTime.toISOString()}] Attempting to sign JWT token (Expires: ${jwtExpiresIn})...`);
            const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
            console.log(`[${controllerStartTime.toISOString()}] JWT token signed successfully.`);
            // 5. Send Success Response
            const responseBody = { token: token, message: 'Admin login successful' };
            console.log(`[${controllerStartTime.toISOString()}] Sending SUCCESS response (200): ${JSON.stringify(responseBody)}`);
            return res.status(200).json(responseBody); // Return ends the function execution
        } catch (jwtError: any) {
            console.error(`[${controllerStartTime.toISOString()}] !!! JWT Signing Error:`, jwtError.message || jwtError);
            return res.status(500).json({ message: 'Error generating session token' });
        }
    } else {
        // Credentials DO NOT MATCH
        console.log(`[${controllerStartTime.toISOString()}] Credentials DO NOT MATCH for user: ${userId}`);
        return res.status(401).json({ message: 'Invalid User ID or Password' });
    }
}; // End of adminLoginHandler

// --- GET Admin Profile ('/me') ---
export const getAdminProfile = async (req: Request, res: Response) => {
    // @ts-ignore
    const loggedInUserId = req.user?.id;
    // @ts-ignore
    const loggedInUserRole = req.user?.role;
    console.log(`[${new Date().toISOString()}] GET ${process.env.API_PREFIX || '/api'}/auth/admin/me requested by user: ${loggedInUserId}`);
    if (loggedInUserRole !== 'admin' || loggedInUserId !== process.env.ADMIN_USERID) {
        return res.status(403).json({ message: 'Forbidden: Not the correct admin user' });
    }
    try {
        const adminProfile = { id: process.env.ADMIN_USERID, name: "Admin", email: "admin@example.com", role: 'admin' };
        res.status(200).json(adminProfile);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error fetching admin profile:`, error);
        res.status(500).json({ message: 'Error fetching profile data' });
    }
};

// --- UPDATE Admin Profile ('/me') ---
export const updateAdminProfile = async (req: Request, res: Response) => {
    // @ts-ignore
    const loggedInUserId = req.user?.id;
    // @ts-ignore
    const loggedInUserRole = req.user?.role;
    const { name, email } = req.body;
    console.log(`[${new Date().toISOString()}] PUT ${process.env.API_PREFIX || '/api'}/auth/admin/me requested by user: ${loggedInUserId} with data:`, req.body);
    if (loggedInUserRole !== 'admin' || loggedInUserId !== process.env.ADMIN_USERID) {
        return res.status(403).json({ message: 'Forbidden: Not the correct admin user' });
    }
    if (!name && !email) { return res.status(400).json({ message: 'No update data provided (name or email)' }); }
    try {
        console.log(`[${new Date().toISOString()}] SIMULATING update for admin ID: ${loggedInUserId}. New data -> Name: ${name || '(no change)'}, Email: ${email || '(no change)'}`);
        const updatedProfile = { id: loggedInUserId, name: name || " Admin", email: email || "admin@example.com", role: 'admin' };
        res.status(200).json(updatedProfile);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error updating admin profile:`, error);
        res.status(500).json({ message: 'Error updating profile data' });
    }
};

// Add areaAdminLoginHandler etc. here if needed later