import express from 'express';

import {
  createAdminUser,
  loginController,
  protect,
  restrictTo,
  signupController,
} from '../controllers/authController';

const router = express.Router();

router.post('/signup', signupController);
router.post('/login', loginController);

router.post('/createAdmin', protect, restrictTo('ADMIN'), createAdminUser);

export default router;
