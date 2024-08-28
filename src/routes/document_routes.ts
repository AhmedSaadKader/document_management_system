import { Router } from 'express';
import {
  getAllDocuments,
  createDocument,
  uploadDocument,
  softDeleteDocument,
  recycleBin,
  restoreDocument,
  permanentlyDeleteDocument,
  previewDocument,
} from '../controllers/document_controller';
import auth from '../middleware/auth';
import { uploadFileMiddleware } from '../utils/file_upload_utils';

const router = Router();

router.use(auth);

// Route to get all documents
router.get('/', getAllDocuments);

// Route to create a new document
router.post('/', createDocument);

router.get('/recycle-bin', recycleBin);

// Route to soft delete a document
router.delete('/:documentId', softDeleteDocument);

router.patch('/:documentId/restore', restoreDocument);

router.delete('/:documentId/delete', permanentlyDeleteDocument);

router.get('/:documentId/preview', previewDocument);

router.post('/upload', uploadFileMiddleware, uploadDocument);

export default router;
