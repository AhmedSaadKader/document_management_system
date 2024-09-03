// routes/permissionRoutes.ts

import express from 'express';
import { getSharedDocuments } from '../controllers/permissions_controller';
import auth from '../middleware/auth';

const router = express.Router();

// Fetch documents shared with the authenticated user
router.get('/shared-workspaces', auth, getSharedDocuments);

export default router;
