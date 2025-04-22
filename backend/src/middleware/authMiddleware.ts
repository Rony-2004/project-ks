// backend/src/middleware/authMiddleware.ts
// ** CORRECTED restrictTo Function **

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
// Optional: import prisma from '../lib/prisma'; // Not strictly needed here

dotenv.config();

// Extend Express Request type (Keep as is)
declare global { namespace Express { interface Request { user?: { id: string; role: string; }; } } } export {};

interface JwtPayload { id: string; role: string; iat?: number; exp?: number; }

// --- protect Middleware (Keep As Is) ---
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
            // Ensure decoded.role exists before attaching
            if (!decoded.id || !decoded.role) {
                 console.error(`[Protect Middleware] Token payload missing id or role.`);
                 return res.status(401).json({ message: 'Not authorized, invalid token payload' });
            }
            req.user = { id: decoded.id, role: decoded.role }; // Attach user
            console.log("[Protect Middleware] Attached req.user:", req.user);
            next(); // Proceed
        } catch (error: any) { console.error(`[Protect Middleware] Token verification FAILED:`, error.message || error); return res.status(401).json({ message: 'Not authorized, token failed' }); }
    } else {
         console.log(`[Protect Middleware] No token found in Authorization header.`);
         return res.status(401).json({ message: 'Not authorized, no token' });
    }
};


// --- *** CORRECTED restrictTo Function *** ---
export const restrictTo = (...allowedRoles: string[]) => { // Changed param name for clarity
    return (req: Request, res: Response, next: NextFunction) => {
        // @ts-ignore - User object attached by protect middleware
        const userRole = req.user?.role; // e.g., 'Admin' or 'AreaAdmin' from Token

        // Convert allowed roles to lowercase ONCE for efficient checking
        const lowerCaseAllowedRoles = allowedRoles.map(role => role.toLowerCase());

        // Convert user's role from token to lowercase for comparison
        const lowerCaseUserRole = userRole?.toLowerCase();

        // ** Corrected Logging **
        console.log(`[Restrict Middleware] Checking role. User role: '${userRole}' (checking as '${lowerCaseUserRole}'), Allowed roles: [${lowerCaseAllowedRoles.join(', ')}]`);

        // ** Corrected Case-Insensitive Check **
        // Check if a user role exists and if its lowercase version is included in the lowercase allowed roles array
        if (!lowerCaseUserRole || !lowerCaseAllowedRoles.includes(lowerCaseUserRole)) {
             console.log(`[Restrict Middleware] Role restriction FAILED!`);
            // Use 403 Forbidden status code for authorization failures
            return res.status(403).json({
                message: `Forbidden: Your role ('${userRole}') is not authorized to access this resource.`
            });
        }

        // If the check passes:
        console.log(`[Restrict Middleware] Role check PASSED.`);
        next(); // User has one of the allowed roles, proceed to the next middleware/controller
    };
};
// --- *** END CORRECTED restrictTo Function *** ---