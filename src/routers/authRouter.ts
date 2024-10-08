import express from 'express';

import {
  createAdminUser,
  loginController,
  signupController,
} from '../controllers/authController';

const router = express.Router();

router.post('/signup', signupController);
router.post('/login', loginController);

router.post('/createAdmin', createAdminUser);

export default router;
