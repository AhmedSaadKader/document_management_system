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

    // Find the workspace by ID
    const workspace = await Workspace.findById(workspaceId)
      .populate({
        path: 'documents',
        match: {
          deleted: false, // Only include documents that are not deleted
          ...(search && { documentName: { $regex: search, $options: 'i' } }), // Search by document name
        },
        options: {
          sort: sortBy ? { [sortBy as string]: sortOrder } : {}, // Sort by specified field
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

    // Check if the user is the owner, editor, or viewer
    if (userEmail) {
      role = workspace.isUserEditorOrViewer(userEmail);
    }

    res.json({ workspace, role });
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
      userId: req.user!.national_id,
      userEmail: req.user!.email,
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
    const { file } = req;
    const { workspaceId } = req.params;
    const { documentName, tags, permissions } = req.body;

    // Check if the workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if a file is uploaded
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Prepare document permissions (default uploader to admin if not provided)
    const documentPermissions = permissions || [
      { userEmail: req.user!.email, permission: 'admin' },
    ];

    // Determine the document type and file type from the uploaded file
    const documentType = path.extname(file.originalname).slice(1);
    const fileType = file.mimetype;

    // Create a new document with the updated schema
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

    // Save the new document
    await newDocument.save();

    // Add the document to the workspace
    workspace.addDocument(newDocument._id as mongoose.Types.ObjectId);

    // Send the response with the created document
    res.status(201).json({
      message: 'Document uploaded successfully',
      document: newDocument,
    });
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

// export const downloadDocumentFromWorkspace = async (
//   req: RequestAuth,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { documentId } = req.params;

//     // Find the document by its ID
//     const document = await Document.findById(documentId);
//     if (!document) {
//       return res.status(404).json({ message: 'Document not found' });
//     }

//     // Get the file path
//     const filePath = document.filePath;

//     // Check if the file exists
//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({ message: 'File not found on server' });
//     }

//     // Set the correct headers for downloading the file
//     const headers = {
//       'Content-Disposition': `attachment; filename=${document.originalFileName}`,
//       'Content-Type': `${document.fileType}`,
//     };

//     res.writeHead(200, headers);

//     // Stream the file to the response
//     const fileStream = fs.createReadStream(filePath);
//     fileStream.pipe(res);
//   } catch (err) {
//     next(new Error((err as Error).message));
//   }
// };

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

    // Check if the current user is either the owner or an editor of the workspace
    const userRole = workspace.isUserEditorOrViewer(userEmail);
    if (userRole !== 'editor' && userId !== workspace.userId) {
      return res.status(403).json({
        message: 'Only the owner or editors can share this workspace',
      });
    }

    // Check if the user already has permissions for this workspace
    const existingPermission = workspace.permissions.find(
      (perm: Permission) => perm.userEmail === email
    );

    if (existingPermission) {
      return res.status(400).json({
        message: 'This user already has permissions for this workspace',
      });
    }

    // Add new permission
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

    // Find all workspaces where the user is either a viewer or editor in the permissions array
    const sharedWorkspaces = await Workspace.find({
      'permissions.userEmail': userEmail,
    });

    res.status(200).json(sharedWorkspaces);
  } catch (error) {
    next(error);
  }
};

// Get recent workspaces for the logged-in user
export const getRecentWorkspaces = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.national_id;

    // Fetch the most recent workspaces for the user, ordered by creation date
    const recentWorkspaces = await Workspace.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5); // Adjust the number as needed

    res.status(200).json(recentWorkspaces);
  } catch (error) {
    next(error);
  }
};
