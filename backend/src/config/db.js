import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Establishes connection to MongoDB database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info({ host: conn.connection.host }, 'MongoDB Connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error({ err }, `MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });
  } catch (error) {
    logger.fatal({ err: error }, `Failed to connect to MongoDB: ${error.message}`);
    throw error;
  }
};

export default connectDB;
