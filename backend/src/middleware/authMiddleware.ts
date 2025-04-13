// backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Define a custom property 'user' on Express Request type (optional but good practice)
// Create a types folder/file (e.g., src/types/express/index.d.ts) if you want cleaner typing:
/*
declare global {
    namespace Express {
        interface Request {
            user?: { id: string; role: string; }; // Define the shape of user data attached to req
        }
    }
}
*/
// For simplicity now, we'll use // @ts-ignore or assertion

interface JwtPayload {
    id: string;
    role: string;
    iat?: number;
    exp?: number;
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        console.error("JWT_SECRET not defined in environment variables.");
        return res.status(500).json({ message: 'Server configuration error (JWT Secret missing)' });
    }

    // 1. Check if token exists in headers (Authorization: Bearer TOKEN)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 2. Get token from header
            token = req.headers.authorization.split(' ')[1];
            console.log(`[${new Date().toISOString()}] Middleware: Token found.`);

            // 3. Verify token
            const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
            console.log(`[${new Date().toISOString()}] Middleware: Token verified. Payload:`, decoded);

            // 4. Attach user info to the request object for later use
            // Find user based on decoded.id if needed (we only need role now)
            // For now, just attach decoded payload
            // @ts-ignore (or define custom Request type)
            req.user = { id: decoded.id, role: decoded.role };

            next(); // Token is valid, proceed to the next middleware/controller

        } catch (error: any) {
            console.error(`[${new Date().toISOString()}] Middleware: Token verification failed:`, error.message || error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        console.log(`[${new Date().toISOString()}] Middleware: No token found in header.`);
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to restrict access to specific roles
export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
         // @ts-ignore (or define custom Request type)
        const userRole = req.user?.role;

        console.log(`[${new Date().toISOString()}] Middleware: Checking role. User role: ${userRole}, Allowed roles: ${roles}`);

        if (!userRole || !roles.includes(userRole)) {
             console.log(`[${new Date().toISOString()}] Middleware: Role restriction failed.`);
            return res.status(403).json({ message: 'You do not have permission to perform this action' }); // 403 Forbidden
        }

        console.log(`[${new Date().toISOString()}] Middleware: Role check passed.`);
        next(); // Role is allowed, proceed
    };
};