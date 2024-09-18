import { Router } from 'express';
import { generateOTP, verifyOTP } from '../controllers/user_otp_controller';
import { validateUserSignup } from '../middleware/validate_user_signup';

const router = Router();

/**
 * POST /otp/generate
 * Route for generating an OTP and sending it via email.
 */
router.post('/generate', validateUserSignup, generateOTP);

/**
 * POST /otp/verify
 * Route for verifying the OTP code.
 */
router.post('/verify', verifyOTP);

export default router;
