import { NextFunction, Response } from 'express';
import { RequestAuth } from '../../types';
import { UserModel } from '../models/user';
import { UserAlreadyExistsError } from './error_handler';

export const validateUserSignup = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const user = new UserModel();

  const { national_id, first_name, last_name, email, password } = req.body;

  if (!national_id) next(new Error('Please provide the national id'));
  if (!first_name) next(new Error('Please provide the first name'));
  if (!last_name) next(new Error('Please provide the last name'));
  if (!email) next(new Error('Please provide the email'));
  if (!password) next(new Error('Please provide the password'));

  if (await user.emailExists(email)) {
    res.status(409).json({
      error: 'Email already exists',
    });
    next(new UserAlreadyExistsError(email));
  }

  if (await user.nationalIdExists(national_id)) {
    res.status(409).json({
      error: 'National Id already exists',
    });
  }

  next();
};
