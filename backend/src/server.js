import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

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
      console.log(
        `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(`Server bootstrap failure: ${error.message}`);
    process.exit(1);
  }
};

// Start the server bootstrap process
bootstrap();

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  const errorMsg = err instanceof Error ? err.message : String(err);
  console.error(`Unhandled Rejection Error: ${errorMsg}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});
