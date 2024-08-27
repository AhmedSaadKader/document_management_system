import { Response, NextFunction } from 'express';
import { RequestAuth } from '../../types';
import Workspace from '../models/workspace';
import Document from '../models/document';
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
    console.log(workspaces[0].documents);
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

export const addDocumentToWorkspace = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId } = req.params;
    const { name } = req.body;
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const newDocument = new Document({
      documentName: name,
      user: req.user!.national_id,
      workspace: workspaceId,
    });
    await newDocument.save();

    workspace.addDocument(newDocument._id);

    res.json(newDocument);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

export const deleteDocumentFromWorkspace = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId, documentId } = req.params;
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    await workspace.removeDocument(documentId);

    await Document.findByIdAndDelete(documentId);

    res.json(workspace);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};
