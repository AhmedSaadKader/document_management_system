import { Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { RequestAuth } from '../../types';

export const getCurrentUser = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.json({
      uid: user.user_id,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const uid = req.user?.user_id;

    if (!uid) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Delete user from Firebase Authentication
    await admin.auth().deleteUser(uid);

    res.json({ message: 'User successfully deleted' });
  } catch (error) {
    next(error);
  }
};
