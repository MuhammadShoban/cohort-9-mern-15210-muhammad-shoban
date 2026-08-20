import mongoose from 'mongoose';

/**
 * Establishes connection to MongoDB database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
  } catch (error) {
    console.error(`Failed to connect to MongoDB: ${error.message}`);
    // Exit process with failure code if initial database connection fails
    process.exit(1);
  }
};

export default connectDB;
