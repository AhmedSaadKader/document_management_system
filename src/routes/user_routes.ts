import { Router } from 'express';
import {
  deleteUser,
  getAllUsers,
  loginUser,
  registerUser,
  updateUser,
  getUserData,
} from '../controllers/user_controllers';
import auth from '../middleware/auth';

const router = Router();

router.get('/', getAllUsers);

router.post('/register', registerUser);

router.post('/login', loginUser);

router.use(auth);

router.get('/:username', getUserData);

router.delete('/:username', deleteUser);

router.patch('/:id', updateUser);

export default router;
