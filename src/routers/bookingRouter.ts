import express from 'express';
const router = express.Router();

import { protect } from '../controllers/authController';
import { bookSeat } from '../controllers/bookingController';

router.use(protect);
router.post('/', bookSeat);

export default router;
