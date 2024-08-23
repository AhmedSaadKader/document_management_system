import { Response, NextFunction } from 'express';
import { RequestAuth } from '../../types';
import Document from '../models/document';
import Workspace from '../models/workspace';
import {
  DatabaseConnectionError,
  NotFoundError,
} from '../middleware/error_handler';

export const getAllDocuments = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const documents = await Document.find();
    res.json(documents);
  } catch (err) {
    next(new DatabaseConnectionError((err as Error).message));
  }
};

export const createDocument = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const { documentName, workspace } = req.body;

  try {
    // Check if the workspace exists
    const workspaceObject = await Workspace.findById(workspace);
    if (!workspaceObject) {
      return next(new NotFoundError('Workspace not found'));
    }

    // Create and save the new document
    const document = new Document({ documentName, workspace: workspace });
    await document.save();

    // Add the document to the workspace
    workspaceObject.documents.push(document._id);
    await workspaceObject.save();

    res.status(201).json(document);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};
