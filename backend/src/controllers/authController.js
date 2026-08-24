import User from '../models/User.js';
import { generateToken, sendTokenCookie } from '../utils/generateToken.js';

/**
 * @desc    Register a new user (Signup)
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Basic validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      name.trim().length === 0 ||
      name.length > 50 ||
      email.trim().length === 0 ||
      !emailRegex.test(email.trim()) ||
      password.length < 6
    ) {
      res.status(400);
      return next(new Error('Please provide name, email, and password'));
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(400);
      return next(new Error('User with this email already exists'));
    }

    // 3. Create user in database (password is automatically hashed by pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    // 4. Generate JWT token
    const token = generateToken(user._id);

    // 5. Send token in secure HTTP-only cookie
    sendTokenCookie(res, token);

    // 6. Return response
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      email.trim().length === 0 ||
      password.length === 0 ||
      !emailRegex.test(email.trim())
    ) {
      res.status(400);
      return next(new Error('Please provide email and password'));
    }

    // 2. Find user by email and explicitly select password hash
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    // 3. Compare entered password with stored hashed password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    // 4. Generate JWT token
    const token = generateToken(user._id);

    // 5. Send HTTP-only cookie
    sendTokenCookie(res, token);

    // 6. Return response
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the `protect` auth middleware
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log user out & clear token cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logoutUser = async (req, res, next) => {
  try {
    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0), // Expire immediately
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
