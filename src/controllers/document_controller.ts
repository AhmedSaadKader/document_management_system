import { Response, NextFunction } from 'express';
import { RequestAuth } from '../../types';
import DocumentModel from '../models/document';
import {
  DatabaseConnectionError,
  NotFoundError,
} from '../middleware/error_handler';
import {
  deleteFile,
  readFile,
  streamToResponse,
  streamToString,
} from '../utils/s3_utils';
import { Readable } from 'stream';

/**
 * Get the details of a document by its ID.
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

    res.status(201).json(document);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

/**
 * Soft delete a document by marking it as deleted without removing it from the database.
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
 */
export const recycleBin = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const documents = await DocumentModel.find({
      userId: req.user!.user_id,
      deleted: true,
    });
    res.status(200).json(documents);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

/**
 * Restore a soft-deleted document, marking it as active again.
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
 */
export const filterDocuments = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.user_id;
    const { search, sortBy, order = 'asc', page = 1, limit = 10 } = req.query;

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

    // Pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const totalDocuments = await DocumentModel.countDocuments({
      userId: userId,
      deleted: false,
    });
    query = query.skip(skip).limit(parseInt(limit as string));

    const documents = await query.exec();

    res.json({
      documents,
      currentPage: parseInt(page as string),
      totalPages: Math.ceil(totalDocuments / parseInt(limit as string)),
      totalDocuments,
    });
  } catch (err) {
    next(new DatabaseConnectionError((err as Error).message));
  }
};

/**
 * Preview a document by converting it to a base64 string or streaming for audio/video files.
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
    const contentType = document.fileType;

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
        });
      } else if (Body instanceof Blob) {
        // Handle Blob for different environments (if applicable)
        const arrayBuffer = await Body.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        return res.json({
          base64: base64Data,
          fileType: document.fileType,
        });
      } else {
        return res.status(500).json({ message: 'Unsupported Body type' });
      }
    }
  } catch (err) {
    next(new Error((err as Error).message));
  }
};
