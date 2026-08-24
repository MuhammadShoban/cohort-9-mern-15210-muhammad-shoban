import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from '../controllers/noteController.js';

const router = Router();

// Protect all routes inside this router
router.use(protect);

router
  .route('/')
  .post(createNote)
  .get(getNotes);

router
  .route('/:id')
  .get(getNoteById)
  .put(updateNote)
  .delete(deleteNote);

export default router;
