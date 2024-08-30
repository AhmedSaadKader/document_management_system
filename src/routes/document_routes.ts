import { Router } from 'express';
import {
  getAllDocuments,
  // createDocument,
  uploadDocument,
  softDeleteDocument,
  recycleBin,
  restoreDocument,
  permanentlyDeleteDocument,
  previewDocument,
  filterDocuments,
  getDocumentDetails,
} from '../controllers/document_controller';
import auth from '../middleware/auth';
import { uploadFileMiddleware } from '../utils/file_upload_utils';

const router = Router();

router.use(auth);

// Route to get all documents
router.get('/', getAllDocuments);

// Route to create a new document
// router.post('/', createDocument);

// Route to filter documents
router.get('/filter', filterDocuments);

router.get('/recycle-bin', recycleBin);

// Route to get document details
router.get('/:documentId', getDocumentDetails);

// Route to soft delete a document
router.delete('/:documentId', softDeleteDocument);

// Route to restore a document
router.patch('/:documentId/restore', restoreDocument);

// Route to permanently delete a document
router.delete('/:documentId/delete', permanentlyDeleteDocument);

// Route to preview a document
router.get('/:documentId/preview', previewDocument);

// Route to upload a document
router.post('/upload', uploadFileMiddleware, uploadDocument);

export default router;
