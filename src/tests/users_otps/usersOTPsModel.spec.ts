import {
  describe,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
  it,
} from '@jest/globals';
import { UserOTPModel } from '../../models/user_otp';
import { connectionSQLResult } from '../../utils/sql_query';
import { OTPInvalidError } from '../../middleware/error_handler';
import { server } from '../../app';

describe('UserOTP Model Unit Tests', () => {
  let userOTPModel: UserOTPModel;

  beforeAll(async () => {
    // Setup the database with test data if necessary
  });

  beforeEach(() => {
    userOTPModel = new UserOTPModel();
  });

  afterEach(async () => {
    // Clean up any test data
    await connectionSQLResult('DELETE FROM users_otps WHERE email LIKE $1', [
      'john.doe%',
    ]);
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should generate, verify, and clean an OTP', async () => {
    const email = 'asa.next@gmail.com';

    // Generate an OTP
    const otpCode = await userOTPModel.generateOTP(email);
    expect(otpCode).toHaveLength(6);

    // Verify the OTP
    const isVerified = await userOTPModel.verifyOTP(email, otpCode);
    expect(isVerified).toBe(true);

    // Check if OTP is marked as used
    const result = await connectionSQLResult(
      'SELECT * FROM users_otps WHERE email = $1',
      [email]
    );
    expect(result.rows[0].used).toBe(true);

    // Test for invalid OTP
    await expect(userOTPModel.verifyOTP(email, '123456')).rejects.toThrow(
      OTPInvalidError
    );

    // Test for expired OTP
    // Manually expire the OTP
    await connectionSQLResult(
      "UPDATE users_otps SET expires_at = NOW() - INTERVAL '1 minute' WHERE email = $1",
      [email]
    );
    await expect(userOTPModel.verifyOTP(email, otpCode)).rejects.toThrow(
      OTPInvalidError
    );

    // Test for cleaning expired OTPs
    await userOTPModel.cleanExpiredOTPs();
    const cleanedResult = await connectionSQLResult(
      'SELECT * FROM users_otps WHERE email = $1',
      [email]
    );
    expect(cleanedResult.rows.length).toBe(0);
  }, 30000);
});
