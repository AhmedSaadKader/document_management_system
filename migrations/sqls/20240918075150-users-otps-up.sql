CREATE TABLE IF NOT EXISTS users_otps (
  email VARCHAR(100) PRIMARY KEY,
  otp_code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SET timezone = 'UTC'; 

-- Index for faster lookup
CREATE INDEX idx_users_otps_email ON users_otps(email);
