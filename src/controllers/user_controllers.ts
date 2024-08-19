import { NextFunction, Request, Response } from 'express';
import { UserModel } from '../models/user';
import { createJWT } from '../utils/jwt_utils';
import { UserAlreadyExistsError } from '../middleware/error_handler';

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

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { first_name, last_name, username, email, password, role } = req.body;
  try {
    if (await user.usernameExists(username)) {
      throw new UserAlreadyExistsError(username);
    }
    const newUser = await user.create({
      first_name,
      last_name,
      username,
      email,
      password,
      role,
    });
    const token = createJWT(newUser.id as string, newUser.username);
    res.json({ token, username: newUser.username, id: newUser.id });
  } catch (error) {
    next(error);
  }
};

// export const
