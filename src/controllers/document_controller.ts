import { Response, NextFunction } from 'express';
import { RequestAuth } from '../../types';
import DocumentModel from '../models/document';
// import Workspace from '../models/workspace';
import {
  DatabaseConnectionError,
  NotFoundError,
} from '../middleware/error_handler';
import {
  createBucket,
  deleteFile,
  readFile,
  streamToResponse,
  streamToString,
  uploadFile,
} from '../utils/s3_utils';
import fs from 'fs';
import { Readable } from 'stream';
import mime from 'mime';

/**
 * Get the details of a document by its ID.
 *
 * @param req - The request object containing the authenticated user's information and document ID in the URL parameters.
 * @param res - The response object.
 * @param next - The next middleware for error handling.
 * @returns The document details in JSON format.
 */
export const getDocumentDetails = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentId } = req.params;
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      return next(new NotFoundError('Document'));
    }

    // if (document.userId !== req.user!.national_id) {
    //   return res
    //     .status(403)
    //     .json({ message: 'Not authorized to view this workspace' });
    // }

    res.status(201).json(document);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

/**
 * Soft delete a document by marking it as deleted without removing it from the database.
 *
 * @param req - The request object containing the authenticated user's information and document ID in the URL parameters.
 * @param res - The response object.
 * @param next - The next middleware for error handling.
 * @returns A success message if the document was soft-deleted.
 */
export const softDeleteDocument = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentId } = req.params;
    const document = await DocumentModel.findById(documentId);

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

/**
 * Retrieve all documents that have been soft-deleted (recycle bin) for the authenticated user.
 *
 * @param req - The request object containing the authenticated user's information.
 * @param res - The response object.
 * @param next - The next middleware for error handling.
 * @returns A list of documents that have been soft-deleted.
 */
export const recycleBin = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const documents = await DocumentModel.find({
      userId: req.user!.national_id,
      deleted: true,
    });
    res.status(200).json(documents);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

/**
 * Restore a soft-deleted document, marking it as active again.
 *
 * @param req - The request object containing the authenticated user's information and document ID in the URL parameters.
 * @param res - The response object.
 * @param next - The next middleware for error handling.
 * @returns A success message if the document was restored.
 */
export const restoreDocument = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentId } = req.params;
    const document = await DocumentModel.findById(documentId);

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

/**
 * Permanently delete a soft-deleted document from the database and S3.
 *
 * @param req - The request object containing the authenticated user's information and document ID in the URL parameters.
 * @param res - The response object.
 * @param next - The next middleware for error handling.
 * @returns A success message if the document and its associated S3 file were permanently deleted.
 */
export const permanentlyDeleteDocument = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentId } = req.params;
    const document = await DocumentModel.findById(documentId);

    if (!document) {
      return next(new NotFoundError('Document not found'));
    }

    if (!document.deleted) {
      return res.status(400).json({ message: 'Document is not deleted' });
    }

    const bucketName = process.env.AWS_BUCKET_NAME as string;
    const fileKey = document.filePath;

    // Permanently delete the document from MongoDB
    await DocumentModel.deleteOne({ _id: documentId });

    // Delete the file from S3 if it exists
    if (bucketName && fileKey) {
      await deleteFile(bucketName, fileKey);
      console.log(`Deleted S3 file: ${fileKey} from bucket: ${bucketName}`);
    }

    res
      .status(200)
      .json({ message: 'Document permanently deleted successfully' });
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

/**
 * Download a document by its ID.
 *
 * @param req - The request object containing the authenticated user's information and document ID in the URL parameters.
 * @param res - The response object.
 * @param next - The next middleware for error handling.
 * @returns A file stream of the requested document.
 */
export const downloadDocument = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentId } = req.params;
    const bucketName = process.env.AWS_BUCKET_NAME as string;

    // Find the document by its ID
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Get the file key (S3 file path)
    const fileKey = document.filePath;

    // Set the correct headers for downloading the file
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${document.originalFileName}`
    );
    res.setHeader('Content-Type', document.fileType);

    // Read file from S3 bucket
    const s3ReadFile = await readFile(bucketName, fileKey);

    // If Body is a Readable stream (Node.js environment), pipe it to the response
    if (s3ReadFile instanceof Readable) {
      streamToResponse(s3ReadFile, res);
    } else if (s3ReadFile instanceof Blob) {
      // For Blob, convert to ArrayBuffer and send it as the response
      const arrayBuffer = await s3ReadFile.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));
    } else {
      return res
        .status(500)
        .json({ message: 'Unsupported response Body type' });
    }
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

/**
 * Filter documents based on search criteria (e.g., name, sort by date) for the authenticated user.
 *
 * @param req - The request object containing the authenticated user's information and optional query parameters for search and sorting.
 * @param res - The response object.
 * @param next - The next middleware for error handling.
 * @returns A list of documents matching the search criteria.
 */
export const filterDocuments = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.national_id;
    const { search, sortBy, order = 'asc' } = req.query;

    let query = DocumentModel.find({ userId: userId, deleted: false });

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
import { Request, Response, NextFunction } from 'express';
import mime from 'mime-types';
import { DocumentModel } from './models/Document'; // Replace with actual import
import { readFile } from './utils/s3'; // Replace with actual S3 reading function
import { RequestAuth } from './types/RequestAuth'; // Custom Request type

/**
 * Preview a document by converting it to a base64 string or streaming for audio/video files.
 *
 * @param req - The request object containing the authenticated user's information and document ID in the URL parameters.
 * @param res - The response object.
 * @param next - The next middleware for error handling.
 * @returns A base64-encoded string or stream of the document file.
 */
export const previewDocument = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const { documentId } = req.params;
  const bucketName = process.env.AWS_BUCKET_NAME as string;

  try {
    // Find the document by ID
    const document = await DocumentModel.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Get the file key (S3 path) from the document record
    const fileKey = document.filePath;

    // Read file from S3 bucket
    const Body = await readFile(bucketName, fileKey);

    if (!Body) {
      return res.status(404).json({ message: 'File not found in S3' });
    }

    // Determine the content type based on the file extension
    const contentType = mime.lookup(fileKey) || 'application/octet-stream';

    // If the file is audio or video, stream it
    if (contentType.startsWith('audio/') || contentType.startsWith('video/')) {
      // Set headers for streaming the file
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${document.originalFileName}"`
      );

      // Stream the file directly to the response
      if (Body instanceof Readable) {
        Body.pipe(res);
      } else {
        return res
          .status(500)
          .json({ message: 'Unsupported Body type for streaming' });
      }
    } else {
      // Handle non-audio/video files by returning base64
      if (Body instanceof Readable) {
        const base64Data = await streamToString(Body);

        return res.json({
          base64: base64Data,
          fileType: contentType, // Send MIME type to the client
        });
      } else if (Body instanceof Blob) {
        // Handle Blob for different environments (if applicable)
        const arrayBuffer = await Body.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        return res.json({
          base64: base64Data,
          fileType: contentType, // Send MIME type to the client
        });
      } else {
        return res.status(500).json({ message: 'Unsupported Body type' });
      }
    }
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

export const s3UploadMiddleware = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const file = req.file;
    const filePath = file.path;
    const bucketName = process.env.AWS_BUCKET_NAME as string;
    const fileKey = `${Date.now()}_${file.originalname}`;
    const contentType = file.mimetype;
    const fileBody = fs.readFileSync(filePath);

    await createBucket(bucketName);
    console.log(`Bucket created or already exists: ${bucketName}`);

    // Upload to S3
    await uploadFile(bucketName, fileKey, fileBody, contentType);

    // Attach S3 file info to request object
    file.s3Key = fileKey;
    file.s3Bucket = bucketName;

    // Delete the file from disk after uploading to S3
    fs.unlinkSync(filePath);

    next();
  } catch (error) {
    next(new Error((error as Error).message));
  }
};

/*
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
    const documents = await DocumentModel.find({
      userId: userId,
      deleted: false,
    });

    res.json(documents);
  } catch (err) {
    next(new DatabaseConnectionError((err as Error).message));
  }
};
*/

/*
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

    if (!documentName) {
      throw new Error('Missing document name');
    }

    if (!req.user!.national_id) {
      throw new Error('Missing user id');
    }

    if (!workspace) {
      throw new Error('Missing workspace');
    }

    // Create and save the new document
    const document = new DocumentModel({
      documentName,
      userId: req.user!.national_id,
      userEmail: req.user!.email,
      workspace,
    });
    await document.save();

    // Add the document to the workspace
    workspaceObject.addDocument(document._id);

    res.status(201).json(document);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};
*/
