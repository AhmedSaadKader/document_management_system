import { Router } from 'express';
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkIfFavorited,
} from '../controllers/favorite_controller';
import auth from '../middleware/auth';

const router = Router();

router.use(auth);

// Add a workspace to favorites
router.post('/:workspaceId', addFavorite);

// Remove a workspace from favorites
router.delete('/:workspaceId', removeFavorite);

// Get the list of favorited workspaces for the logged-in user
router.get('/', getFavorites);

// Check if a specific workspace is favorited by the user
router.get('/:workspaceId/check', checkIfFavorited);

export default router;
