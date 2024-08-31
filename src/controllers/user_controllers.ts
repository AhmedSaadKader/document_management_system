import { NextFunction, Request, Response } from 'express';
import { UserModel } from '../models/user';
import { createJWT } from '../utils/jwt_utils';
import {
  UserAlreadyExistsError,
  UserLoginError,
} from '../middleware/error_handler';
import { RequestAuth } from '../../types';

const user = new UserModel();

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const allUsers = await user.index();
    res.json(allUsers);
  } catch (err) {
    next(err);
  }
};

export const getUserData = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.params;
    const userData = await user.emailExists(email);
    res.json(userData);
  } catch (err) {
    next(err);
  }
};

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { national_id, first_name, last_name, email, password, role } =
    req.body;
  try {
    if (await user.emailExists(email)) {
      res.status(409).json({
        error: 'Email already exists',
      });
      next(new UserAlreadyExistsError(email));
    }
    const newUser = await user.create({
      national_id,
      first_name,
      last_name,
      email,
      password,
      role,
    });
    const token = createJWT(
      newUser.national_id,
      newUser.email,
      newUser.first_name,
      newUser.last_name
    );
    res.json({
      token,
      email: newUser.email,
      national_id: newUser.national_id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new UserLoginError(email);
  }
  try {
    const createdUser = await user.authenticateUser(email, password);
    const token = createJWT(
      createdUser.national_id,
      createdUser.email,
      createdUser.first_name,
      createdUser.last_name
    );
    res.json({
      token,
      email: createdUser.email,
      national_id: createdUser.national_id,
      first_name: createdUser.first_name,
      last_name: createdUser.last_name,
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
    const email = req.user?.email as string;
    const getUser = await user.emailExists(req.params.email);
    if (email !== getUser?.email) {
      throw new Error('Unauthorized to delete this user');
    }
    const deletedUser = await user.delete(req.params.email);
    res.json(deletedUser);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const email = req.user?.email as string;
    const userId = req.params.id;
    const getUser = await user.emailExists(email);
    if (userId !== getUser?.national_id) {
      throw new Error('Unauthorized to edit this user');
    }
    const newEmail = req.body.email;
    if (!newEmail || newEmail === getUser?.email) {
      throw new Error('Please provide a new email');
    }
    if (await user.emailExists(newEmail)) {
      throw new Error('email already in use. Please provide a new email');
    }
    const updateUser = await user.update();
    res.json(updateUser);
  } catch (error) {
    res.status(400);
    next(error);
  }
};
