import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes by verifying JWT token in headers or cookies
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header (Bearer <token>)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback check for token in HTTP-only cookie
  else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token provided'));
  }

  try {
    // Verify token payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch active user from database without returning password hash
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      return next(new Error('The user belonging to this token no longer exists'));
    }

    next();
  } catch (error) {
    res.status(401);
    return next(new Error('Not authorized, token failed validation'));
  }
};

/**
 * Role-based access control middleware
 * @param  {...string} roles Allowed user roles ('admin', 'user', etc.)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(`User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this route`)
      );
    }
    next();
  };
};
