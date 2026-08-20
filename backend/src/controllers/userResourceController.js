import UserResource from '../models/UserResource.js';

/**
 * @desc    Get all items owned by the authenticated user ONLY
 * @route   GET /api/user-data
 * @access  Private
 */
export const getMyData = async (req, res, next) => {
  try {
    // CRITICAL: Filter by req.user._id to ensure data isolation!
    const userItems = await UserResource.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: userItems.length,
      data: userItems,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new data item owned by the authenticated user
 * @route   POST /api/user-data
 * @access  Private
 */
export const createMyData = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      res.status(400);
      return next(new Error('Title is required'));
    }

    // Automatically bind the current authenticated user's ID
    const item = await UserResource.create({
      user: req.user._id,
      title,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a data item (only if owned by current user)
 * @route   DELETE /api/user-data/:id
 * @access  Private
 */
export const deleteMyData = async (req, res, next) => {
  try {
    const item = await UserResource.findById(req.params.id);

    if (!item) {
      res.status(404);
      return next(new Error('Item not found'));
    }

    // Security Check: Verify item owner matches logged in user ID
    if (item.user.toString() !== req.user._id.toString()) {
      res.status(403);
      return next(new Error('Forbidden: You can only delete your own data'));
    }

    await item.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Item removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
