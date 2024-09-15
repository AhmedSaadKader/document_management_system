import { RequestAuth } from '../../types';
import { Response, NextFunction } from 'express';
import Favorite from '../models/favorite';
import Workspace from '../models/workspace';

/**
 * Add workspace to the user's list of favorites.
 *
 * @param req - The authenticated request object containing the workspace ID in `req.params` and user information.
 * @param res - The response object.
 * @param next - The next middleware function for error handling.
 * @returns A JSON response with the status and message.
 */
export const addFavorite = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user!.national_id;
  const { workspaceId } = req.params;

  try {
    // Check if workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if the workspace is already favorited by the user
    const existingFavorite = await Favorite.findOne({ userId, workspaceId });
    if (existingFavorite) {
      return res.status(400).json({ message: 'Workspace already favorited' });
    }

    // Add to favorites
    const newFavorite = new Favorite({
      userId,
      workspaceId,
    });

    await newFavorite.save();

    res.status(201).json({ message: 'Workspace added to favorites' });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a workspace from the user's list of favorites.
 *
 * @param req - The authenticated request object containing the workspace ID in `req.params` and user information.
 * @param res - The response object.
 * @param next - The next middleware function for error handling.
 * @returns A JSON response with the status and message.
 */
export const removeFavorite = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user!.national_id;
  const { workspaceId } = req.params;

  try {
    // Find and remove favorite
    const removedFavorite = await Favorite.findOneAndDelete({
      userId,
      workspaceId,
    });

    if (!removedFavorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.status(200).json({ message: 'Workspace removed from favorites' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get the list of workspaces favorited by the user.
 *
 * @param req - The authenticated request object containing the user's ID.
 * @param res - The response object.
 * @param next - The next middleware function for error handling.
 * @returns A JSON response with the list of favorited workspaces.
 */
export const getFavorites = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user!.national_id;

  try {
    // Find all favorited workspaces by the user
    const favorites = await Favorite.find({ userId }).populate('workspaceId');

    res.status(200).json(favorites.map((fav) => fav.workspaceId));
  } catch (error) {
    next(error);
  }
};

/**
 * Check if a specific workspace is favorited by the user.
 *
 * @param req - The authenticated request object containing the workspace ID in `req.params` and user information.
 * @param res - The response object.
 * @param next - The next middleware function for error handling.
 * @returns A JSON response indicating whether the workspace is favorited.
 */
export const checkIfFavorited = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user!.national_id;
  const { workspaceId } = req.params;

  try {
    // Check if this user has favorited this workspace
    const favorite = await Favorite.findOne({ userId, workspaceId });

    if (favorite) {
      return res.status(200).json({ isFavorited: true });
    } else {
      return res.status(200).json({ isFavorited: false });
    }
  } catch (error) {
    next(error);
  }
};
