import express from 'express';
const router = express.Router();

import { protect, restrictTo } from '../controllers/authController';
import {
  createTrain,
  getTrain,
  updateTrain,
} from '../controllers/trainController';

router.get('/', getTrain);

router.use(protect);
router.use(restrictTo('ADMIN'));

router.patch('/:id', updateTrain);
router.post('/', createTrain);

export default router;
