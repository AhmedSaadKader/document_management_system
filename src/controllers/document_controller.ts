import { Response, NextFunction } from 'express';
import { RequestAuth } from '../../types';
import Document from '../models/document';
import Workspace from '../models/workspace';
import {
  DatabaseConnectionError,
  NotFoundError,
} from '../middleware/error_handler';
import { uploadFile } from '../utils/s3_utils';

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
    const document = new Document({
      documentName,
      user: req.user!.national_id,
      workspace: workspace,
    });
    await document.save();

    // Add the document to the workspace
    workspaceObject.documents.push(document._id);
    await workspaceObject.save();

    res.status(201).json(document);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

export const uploadDocument = async (req: RequestAuth, res: Response) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const bucketName = process.env.AWS_BUCKET_NAME;
    const fileKey = req.file.originalname; // Use the original file name or generate a unique key
    const fileBody = req.file.buffer;
    const contentType = req.file.mimetype;

    await uploadFile(bucketName as string, fileKey, fileBody, contentType);
    res.status(200).send('File uploaded successfully.');
  } catch (error) {
    res.status(500).send(`Error uploading file: ${(error as Error).message}`);
  }
};
