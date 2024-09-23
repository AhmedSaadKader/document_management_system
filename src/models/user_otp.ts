import { connectionSQLResult } from '../utils/sql_query';
import crypto from 'crypto';
import { OTPInvalidError } from '../middleware/error_handler';
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
  async generateOTP(
    email: string,
    emailSubject: string,
    emailMessage: string
  ): Promise<string> {
    const otpCode = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 10 * 60000).toISOString(); // Expires in 10 minutes

    // Insert new OTP or update if email already exists
    const sql = `
      INSERT INTO users_otps (email, otp_code, expires_at, used)
      VALUES ($1, $2, $3, FALSE)
      ON CONFLICT (email) 
      DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at, used = FALSE
      RETURNING otp_code
    `;

    const result = await connectionSQLResult(sql, [email, otpCode, expiresAt]);

    // Send OTP via email
    await this.sendOTPEmail(email, otpCode, emailSubject, emailMessage);

    return result.rows[0].otp_code;
  }

  /**
   * Sends the OTP to the provided email address using Nodemailer.
   *
   * @param email - The recipient's email address.
   * @param otpCode - The OTP code to send.
   */
  private async sendOTPEmail(
    email: string,
    otpCode: string,
    emailSubject: string,
    emailMessage: string
  ): Promise<void> {
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
      subject: emailSubject,
      text:
        emailMessage +
        '\n' +
        `Your OTP code is ${otpCode}. It is valid for 10 minutes.`, // Plain text body
    });
  }

  async verifyOTP(email: string, otpCode: string): Promise<boolean> {
    const sql = `
    SELECT * FROM users_otps
    WHERE email = $1 AND otp_code = $2 AND used = FALSE AND expires_at > NOW()
    `;
    const result = await connectionSQLResult(sql, [email, otpCode]);

    if (result.rows.length === 0) {
      throw new OTPInvalidError();
    }

    // Mark OTP as used
    const updateSql = 'UPDATE users_otps SET used = TRUE WHERE email = $1';
    await connectionSQLResult(updateSql, [email]);

    return true;
  }

  async cleanExpiredOTPs(): Promise<void> {
    const sql = 'DELETE FROM users_otps WHERE expires_at < NOW()';
    await connectionSQLResult(sql, []);
  }
}
