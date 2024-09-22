import { Response, NextFunction } from 'express';
import { RequestAuth } from '../../types';
import Workspace, { Permission } from '../models/workspace';
import Document from '../models/document';
import {
  DatabaseConnectionError,
  NotFoundError,
} from '../middleware/error_handler';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { deleteFile } from '../utils/s3_utils';
import DocumentModel from '../models/document';

/**
 * @description Retrieve all workspaces for the authenticated user.
 * @param {RequestAuth} req - The request object, containing user information.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {void}
 */
export const getAllWorkspaces = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaces = await Workspace.find({
      userId: req.user!.national_id,
      deleted: false,
    }).populate({
      path: 'documents',
      match: { deleted: { $not: { $eq: true } } },
    });
    res.json(workspaces);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

/**
 * Get all public workspaces sorted by the number of favorites and creation date.
 *
 * This function retrieves all public workspaces from the database, sorts them in descending order
 * by the number of times they have been favorited. If two or more workspaces have the same number of
 * favorites, they are further sorted by the creation date in descending order (most recent first).
 *
 * Aggregation pipeline:
 * - `$match`: Filters the workspaces to include only public ones (`isPublic: true`).
 * - `$lookup`: Joins the `favorites` collection to calculate how many times each workspace has been favorited.
 * - `$addFields`: Adds a `favoritesCount` field to each workspace representing the total number of favorites.
 * - `$sort`: Sorts by `favoritesCount` (descending) and then `createdAt` (descending).
 *
 * @async
 * @function getPublicWorkspaces
 * @param {RequestAuth} req - Express request object (extended with user info in `RequestAuth`).
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express `next` function to pass control to error handler middleware.
 * @returns {Promise<void>} - Returns a JSON response containing the sorted public workspaces.
 * @throws {Error} - Passes any errors to the next middleware for error handling.
 */

export const getPublicWorkspaces = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const workspaces = await Workspace.aggregate([
      // Match only public workspaces
      {
        $match: {
          isPublic: true,
          deleted: { $not: { $eq: true } },
        },
      },
      // Join with the Favorite collection
      {
        $lookup: {
          from: 'favorites',
          localField: '_id',
          foreignField: 'workspaceId',
          as: 'favorites',
        },
      },
      // Add a new field 'favoritesCount' with the number of favorites
      {
        $addFields: {
          favoritesCount: { $size: '$favorites' },
        },
      },
      // Sort first by favorites count (descending), then by createdAt (descending)
      {
        $sort: {
          favoritesCount: -1, // Descending order of favorites count
          createdAt: -1, // Descending order of creation date if favorites are equal
        },
      },
    ]);

    res.json(workspaces);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

/**
 * @description Retrieve a workspace by its ID and its documents, with optional search, sorting, and filtering.
 * @param {RequestAuth} req - The request object, containing user and query information.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {void}
 */
export const getWorkspaceById = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workspaceId } = req.params;
    const { search, sortBy, order = 'asc' } = req.query;
    const userId = req.user!.national_id;
    const userEmail = req.user!.email;
    const sortOrder = order === 'desc' ? -1 : 1;

    const workspace = await Workspace.findById(workspaceId)
      .populate({
        path: 'documents',
        match: {
          deleted: false,
          ...(search && { documentName: { $regex: search, $options: 'i' } }),
        },
        options: {
          sort: sortBy ? { [sortBy as string]: sortOrder } : {},
        },
      })
      .exec();

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    let role: string | null = 'viewer';

    if (userId == workspace.userId) {
      role = 'owner';
    }

    if (userEmail) {
      role = workspace.isUserEditorOrViewer(userEmail);
    }

    res.json({ workspace, role });
  } catch (err) {
    next(new DatabaseConnectionError((err as Error).message));
  }
};

/**
 * @description Create a new workspace for the authenticated user.
 * @param {RequestAuth} req - The request object, containing the workspace name.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {void}
 */
export const createWorkspace = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const { workspaceName, description, isPublic } = req.body;

  try {
    const workspace = new Workspace({
      workspaceName,
      description,
      isPublic,
      userId: req.user!.national_id,
      userEmail: req.user!.email,
    });
    await workspace.save();

    res.status(201).json(workspace);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

/**
 * @description Update an existing workspace's details.
 * @param {RequestAuth} req - The request object, containing workspace ID and update data.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {void}
 */
export const updateWorkspace = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const { workspaceId } = req.params;
  const { workspaceName, description, isPublic } = req.body;

  try {
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return next(new NotFoundError('Workspace not found'));
    }

    if (workspace.userId !== req.user!.national_id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to update this workspace' });
    }

    workspace.workspaceName = workspaceName || workspace.workspaceName;
    workspace.description = description;
    workspace.isPublic = isPublic;
    workspace.updatedAt = new Date();

    await workspace.save();

    res.status(200).json(workspace);
  } catch (err) {
    next(new DatabaseConnectionError((err as Error).message));
  }
};

export const softDeleteWorkspace = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const { workspaceId } = req.params;

  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(new NotFoundError('Workspace not found'));
    }

    // Soft delete the workspace
    workspace.deleted = true;
    workspace.updatedAt = new Date();
    await workspace.save();

    res.status(200).json({ message: 'Workspace soft deleted successfully' });
  } catch (err) {
    next(new DatabaseConnectionError((err as Error).message));
  }
};

export const permanentlyDeleteWorkspace = async (
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

    // Check if the workspace is soft deleted
    if (!workspace.deleted) {
      return res.status(400).json({ message: 'Workspace is not soft deleted' });
    }

    // Handle documents associated with the workspace
    for (const document of workspace.documents) {
      const documentObject = await DocumentModel.findById(document);
      // Permanently delete the document from the database
      if (!documentObject) continue;

      const bucketName = process.env.AWS_BUCKET_NAME as string;
      const fileKey = documentObject.filePath;
      await DocumentModel.deleteOne({ _id: document });

      // Optionally delete the document's file from S3
      await deleteFile(bucketName, fileKey);
    }

    // Permanently delete the workspace
    await Workspace.deleteOne({ _id: workspaceId });

    res
      .status(200)
      .json({ message: 'Workspace and documents permanently deleted' });
  } catch (err) {
    next(new DatabaseConnectionError((err as Error).message));
  }
};

// Fetch all soft-deleted workspaces
export const fetchDeletedWorkspaces = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const deletedWorkspaces = await Workspace.find({ deleted: true });

    res.status(200).json(deletedWorkspaces);
  } catch (err) {
    next(new DatabaseConnectionError((err as Error).message));
  }
};

// Restore a soft-deleted workspace
export const restoreWorkspace = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const { workspaceId } = req.params;

  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.deleted) {
      return next(new NotFoundError('Workspace not found or not deleted'));
    }

    // Restore the workspace
    workspace.deleted = false;
    workspace.updatedAt = new Date();
    await workspace.save();

    res.status(200).json({ message: 'Workspace restored successfully' });
  } catch (err) {
    next(new DatabaseConnectionError((err as Error).message));
  }
};

/**
 * @description Add a document to a workspace.
 * @param {RequestAuth} req - The request object, containing file and document details.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {void}
 */
export const addDocumentToWorkspace = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const { file } = req;
    const { workspaceId } = req.params;
    const { documentName, tags, permissions } = req.body;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const documentPermissions = permissions || [
      { userEmail: req.user!.email, permission: 'admin' },
    ];

    const documentType = path.extname(file.originalname).slice(1);
    const fileType = file.mimetype;

    const newDocument = new Document({
      documentName: documentName || file.originalname,
      documentType,
      userId: req.user!.national_id,
      userEmail: req.user!.email,
      filePath: file.s3Key,
      originalFileName: file.originalname,
      fileSize: file.size,
      fileType,
      workspace: workspaceId,
      permissions: documentPermissions,
      tags: tags || [],
      version: 1,
      versionHistory: [
        {
          version: 1,
          updatedAt: new Date(),
          updatedBy: req.user!.email,
        },
      ],
    });

    await newDocument.save();
    workspace.addDocument(newDocument._id as mongoose.Types.ObjectId);

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: newDocument,
    });
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

/**
 * @description Remove a document from a workspace and delete the document.
 * @param {RequestAuth} req - The request object, containing workspace ID and document ID.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {void}
 */
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

// export const downloadDocumentFromWorkspace = async (
//   req: RequestAuth,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { documentId } = req.params;
//
//     const document = await Document.findById(documentId);
//     if (!document) {
//       return res.status(404).json({ message: 'Document not found' });
//     }
//
//     const filePath = document.filePath;
//
//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({ message: 'File not found on server' });
//     }
//
//     const headers = {
//       'Content-Disposition': `attachment; filename=${document.originalFileName}`,
//       'Content-Type': `${document.fileType}`,
//     };
//
//     res.writeHead(200, headers);
//
//     const fileStream = fs.createReadStream(filePath);
//     fileStream.pipe(res);
//   } catch (err) {
//     next(new Error((err as Error).message));
//   }
// };

/**
 * @description Stream a document's content to the client.
 * @param {RequestAuth} req - The request object, containing document ID.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {void}
 */
export const viewDocumentFromWorkspace = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentId } = req.params;
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = document.filePath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

/**
 * @description Share a workspace with another user by granting them permissions.
 * @param {RequestAuth} req - The request object, containing workspace ID, user email, and permission level.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {void}
 */
export const shareWorkspace = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const { email, permission } = req.body;
  const { workspaceId } = req.params;
  const userId = req.user!.national_id;
  const userEmail = req.user!.email;

  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(new NotFoundError('Workspace not found'));
    }

    if (!userId || !userEmail) {
      return next(new Error('User not authenticated'));
    }

    if (!email) {
      return next(new Error('Please provide an email'));
    }

    if (permission !== 'viewer' && permission !== 'editor') {
      return next(new Error('Please choose a valid permission'));
    }

    const userRole = workspace.isUserEditorOrViewer(userEmail);
    if (userRole !== 'editor' && userId !== workspace.userId) {
      return res.status(403).json({
        message: 'Only the owner or editors can share this workspace',
      });
    }

    const existingPermission = workspace.permissions.find(
      (perm: Permission) => perm.userEmail === email
    );

    if (existingPermission) {
      return res.status(400).json({
        message: 'This user already has permissions for this workspace',
      });
    }

    if (permission === 'editor') {
      await workspace.addUserAsEditor(email);
    } else {
      await workspace.addUserAsViewer(email);
    }

    res.status(200).json({ message: `User added as ${permission}` });
  } catch (err) {
    next(new Error((err as Error).message));
  }
};

/**
 * @description Retrieve all workspaces shared with the authenticated user.
 * @param {RequestAuth} req - The request object, containing user email.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {void}
 */
export const getSharedWorkspaces = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const userEmail = req.user?.email;

  try {
    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' });
    }

    const sharedWorkspaces = await Workspace.find({
      'permissions.userEmail': userEmail,
    });

    res.status(200).json(sharedWorkspaces);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Retrieve the most recent workspaces created by the authenticated user.
 * @param {RequestAuth} req - The request object, containing user ID.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {void}
 */
export const getRecentWorkspaces = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.national_id;

    const recentWorkspaces = await Workspace.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json(recentWorkspaces);
  } catch (error) {
    next(error);
  }
};
