import express from 'express';
const router = express.Router();

import { protect } from '../controllers/authController';
import { bookSeat, getBookingStatus } from '../controllers/bookingController';

router.use(protect);
router.get('/:jobId', getBookingStatus);
router.post('/', bookSeat);

export default router;
