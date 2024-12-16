import { Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { RequestAuth } from '../../types';

const firebaseAuth = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer')) {
    res.status(401).json({
      error: 'Authentication invalid',
      message: 'No token provided or incorrect token format',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token, true);

    req.user = {
      user_id: decodedToken.uid,
      email: decodedToken.email || '',
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ID token has expired')) {
        res.status(401).json({
          error: 'Token Expired',
          message: 'Your session has expired. Please log in again.',
        });
      } else {
        res.status(401).json({
          error: 'Authentication Error',
          message: 'Invalid Firebase token',
          details: error.message,
        });
      }
    } else {
      res.status(500).json({
        error: 'Unexpected Error',
        message: 'An unexpected error occurred during authentication.',
      });
    }
  }
};

export default firebaseAuth;
