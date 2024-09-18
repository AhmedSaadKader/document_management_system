import { NextFunction, Request, Response } from 'express';
import {
  DatabaseConnectionError,
  InvalidPasswordError,
  NotFoundError,
  NoUsersError,
  OTPExpiredError,
  OTPInvalidError,
  UserAlreadyExistsError,
  UserCreationError,
  UserDeletionError,
  UserNotFoundError,
  UserUpdateError,
} from './error_handler';

/**
 * @description Global error handling middleware for Express applications.
 * This middleware catches errors thrown during request processing and sends
 * appropriate HTTP responses based on the type of error. It differentiates
 * between various types of errors and responds with corresponding HTTP status codes.
 * If the error type is not explicitly handled, it responds with a generic 500 Internal Server Error.
 *
 * @param {Error} err - The error object representing the error that occurred.
 * @param {Request} req - The request object representing the HTTP request.
 * @param {Response} res - The response object used to send the HTTP response.
 * @param {NextFunction} next - The next middleware function in the request-response cycle.
 *
 * @returns {void} - This function does not return a value. It sends an HTTP response based on the error type.
 */
const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
  }

  if (err instanceof UserNotFoundError) {
    res.status(404).json({ error: err.message });
  }

  if (err instanceof NoUsersError) {
    res.status(404).json({ error: err.message });
  }

  if (err instanceof InvalidPasswordError) {
    res.status(401).json({ error: err.message });
  }

  if (err instanceof UserAlreadyExistsError) {
    res.status(409).json({ error: err.message });
  }

  if (err instanceof OTPExpiredError) {
    res.status(400).json({ message: 'OTP has expired' });
  }

  if (err instanceof OTPInvalidError) {
    res.status(400).json({ message: 'Invalid OTP' });
  }

  if (err instanceof DatabaseConnectionError) {
    res.status(500).json({ error: err.message });
  }

  if (err instanceof UserCreationError) {
    res.status(500).json({ error: err.message });
  }

  if (err instanceof UserUpdateError) {
    res.status(500).json({ error: err.message });
  }

  if (err instanceof UserDeletionError) {
    res.status(500).json({ error: err.message });
  }
  if (res.headersSent) {
    return next(err);
  }
  console.error(err.stack);

  // Handle any other errors that were not caught explicitly
  res.status(500).json({ error: err.message });
};

export default globalErrorHandler;
