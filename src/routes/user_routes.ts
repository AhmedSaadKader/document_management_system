import { Router } from 'express';
import { getAllUsers, registerUser } from '../controllers/user_controllers';

const router = Router();

router.get('/', getAllUsers);

router.post('/register', registerUser);

export default router;
