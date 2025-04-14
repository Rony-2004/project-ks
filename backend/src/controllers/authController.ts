// backend/src/controllers/authController.ts (Admin Plaintext, AreaAdmin Hashed)
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'; // Needed for Area Admin login check
import prisma from '../lib/prisma';
import { UserRole } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// --- ADMIN LOGIN HANDLER (Plaintext Check) ---
export const adminLoginHandler = (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    console.log(`[${controllerStartTime.toISOString()}] --- Received POST ${process.env.API_PREFIX || '/api'}/auth/admin/login ---`);
    const { userId, password } = req.body;
    console.log(`[${controllerStartTime.toISOString()}] Request Body: userId=${userId}, password=${password ? '******' : undefined}`);

    if (!userId || !password) { return res.status(400).json({ message: 'User ID and Password required' }); }

    console.log(`[${controllerStartTime.toISOString()}] Checking environment variables...`);
    const adminUserId = process.env.ADMIN_USERID;
    const adminPassword = process.env.ADMIN_PASSWORD; // Using Plaintext from .env
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';

    if (!adminUserId || !adminPassword || !jwtSecret) { // Check for ADMIN_PASSWORD
        console.error(`[${controllerStartTime.toISOString()}] AdminLogin: FAIL - Server config error (Check ADMIN_USERID, ADMIN_PASSWORD, JWT_SECRET in .env)`);
        return res.status(500).json({ message: 'Server configuration error.' });
    }
    console.log(`[${controllerStartTime.toISOString()}] Environment variables OK.`);

    console.log(`[${controllerStartTime.toISOString()}] Comparing credentials (plaintext)...`);
    // Direct Comparison (INSECURE)
    const credentialsMatch = (userId === adminUserId && password === adminPassword);

    if (credentialsMatch) {
        console.log(`[${controllerStartTime.toISOString()}] Credentials MATCH for admin user: ${userId}`);
        try { // Generate JWT
            // Use lowercase 'admin' string for role in token payload
            const payload = { id: userId, role: 'admin' };
            console.log(">>> [AdminLogin] Signing JWT with payload:", payload);
            const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
            console.log(`[${controllerStartTime.toISOString()}] AdminLogin: Token signed.`);
            return res.status(200).json({ token: token, message: 'Admin login successful' });
        } catch (jwtError: any) {
             console.error(`[${controllerStartTime.toISOString()}] AdminLogin: FAIL - JWT Signing Error:`, jwtError);
             return res.status(500).json({ message: 'Error generating token' });
        }
    } else {
        console.log(`[${controllerStartTime.toISOString()}] AdminLogin: FAIL - Credentials mismatch.`);
        return res.status(401).json({ message: 'Invalid User ID or Password' });
    }
}; // End adminLoginHandler


// --- AREA ADMIN LOGIN HANDLER (Uses Hashed Password from DB) ---
export const areaAdminLoginHandler = async (req: Request, res: Response) => {
    const controllerStartTime = new Date();
    console.log(`[${controllerStartTime.toISOString()}] --- Received POST ${process.env.API_PREFIX || '/api'}/auth/area-admin/login ---`);
    const { email, password } = req.body;
    console.log(`[${controllerStartTime.toISOString()}] Request Body: email=${email}, password=${password ? '******' : undefined}`);

    if (!email || !password) { /* ... validation ... */ return res.status(400).json({ message: 'Email and Password required' }); }

    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';
    if (!jwtSecret) { /* ... config check ... */ return res.status(500).json({ message: 'Server config error.' }); }
    console.log(`[${controllerStartTime.toISOString()}] AreaAdminLogin: JWT config OK.`);

    console.log(`[${controllerStartTime.toISOString()}] AreaAdminLogin: Finding user by email: ${email}...`);
    try {
        const user = await prisma.user.findUnique({ where: { email: email } });

        if (!user || user.role !== UserRole.AreaAdmin) {
             console.log(`[${controllerStartTime.toISOString()}] AreaAdminLogin: User not found or not AreaAdmin.`);
             return res.status(401).json({ message: 'Invalid Email or Password' });
        }
        console.log(`[${controllerStartTime.toISOString()}] AreaAdminLogin: Found Area Admin: ${user.id}. Comparing hash...`);

        // Compare submitted password with stored hash using bcrypt
        const passwordMatches = await bcrypt.compare(password, user.passwordHash);

        if (passwordMatches) {
            console.log(`[${controllerStartTime.toISOString()}] AreaAdminLogin: Password MATCH.`);
            try { // Generate JWT
                // Use lowercase 'areaAdmin' string for role in token payload
                const payload = { id: user.id, role: 'areaAdmin' };
                console.log(">>> [AreaAdminLogin] Signing JWT with payload:", payload);
                const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
                console.log(`[${controllerStartTime.toISOString()}] AreaAdminLogin: Token signed.`);
                return res.status(200).json({ token: token, message: 'Area Admin login successful' });
            } catch (jwtError: any) { /* ... JWT error handling ... */ return res.status(500).json({ message: 'Error generating token' }); }
        } else {
            console.log(`[${controllerStartTime.toISOString()}] AreaAdminLogin: Password MISMATCH.`);
            return res.status(401).json({ message: 'Invalid Email or Password' });
        }
    } catch (error: any) { /* ... Error handling ... */ return res.status(500).json({ message: 'Authentication error' }); }
}; // End areaAdminLoginHandler


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
        // Returning static/env data as main admin isn't stored in DB yet
        const adminProfile = {
            id: process.env.ADMIN_USERID,
            name: "Main Admin", // Hardcoded
            email: "admin@example.com", // Hardcoded
            role: 'admin'
        };
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
        // SIMULATING update as main admin isn't in DB yet
        console.log(`[${new Date().toISOString()}] SIMULATING update for admin ID: ${loggedInUserId}. New data -> Name: ${name || '(no change)'}, Email: ${email || '(no change)'}`);
        const updatedProfile = {
            id: loggedInUserId,
            name: name || "Main Admin",
            email: email || "admin@example.com",
            role: 'admin'
        };
        res.status(200).json(updatedProfile);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error updating admin profile:`, error);
        res.status(500).json({ message: 'Error updating profile data' });
    }
};