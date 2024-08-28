import { Response, NextFunction } from 'express';
import { RequestAuth } from '../../types';
import Workspace from '../models/workspace';
import Document from '../models/document';
import {
  DatabaseConnectionError,
  NotFoundError,
} from '../middleware/error_handler';
import fs from 'fs';

export const getAllWorkspaces = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaces = await Workspace.find({
      user: req.user!.national_id,
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
  const { workspaceId } = req.params;

  try {
    const workspace = await Workspace.findById(workspaceId).populate({
      path: 'documents',
      match: { deleted: false },
    });

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
    const { file } = req;
    const { workspaceId } = req.params;
    const { documentName } = req.body;
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const newDocument = new Document({
      documentName: documentName || file.originalname,
      user: req.user!.national_id,
      filePath: file.path,
      originalFileName: file.originalname,
      fileSize: file.size,
      workspace: workspaceId,
    });

    await newDocument.save();

    workspace.addDocument(newDocument._id);

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

export const downloadDocumentFromWorkspace = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentId } = req.params;

    // Find the document by its ID
    const document = await Document.findById(documentId);
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
