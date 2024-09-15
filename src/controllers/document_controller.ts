import { Response, NextFunction } from 'express';
import { RequestAuth } from '../../types';
import DocumentModel from '../models/document';
// import Workspace from '../models/workspace';
import {
  DatabaseConnectionError,
  NotFoundError,
} from '../middleware/error_handler';
// import { createBucket, uploadFile } from '../utils/s3_utils';
import path from 'path';
import fs from 'fs';

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

    if (document.userId !== req.user!.national_id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to view this workspace' });
    }

    res.status(201).json(document);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

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

    // Permanently delete the document
    await DocumentModel.deleteOne({ _id: documentId });

    res
      .status(200)
      .json({ message: 'Document permanently deleted successfully' });
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

export const downloadDocument = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentId } = req.params;

    // Find the document by its ID
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Get the file path
    const filePath = document.filePath;

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set the correct headers for downloading the file
    const headers = {
      'Content-Disposition': `attachment; filename=${document.originalFileName}`,
      'Content-Type': 'application/pdf',
    };

    res.writeHead(200, headers);

    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
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

export const previewDocument = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const { documentId } = req.params;

  try {
    // Find the document by ID
    const document = await DocumentModel.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if the authenticated user is allowed to preview the document
    if (document.userId.toString() !== req.user!.national_id) {
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

// export const uploadDocument = async (
//   req: RequestAuth,
//   res: Response,
//   next: NextFunction
// ) => {
//   if (!req.file) {
//     return res.status(400).send('No file uploaded.');
//   }

//   try {
//     const bucketName = process.env.AWS_BUCKET_NAME as string;
//     // Create the bucket if it doesn't exist
//     try {
//       await createBucket(bucketName);
//       console.log(`Bucket created or already exists: ${bucketName}`);
//     } catch (error) {
//       console.error(`Error creating bucket: ${error}`);
//       return res.status(500).send('Failed to create bucket.');
//     }
//     const fileKey = req.file.originalname;
//     const fileBody = req.file.buffer;
//     const contentType = req.file.mimetype;

//     // Upload to S3

//     const result = await uploadFile(bucketName, fileKey, fileBody, contentType);

//     // Optionally delete the local file after uploading to S3
//     //  fs.unlinkSync(path.join(uploadDir, req.file.filename));

//     res.json({ message: 'File uploaded successfully', result });
//   } catch (error) {
//     console.error(`Error uploading file: ${error}`);
//     next(error);
//   }
// };

// export const getAllDocuments = async (
//   req: RequestAuth,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user?.national_id;

//     if (!userId) {
//       return res.status(401).json({ message: 'Unauthorized access' });
//     }

//     // Fetch documents belonging to the authenticated user
//     const documents = await DocumentModel.find({
//       userId: userId,
//       deleted: false,
//     });

//     res.json(documents);
//   } catch (err) {
//     next(new DatabaseConnectionError((err as Error).message));
//   }
// };

// export const createDocument = async (
//   req: RequestAuth,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { documentName, workspace } = req.body;

//   try {
//     // Check if the workspace exists
//     const workspaceObject = await Workspace.findById(workspace);
//     if (!workspaceObject) {
//       return next(new NotFoundError('Workspace not found'));
//     }

//     if (!documentName) {
//       throw new Error('Missing document name');
//     }

//     if (!req.user!.national_id) {
//       throw new Error('Missing user id');
//     }

//     if (!workspace) {
//       throw new Error('Missing workspace');
//     }

//     // Create and save the new document
//     const document = new DocumentModel({
//       documentName,
//       userId: req.user!.national_id,
//       userEmail: req.user!.email,
//       workspace,
//     });
//     await document.save();

//     // Add the document to the workspace
//     workspaceObject.addDocument(document._id);

//     res.status(201).json(document);
//   } catch (err) {
//     next(new Error((err as Error).message));
//   }
// };
