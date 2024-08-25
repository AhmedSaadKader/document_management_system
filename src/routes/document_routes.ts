import { Router } from 'express';
import {
  getAllDocuments,
  createDocument,
  uploadDocument,
} from '../controllers/document_controller';
import auth from '../middleware/auth';
import { uploadFileMiddleware } from '../utils/file_upload_utiles';

const router = Router();

router.use(auth);

// Route to get all documents
router.get('/', getAllDocuments);

// Route to create a new document
router.post('/', createDocument);

router.post('/upload', uploadFileMiddleware, uploadDocument);

export default router;
