import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

/** @type {string|number} */
const PORT = process.env.PORT || 5000;

/** @type {import('http').Server|null} */
let server = null;

/**
 * Boots the server by establishing a database connection first,
 * then starting the Express HTTP listener.
 * @returns {Promise<void>}
 */
const bootstrap = async () => {
  try {
    // Wait for MongoDB connection to complete successfully
    await connectDB();

    server = app.listen(PORT, () => {
      logger.info(
        { port: PORT, env: process.env.NODE_ENV || 'development' },
        'Server started successfully'
      );
    });
  } catch (error) {
    logger.fatal({ err: error }, `Server bootstrap failure: ${error.message}`);
    process.exit(1);
  }
};

// Start the server bootstrap process
bootstrap();

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  const errorMsg = err instanceof Error ? err.message : String(err);
  logger.error({ err }, `Unhandled Rejection Error: ${errorMsg}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});
