// backend/src/middleware/authMiddleware.ts (VERIFIED EXPORTS)
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
// Optional: import prisma from '../lib/prisma';

dotenv.config();

// Extend Express Request type (Optional but recommended)
declare global { namespace Express { interface Request { user?: { id: string; role: string; }; } } } export {};

interface JwtPayload { id: string; role: string; iat?: number; exp?: number; }

// --- Ensure 'export' is here ---
export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;
    const jwtSecret = process.env.JWT_SECRET;
    console.log(`[Protect Middleware] Running for URL: ${req.originalUrl}`);

    if (!jwtSecret) { console.error("[Protect Middleware] JWT_SECRET not defined."); return res.status(500).json({ message: 'Server config error (JWT)' }); }

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log(`[Protect Middleware] Token found. Verifying...`);
            const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
            console.log("[Protect Middleware] Decoded JWT Payload:", decoded);
            req.user = { id: decoded.id, role: decoded.role }; // Attach user
            console.log("[Protect Middleware] Attached req.user:", req.user);
            next(); // Proceed
        } catch (error: any) { console.error(`[Protect Middleware] Token verification FAILED:`, error.message || error); return res.status(401).json({ message: 'Not authorized, token failed' }); }
    } else {
         console.log(`[Protect Middleware] No token found in Authorization header.`);
         return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// --- Ensure 'export' is here ---
export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;
        console.log(`[Restrict Middleware] Checking role. User role: '<span class="math-inline">\{userRole\}', Allowed roles\: \[</span>{roles.join(', ')}]`);
        if (!userRole || !roles.includes(userRole)) {
             console.log(`[Restrict Middleware] Role restriction FAILED!`);
            return res.status(403).json({ message: 'You do not have permission.' });
        }
        console.log(`[Restrict Middleware] Role check PASSED.`);
        next();
    };
};