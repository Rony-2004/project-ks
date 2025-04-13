// backend/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Instantiate PrismaClient
const prisma = new PrismaClient({
    // Optional: Add logging configuration for development
    log: ['query', 'info', 'warn', 'error'],
});

// Export the single instance
export default prisma;