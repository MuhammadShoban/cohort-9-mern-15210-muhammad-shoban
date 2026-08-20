import mongoose from 'mongoose';

/**
 * Example Model showing how user data isolation is enforced.
 * Every document is strictly bound to a specific user via ObjectId reference.
 */
const userResourceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Indexed for fast queries filtered by user ID
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

const UserResource = mongoose.model('UserResource', userResourceSchema);

export default UserResource;
