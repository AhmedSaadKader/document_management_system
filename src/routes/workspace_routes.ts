import { Router } from 'express';
import {
  getAllWorkspaces,
  createWorkspace,
  updateWorkspace,
  getWorkspaceById,
  addDocumentToWorkspace,
  deleteDocumentFromWorkspace,
  // downloadDocumentFromWorkspace,
  // viewDocumentFromWorkspace,
  shareWorkspace,
  getSharedWorkspaces,
  getRecentWorkspaces,
  getPublicWorkspaces,
  softDeleteWorkspace,
  permanentlyDeleteWorkspace,
  fetchDeletedWorkspaces,
  restoreWorkspace,
} from '../controllers/workspace_controller';
import auth from '../middleware/auth';
import { uploadFileMiddleware } from '../utils/file_upload_utils';
import { filterDocuments } from '../controllers/document_controller';
import { s3UploadMiddleware } from '../middleware/s3_upload';

const router = Router();

// Apply authentication middleware
router.use(auth);

// Route to get all workspaces
router.get('/', getAllWorkspaces);

// Route to get public workspaces
router.get('/public', getPublicWorkspaces);

// Route to create a new workspace
router.post('/', createWorkspace);

router.get('/shared-workspaces', getSharedWorkspaces);

// Get recent workspaces for the logged-in user
router.get('/recent', getRecentWorkspaces);

// Route to fetch soft-deleted workspaces
router.get('/deleted', fetchDeletedWorkspaces);

// Route to get a specific workspace by ID
router.get('/:workspaceId', getWorkspaceById);

// Route to update a specific workspace by ID
router.put('/:workspaceId', updateWorkspace);

// Route to soft delete a specific workspace by ID
router.delete('/:workspaceId', softDeleteWorkspace);

// Route to permanently delete a specific workspace by ID
router.delete('/:workspaceId/permanent-delete', permanentlyDeleteWorkspace);

// Route to restore a soft-deleted workspace
router.put('/:workspaceId/restore', restoreWorkspace);

router.post(
  '/:workspaceId/documents',
  uploadFileMiddleware,
  s3UploadMiddleware,
  addDocumentToWorkspace
);

router.delete(
  '/:workspaceId/documents/:documentId',
  deleteDocumentFromWorkspace
);

// router.get(
//   '/:workspaceId/documents/:documentId/download',
//   downloadDocumentFromWorkspace
// );

// router.get(
//   '/:workspaceId/documents/:documentId/view',
//   viewDocumentFromWorkspace
// );

router.get('/:workspaceId/documents/filter', filterDocuments);

// Route to add an editor/viewer to a workspace
router.post('/:workspaceId/share', shareWorkspace);

export default router;
