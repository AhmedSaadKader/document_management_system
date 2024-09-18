CREATE TABLE IF NOT EXISTS user_otps (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL,   -- The email address associated with the OTP
  otp_code VARCHAR(10) NOT NULL, -- The OTP code, adjust length as needed
  expires_at TIMESTAMP NOT NULL, -- Expiration timestamp for the OTP
  used BOOLEAN DEFAULT FALSE,    -- Status to track if OTP has been used
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookup
CREATE INDEX idx_user_otps_email ON user_otps(email);
