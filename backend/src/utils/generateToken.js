import jwt from 'jsonwebtoken';

/**
 * Generates a JSON Web Token for an authenticated user ID
 *
 * @param {string} userId - User document ID
 * @returns {string} Signed JWT token
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || '', /** @type {any} */({
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  }));
};

/**
 * Helper to attach JWT as a secure, HTTP-only cookie on response
 *
 * @param {import('express').Response} res - Express response object
 * @param {string} token - Signed JWT token
 */
export const sendTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true, // Prevents XSS attacks by disallowing browser JS access
    secure: isProduction, // HTTPS only in production
    sameSite: /** @type {any} */('strict'), // Protects against CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };

  res.cookie('jwt', token, cookieOptions);
};
