import { Router } from 'express';
import {
  getAllWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceById,
} from '../controllers/workspace_controller';
import auth from '../middleware/auth';

const router = Router();

// Apply authentication middleware
router.use(auth);

// Route to get all workspaces
router.get('/', getAllWorkspaces);

// Route to create a new workspace
router.post('/', createWorkspace);

// Route to get a specific workspace by ID
router.get('/:workspaceId', getWorkspaceById);

// Route to update a specific workspace by ID
router.put('/:workspaceId', updateWorkspace);

// Route to delete a specific workspace by ID
router.delete('/:workspaceId', deleteWorkspace);

export default router;
