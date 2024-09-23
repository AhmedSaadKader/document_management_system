import { Response, NextFunction } from 'express';
import { UserOTPModel } from '../models/user_otp';
import { UserModel } from '../models/user';
import { RequestAuth } from '../../types';

const userOTPModel = new UserOTPModel();
const userModel = new UserModel();

/**
 * Controller for generating OTP and sending it to the user's email.
 */
export const generateOTP = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  try {
    const user = await userModel.emailExists(email as string);
    if (user) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const otpCode = await userOTPModel.generateOTP(
      email as string,
      'DMS-Atos: Sign Up OTP',
      'Please use this OTP to register with:'
    );
    res.status(200).json({ message: 'OTP sent to email', otp: otpCode });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for verifying the OTP code.
 */
export const verifyOTP = async (
  req: RequestAuth,
  res: Response,
  next: NextFunction
) => {
  const { email, otp } = req.body;
  try {
    const isValid = await userOTPModel.verifyOTP(
      email as string,
      otp as string
    );
    if (isValid) {
      res.status(200).json({ message: 'OTP verified successfully' });
    }
  } catch (error) {
    next(error);
  }
};
