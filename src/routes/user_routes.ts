import { Router } from 'express';
import {
  deleteUser,
  getAllUsers,
  loginUser,
  registerUser,
  getUserData,
} from '../controllers/user_controllers';
import auth from '../middleware/auth';

const router = Router();

router.get('/', getAllUsers);

router.post('/register', registerUser);

router.post('/login', loginUser);

router.use(auth);

router.get('/:email', getUserData);

router.delete('/:email', deleteUser);

// router.patch('/:id', updateUser);

export default router;
