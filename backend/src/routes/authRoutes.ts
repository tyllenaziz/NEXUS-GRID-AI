import { Router } from 'express';
import { 
  register, 
  login, 
  verifyEmail, 
  verifyLoginOTP, // Added this
  forgotPassword, 
  resetPassword 
} from '../controllers/authController.js'; 
import { googleAuth } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);

// MFA & Identity Protocols
router.post('/verify-email', verifyEmail);
router.post('/verify-login', verifyLoginOTP); // Added this to match frontend call
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google', googleAuth);
export default router;