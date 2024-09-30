import express from 'express';
const router = express.Router();

import { protect, restrictTo } from '../controllers/authController';
import { createTrain, getTrain } from '../controllers/trainController';

router.get('/source/:source/destination/:destination', getTrain);

router.use(protect);
router.use(restrictTo('ADMIN'));

router.post('/', createTrain);

export default router;
