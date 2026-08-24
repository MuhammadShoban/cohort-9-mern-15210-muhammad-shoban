import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import userResourceRoutes from './routes/userResourceRoutes.js';
import statusRoutes from './routes/status.routes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

/** @type {import('express').Application} */
const app = express();

// Security & Body parsing Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true, // Allow cookies over cross-origin requests
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Server is Running fine .........' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user-data', userResourceRoutes);
app.use('/api', statusRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;
