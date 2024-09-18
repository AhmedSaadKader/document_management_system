import { connectionSQLResult } from '../utils/sql_query';
import crypto from 'crypto';
import { OTPExpiredError, OTPInvalidError } from '../middleware/error_handler';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export type UserOTP = {
  /** Primary key for the user OTP record */
  id?: number;

  /** Email associated with the OTP */
  email: string;

  /** OTP code */
  otp_code: string;

  /** Expiry timestamp */
  expires_at: string;

  /** Whether the OTP has been used */
  used: boolean;

  /** Timestamp for when the OTP was created */
  created_at?: string;
};

/**
 * Class responsible for managing OTP-related operations.
 */

export class UserOTPModel {
  /**
   * Generates an OTP for a given email and saves it to the database, then sends the OTP via email.
   *
   * @param email - The email address to generate the OTP for.
   * @returns The generated OTP code.
   */
  async generateOTP(email: string): Promise<string> {
    const otpCode = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 10 * 60000).toISOString(); // Expires in 10 minutes

    const sql = `
      INSERT INTO user_otps (email, otp_code, expires_at)
      VALUES ($1, $2, $3) RETURNING otp_code
    `;

    const result = await connectionSQLResult(sql, [email, otpCode, expiresAt]);

    // Send OTP via email
    await this.sendOTPEmail(email, otpCode);

    return result.rows[0].otp_code;
  }

  /**
   * Sends the OTP to the provided email address using Nodemailer.
   *
   * @param email - The recipient's email address.
   * @param otpCode - The OTP code to send.
   */
  private async sendOTPEmail(email: string, otpCode: string): Promise<void> {
    // Create a transporter using your SMTP service
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // e.g., smtp.gmail.com
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // SMTP user (your email)
        pass: process.env.SMTP_PASS, // SMTP password (your email password)
      },
    });

    // Send mail
    await transporter.sendMail({
      from: process.env.SMTP_USER, // Sender address (your email)
      to: email, // Recipient email
      subject: 'Your OTP Code', // Subject line
      text: `Your OTP code is ${otpCode}. It is valid for 10 minutes.`, // Plain text body
    });
  }

  async verifyOTP(email: string, otpCode: string): Promise<boolean> {
    const sql = `
      SELECT * FROM user_otps
      WHERE email = $1 AND otp_code = $2 AND used = FALSE
    `;
    const result = await connectionSQLResult(sql, [email, otpCode]);

    if (result.rows.length === 0) {
      throw new OTPInvalidError(); // Invalid OTP or already used
    }

    const otpRecord: UserOTP = result.rows[0];

    if (new Date(otpRecord.expires_at) < new Date()) {
      throw new OTPExpiredError(); // OTP has expired
    }

    // Mark OTP as used
    const updateSql = 'UPDATE user_otps SET used = TRUE WHERE id = $1';
    await connectionSQLResult(updateSql, [otpRecord.id as number]);

    return true;
  }

  async cleanExpiredOTPs(): Promise<void> {
    const sql = 'DELETE FROM user_otps WHERE expires_at < NOW()';
    await connectionSQLResult(sql, []);
  }
}
