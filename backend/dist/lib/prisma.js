"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/lib/prisma.ts
const client_1 = require("@prisma/client");
// Instantiate PrismaClient
const prisma = new client_1.PrismaClient({
    // Optional: Add logging configuration for development
    log: ['query', 'info', 'warn', 'error'],
});
// Export the single instance
exports.default = prisma;
