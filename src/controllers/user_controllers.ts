import { NextFunction, Request, Response } from 'express';
import { UserModel } from '../models/user';
import { createJWT } from '../utils/jwt_utils';
import {
  UserAlreadyExistsError,
  UserLoginError,
  UserNotFoundError,
} from '../middleware/error_handler';
import { RequestAuth } from '../../types';

const user = new UserModel();

/**
 * Fetch all users from the database.
 *
 * @param req - The request object.
 * @param res - The response object, which will contain all users in JSON format.
 * @param next - The next middleware function for handling errors.
 * @returns A JSON response containing all users.
 */
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

/**
 * Retrieve user data based on the email provided in the request parameters.
 *
 * @param req - The request object containing the authenticated user's information and the email parameter.
 * @param res - The response object, which will contain the user data in JSON format.
 * @param next - The next middleware function for error handling.
 * @returns A JSON response containing the user data.
 */
export const getUserData = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.params;
    const userData = await user.emailExists(email);
    if (!userData) {
      throw new UserNotFoundError(email);
    }
    res.json(userData);
  } catch (err) {
    next(err);
  }
};

/**
 * Register a new user with the provided details in the request body.
 *
 * @param req - The request object containing user registration details.
 * @param res - The response object, which will contain the created user data and a JWT token.
 * @param next - The next middleware function for error handling.
 * @returns A JSON response containing the JWT token and the new user details.
 */
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { national_id, first_name, last_name, email, password } = req.body;
  try {
    if (!national_id || !first_name || !last_name || !email || !password) {
      next(new Error('Please provide missing values'));
    }
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

/**
 * Log in a user by authenticating their email and password.
 *
 * @param req - The request object containing the email and password in the request body.
 * @param res - The response object, which will contain the user data and a JWT token if authentication is successful.
 * @param next - The next middleware function for error handling.
 * @returns A JSON response containing the JWT token and user details.
 */
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      throw new UserLoginError(email);
    }
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

/**
 * Delete a user by their email, ensuring the authenticated user is authorized to delete their own account.
 *
 * @param req - The request object containing the authenticated user's information and email in the request parameters.
 * @param res - The response object, which will contain the deleted user data in JSON format.
 * @param next - The next middleware function for error handling.
 * @returns A JSON response containing the deleted user data.
 */
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

/*
 * The following updateUser function is commented out. It can be uncommented for use in updating user details.
 */

/*
// /**
//  * Update a user's data, ensuring the authenticated user can only update their own data.
//  *
//  * @param req - The request object containing the authenticated user's information, email in the request parameters, and update data in the request body.
//  * @param res - The response object, which will contain the updated user data in JSON format.
//  * @param next - The next middleware function for error handling.
//  * @returns A JSON response containing the updated user data.
//  */
// export const updateUser = async (
//   req: RequestAuth,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { email } = req.params;
//     const { first_name, last_name } = req.body;

//     // Check if the authenticated user is trying to update their own data
//     if (req.user?.email !== email) {
//       res.status(403).json({ error: 'Unauthorized to update this user' });
//     }

//     // Fetch the existing user data
//     const userData = await user.emailExists(email);
//     if (!userData) {
//       throw new UserNotFoundError(email);
//     }

//     // Update the user with the provided fields, but keep old values if not provided
//     const updatedUser = await user.update(email, {
//       first_name: first_name || userData.first_name,
//       last_name: last_name || userData.last_name,
//     });

//     // Return the updated user data
//     res.json({
//       email: updatedUser.email,
//       first_name: updatedUser.first_name,
//       last_name: updatedUser.last_name,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
