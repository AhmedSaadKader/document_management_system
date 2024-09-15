import { NextFunction, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
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
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    res.status(401).send('Authentication invalid');
  }
  const token = authHeader?.split(' ')[1];
  try {
    const tokenVerified: object = jwt.verify(
      token as string,
      process.env.TOKEN_SECRET as string
    ) as JwtPayload;
    req.user = { ...tokenVerified };
    next();
  } catch (error) {
    next(error);
  }
};

export default auth;
