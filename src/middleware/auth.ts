import { NextFunction, Response } from 'express';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { RequestAuth } from '../../types/index';

/**
 * @description Middleware function to authenticate users based on JWT tokens.
 * It checks for the presence of a Bearer token in the `Authorization` header,
 * verifies the token, and attaches the decoded user information to the request object.
 * If the token is missing or invalid, it responds with an authentication error.
 *
 * @param {RequestAuth} req - The request object, which will be augmented with user information if authentication is successful.
 * @param {Response} res - The response object used to send the authentication error response if needed.
 * @param {NextFunction} next - The next middleware function to be called if authentication is successful.
 *
 * @returns {Promise<void>} - A promise that resolves to void. If authentication is successful, the next middleware function is called. Otherwise, an error is passed to the next middleware.
 */
const auth = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists and starts with Bearer
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    res.status(401).json({
      error: 'Authentication invalid',
      message: 'No token provided or incorrect token format',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the token with more detailed options
    const tokenVerified = jwt.verify(
      token,
      process.env.TOKEN_SECRET as string,
      {
        // Optional: Add clock tolerance for minor time discrepancies
        clockTolerance: 30,
      }
    ) as JwtPayload;

    // Attach user information to the request
    req.user = { ...tokenVerified };
    next();
  } catch (error) {
    // Specific handling for different JWT verification errors
    if (error instanceof TokenExpiredError) {
      res.status(401).json({
        error: 'Token Expired',
        message: 'Your session has expired. Please log in again.',
        // Optionally include additional context
        expiredAt: (error as TokenExpiredError).expiredAt,
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Invalid Token',
        message: 'The provided token is invalid.',
      });
    } else {
      // Catch-all for any other unexpected errors
      res.status(500).json({
        error: 'Authentication Error',
        message: 'An unexpected error occurred during authentication.',
      });
    }
  }
};

export default auth;
