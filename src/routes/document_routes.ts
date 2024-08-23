import { Router } from 'express';
import {
  getAllDocuments,
  createDocument,
} from '../controllers/document_controller';
import auth from '../middleware/auth';

const router = Router();

router.use(auth);

// Route to get all documents
router.get('/', getAllDocuments);

// Route to create a new document
router.post('/', createDocument);

export default router;
