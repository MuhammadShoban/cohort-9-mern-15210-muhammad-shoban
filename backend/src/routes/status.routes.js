import { Router } from 'express';
import { checkStatus } from '../controllers/status.controller.js';

const router = Router();

router.get('/status', checkStatus);

export default router;
