import { Router } from 'express';
import {
  deleteUser,
  getAllUsers,
  loginUser,
  registerUser,
  getUserData,
} from '../controllers/user_controllers';
import auth from '../middleware/auth';

const router = Router();

/**
 * @module UserRoutes
 * @description This module defines the routes related to user operations.
 */

/**
 * @route GET /
 * @group Users - Operations about users
 * @summary Retrieve all users
 * @returns {Array.<User>} 200 - An array of user objects
 * @returns {Error} 500 - Internal server error
 */
router.get('/', getAllUsers);

/**
 * @route POST /register
 * @group Users - Operations about users
 * @summary Register a new user
 * @param {UserData.model} request.body.required - User data for registration
 * @returns {User} 201 - The newly registered user object
 * @returns {Error} 400 - Bad request, validation errors
 * @returns {Error} 500 - Internal server error
 */
router.post('/register', registerUser);

/**
 * @route POST /login
 * @group Users - Operations about users
 * @summary Login a user
 * @param {LoginData.model} request.body.required - User email and password for authentication
 * @returns {User} 200 - Authenticated user object
 * @returns {Error} 401 - Unauthorized, invalid credentials
 * @returns {Error} 500 - Internal server error
 */
router.post('/login', loginUser);

router.use(auth);

/**
 * @route GET /:email
 * @group Users - Operations about users
 * @summary Retrieve user data by email
 * @param {string} email.path.required - Email of the user to retrieve
 * @returns {User} 200 - The user object corresponding to the email
 * @returns {Error} 404 - User not found
 * @returns {Error} 500 - Internal server error
 * @security Bearer
 */
router.get('/:email', getUserData);

/**
 * @route DELETE /:email
 * @group Users - Operations about users
 * @summary Delete a user by email
 * @param {string} email.path.required - Email of the user to delete
 * @returns {string} 200 - Success message
 * @returns {Error} 404 - User not found
 * @returns {Error} 500 - Internal server error
 * @security Bearer
 */
router.delete('/:email', deleteUser);

// Uncomment the following route if the updateUser functionality is implemented

// /**
//  * @route PATCH /:id
//  * @group Users - Operations about users
//  * @summary Update user data by ID
//  * @param {string} id.path.required - ID of the user to update
//  * @param {UserUpdateData.model} request.body.required - Data to update the user
//  * @returns {User} 200 - The updated user object
//  * @returns {Error} 400 - Bad request, validation errors
//  * @returns {Error} 404 - User not found
//  * @returns {Error} 500 - Internal server error
//  * @security Bearer
//  */
// router.patch('/:id', updateUser);

export default router;
