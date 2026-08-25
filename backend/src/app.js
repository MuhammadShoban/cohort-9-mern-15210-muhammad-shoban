import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';

import authRoutes from './routes/authRoutes.js';
import userResourceRoutes from './routes/userResourceRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import statusRoutes from './routes/status.routes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import logger from './utils/logger.js';

/** @type {import('express').Application} */
const app = express();

// Enable Pino HTTP Logging Middleware
app.use(
  pinoHttp({
    logger,
    // Custom serializers to keep logs clean and secure
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url ? req.url.split('?')[0] : '',
        headers: {
          host: req.headers.host,
          'user-agent': req.headers['user-agent'],
        },
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  })
);

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
app.use('/api/notes', noteRoutes);
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
