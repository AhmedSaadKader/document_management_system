// controllers/permissionController.ts

import { Response, NextFunction } from 'express';
import Permission from '../models/permissions';
import Workspace from '../models/workspace';
import { RequestAuth } from '../../types';

export const getSharedDocuments = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const userEmail = req.user?.email;

  try {
    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' });
    }

    // Find all permissions where the user is either a viewer or editor
    const permissions = await Permission.find({ userEmail });

    // Get the workspaces that have been shared with the user
    const sharedWorkspaceIds = permissions.map(
      (permission) => permission.workspaceId
    );

    // Fetch the workspaces
    const sharedWorkspaces = await Workspace.find({
      _id: { $in: sharedWorkspaceIds },
    });

    res.status(200).json(sharedWorkspaces);
  } catch (error) {
    next(error);
  }
};
