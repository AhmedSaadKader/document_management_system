import bcrypt from 'bcrypt';

// Retrieve environment variables for bcrypt configuration
const { BCRYPT_PASSWORD, SALT_ROUNDS } = process.env;

/**
 * Hashes a password using bcrypt.
 *
 * @param password - The plaintext password to hash.
 * @returns The hashed password as a string.
 *
 * The function appends the `BCRYPT_PASSWORD` environment variable to the
 * plaintext password before hashing. The number of salt rounds used for
 * hashing is determined by the `SALT_ROUNDS` environment variable.
 *
 * Example usage:
 *
 * ```typescript
 * const hashedPassword = hashPassword('myPlainPassword');
 * ```
 */
export const hashPassword = (password: string): string => {
  return bcrypt.hashSync(
    password + BCRYPT_PASSWORD, // Concatenate plaintext password with BCRYPT_PASSWORD for added security
    parseInt(SALT_ROUNDS as string) // Convert SALT_ROUNDS to integer
  );
};

/**
 * Compares a plaintext password with a hashed password.
 *
 * @param password - The plaintext password to compare.
 * @param hashedPassword - The hashed password to compare against.
 * @returns A boolean indicating whether the plaintext password matches the hashed password.
 *
 * The function appends the `BCRYPT_PASSWORD` environment variable to the
 * plaintext password before comparison. This ensures the same transformation
 * is applied as during hashing.
 *
 * Example usage:
 *
 * ```typescript
 * const isMatch = comparePassword('myPlainPassword', hashedPassword);
 * ```
 */
export const comparePassword = (
  password: string,
  hashedPassword: string
): boolean => {
  return bcrypt.compareSync(password + BCRYPT_PASSWORD, hashedPassword);
};
