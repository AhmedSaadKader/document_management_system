import { Response, NextFunction } from 'express';
import { RequestAuth } from '../../types';
import Workspace from '../models/workspace';
import {
  DatabaseConnectionError,
  NotFoundError,
} from '../middleware/error_handler';

export const getAllWorkspaces = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaces = await Workspace.find({
      user: req.user!.national_id,
    }).populate('documents');
    res.json(workspaces);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

export const getWorkspaceById = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const { workspaceId } = req.params;
  console.log(workspaceId);

  try {
    const workspace =
      await Workspace.findById(workspaceId).populate('documents');

    if (!workspace) {
      return next(new NotFoundError('Workspace not found'));
    }

    if (workspace.user !== req.user!.national_id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to view this workspace' });
    }

    res.json(workspace);
  } catch (err) {
    console.log((err as Error).message);
    next(new DatabaseConnectionError((err as Error).message));
  }
};

export const createWorkspace = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const { workspaceName } = req.body;

  try {
    const workspace = new Workspace({
      workspaceName,
      user: req.user!.national_id,
    });
    await workspace.save();

    res.status(201).json(workspace);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

export const updateWorkspace = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const { workspaceId } = req.params;
  const { workspaceName, description } = req.body;

  try {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return next(new NotFoundError('Workspace not found'));
    }

    if (workspace.user !== req.user!.national_id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to update this workspace' });
    }

    workspace.workspaceName = workspaceName || workspace.workspaceName;
    workspace.description = description || workspace.description;
    workspace.updatedAt = new Date();

    await workspace.save();

    res.json(workspace);
  } catch (err) {
    next(new DatabaseConnectionError((err as Error).message));
  }
};

export const deleteWorkspace = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const { workspaceId } = req.params;

  try {
    const workspace = await Workspace.findByIdAndDelete(workspaceId);

    if (!workspace) {
      return next(new NotFoundError('Workspace not found'));
    }

    res.status(204).json();
  } catch (err) {
    next(new DatabaseConnectionError((err as Error).message));
  }
};
