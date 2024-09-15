import { NextFunction, Request, Response } from 'express';
import {
  DatabaseConnectionError,
  InvalidPasswordError,
  NotFoundError,
  NoUsersError,
  UserAlreadyExistsError,
  UserCreationError,
  UserDeletionError,
  UserNotFoundError,
  UserUpdateError,
} from './error_handler';

const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }

  if (err instanceof UserNotFoundError) {
    return res.status(404).json({ error: err.message });
  }

  if (err instanceof NoUsersError) {
    return res.status(404).json({ error: err.message });
  }

  if (err instanceof InvalidPasswordError) {
    console.log('invalid password error');
    return res.status(401).json({ error: err.message });
  }

  if (err instanceof UserAlreadyExistsError) {
    return res.status(409).json({ error: err.message });
  }

  if (err instanceof DatabaseConnectionError) {
    return res.status(500).json({ error: err.message });
  }

  if (err instanceof UserCreationError) {
    return res.status(500).json({ error: err.message });
  }

  if (err instanceof UserUpdateError) {
    return res.status(500).json({ error: err.message });
  }

  if (err instanceof UserDeletionError) {
    return res.status(500).json({ error: err.message });
  }

  // Handle any other errors that were not caught explicitly
  return res.status(500).json({ error: err.message });

  next();
};

export default globalErrorHandler;
