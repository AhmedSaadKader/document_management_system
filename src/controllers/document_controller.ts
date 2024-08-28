import { Response, NextFunction } from 'express';
import { RequestAuth } from '../../types';
import Document from '../models/document';
import Workspace from '../models/workspace';
import {
  DatabaseConnectionError,
  NotFoundError,
} from '../middleware/error_handler';
import { uploadFile } from '../utils/s3_utils';
import path from 'path';
import fs from 'fs';

export const getAllDocuments = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.national_id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    // Fetch documents belonging to the authenticated user
    const documents = await Document.find({ user: userId, deleted: false });

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

export const getDocumentDetails = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentId } = req.params;
    console.log(documentId);
    const document = await Document.findById(documentId);
    if (!document) {
      return next(new NotFoundError('Document not found'));
    }

    if (document.user !== req.user!.national_id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to view this workspace' });
    }

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
    const fileKey = req.file.originalname;
    const fileBody = req.file.buffer;
    const contentType = req.file.mimetype;

    await uploadFile(bucketName as string, fileKey, fileBody, contentType);
    res.status(200).send('File uploaded successfully.');
  } catch (error) {
    res.status(500).send(`Error uploading file: ${(error as Error).message}`);
  }
};

export const softDeleteDocument = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentId } = req.params;
    const document = await Document.findById(documentId);

    if (!document) {
      return next(new NotFoundError('Document not found'));
    }

    // Mark the document as deleted
    document.deleted = true;
    await document.save();

    res.status(200).json({ message: 'Document soft-deleted successfully' });
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

export const recycleBin = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const documents = await Document.find({ deleted: { $eq: true } });
    res.status(200).json(documents);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

export const restoreDocument = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentId } = req.params;
    const document = await Document.findById(documentId);

    if (!document) {
      return next(new NotFoundError('Document not found'));
    }

    if (!document.deleted) {
      return res.status(400).json({ message: 'Document is not deleted' });
    }

    // Restore the document
    document.deleted = false;
    await document.save();

    res.status(200).json({ message: 'Document restored successfully' });
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

export const permanentlyDeleteDocument = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentId } = req.params;
    const document = await Document.findById(documentId);

    if (!document) {
      return next(new NotFoundError('Document not found'));
    }

    if (!document.deleted) {
      return res.status(400).json({ message: 'Document is not deleted' });
    }

    // Permanently delete the document
    await Document.deleteOne({ _id: documentId });

    res
      .status(200)
      .json({ message: 'Document permanently deleted successfully' });
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

export const previewDocument = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const { documentId } = req.params;

  try {
    // Find the document by ID
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if the authenticated user is allowed to preview the document
    if (document.user.toString() !== req.user!.national_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get the file path from the document record
    const filePath = path.resolve(__dirname, '..\\..', document.filePath);

    // Read the file data
    fs.readFile(filePath, (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ message: 'Failed to read the document file' });
      }

      // Convert the file data to Base64
      const base64Data = data.toString('base64');

      // Send the Base64 string as a response
      res.json({ base64: base64Data });
    });
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

export const filterDocuments = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.national_id;
    const { search, sortBy, order = 'asc' } = req.query;

    let query = Document.find({ user: userId, deleted: false });

    // Search by document name
    if (search) {
      query = query
        .where('documentName')
        .regex(new RegExp(search as string, 'i'));
    }

    // Sort by specified field
    if (sortBy) {
      const sortOrder = order === 'desc' ? -1 : 1;
      query = query.sort({ [sortBy as string]: sortOrder });
    }

    const documents = await query.exec();

    res.json(documents);
  } catch (err) {
    next(new DatabaseConnectionError((err as Error).message));
  }
};
