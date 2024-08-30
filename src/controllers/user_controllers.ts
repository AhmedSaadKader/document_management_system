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
    const { username } = req.params;
    const userData = await user.usernameExists(username);
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
  const {
    national_id,
    first_name,
    last_name,
    username,
    email,
    password,
    role,
  } = req.body;
  try {
    if (await user.usernameExists(username)) {
      res.status(409).json({
        error: 'Username already exists',
      });
      next(new UserAlreadyExistsError(username));
    }
    const newUser = await user.create({
      national_id,
      first_name,
      last_name,
      username,
      email,
      password,
      role,
    });
    const token = createJWT(newUser.national_id, newUser.username);
    res.json({
      token,
      username: newUser.username,
      national_id: newUser.national_id,
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
  const { username, password } = req.body;
  if (!username || !password) {
    throw new UserLoginError(username);
  }
  try {
    const createdUser = await user.authenticateUser(username, password);
    const token = createJWT(createdUser.national_id, createdUser.username);
    res.json({
      token,
      username: createdUser.username,
      national_id: createdUser.national_id,
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
    const username = req.user?.username as string;
    const getUser = await user.usernameExists(req.params.username);
    if (username !== getUser?.username) {
      throw new Error('Unauthorized to delete this user');
    }
    const deletedUser = await user.delete(req.params.username);
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
    const username = req.user?.username as string;
    const userId = req.params.id;
    const getUser = await user.usernameExists(username);
    if (userId !== getUser?.national_id) {
      throw new Error('Unauthorized to edit this user');
    }
    const newUsername = req.body.username;
    if (!newUsername || newUsername === getUser?.username) {
      throw new Error('Please provide a new username');
    }
    if (await user.usernameExists(newUsername)) {
      throw new Error('Username already in use. Please provide a new username');
    }
    const updateUser = await user.update(userId, newUsername);
    res.json(updateUser);
  } catch (error) {
    res.status(400);
    next(error);
  }
};
