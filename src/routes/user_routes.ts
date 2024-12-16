import { Router } from 'express';
import { deleteUser, getCurrentUser } from '../controllers/user_controllers';
import firebaseAuth from '../middleware/auth';

const router = Router();

router.use(firebaseAuth);
router.get('/me', getCurrentUser);
router.delete('/me', deleteUser);

export default router;
