import express from 'express';
const router = express.Router();

import { protect } from '../controllers/authController';
import {
  bookSeat,
  getBookingById,
  getBookingByUser,
  getBookingStatus,
} from '../controllers/bookingController';

router.use(protect);
router.get('/myBookings', getBookingByUser);
router.get('/status/:jobId', getBookingStatus);
router.get('/:id', getBookingById);
router.post('/', bookSeat);

export default router;
