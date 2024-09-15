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
    }).populate({
      path: 'documents',
      match: { deleted: false },
    });
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
  const { workspaceName } = req.body;

  try {
    const workspace = new Workspace({
      workspaceName,
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
  const { workspaceName, description } = req.body;

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
    workspace.description = description || workspace.description;
    workspace.updatedAt = new Date();

    await workspace.save();

    res.json(workspace);
  } catch (err) {
    next(new DatabaseConnectionError((err as Error).message));
  }
};

/**
 * @description Delete a workspace by its ID.
 * @param {RequestAuth} req - The request object, containing workspace ID.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {void}
 */
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
      filePath: file.path,
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
