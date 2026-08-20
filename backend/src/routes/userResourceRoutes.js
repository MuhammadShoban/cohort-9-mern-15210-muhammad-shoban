import express from 'express';
import {
  getMyData,
  createMyData,
  deleteMyData,
} from '../controllers/userResourceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected and automatically scoped to the logged-in user
router.use(protect);

router.route('/')
  .get(getMyData)
  .post(createMyData);

router.route('/:id')
  .delete(deleteMyData);

export default router;
