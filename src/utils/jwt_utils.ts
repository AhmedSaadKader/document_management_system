import jwt from 'jsonwebtoken';

/**
 * Creates a JSON Web Token (JWT) for authentication.
 *
 * @param id - The user ID to include in the token payload. Can be a number or a string.
 * @param email - The email to include in the token payload.
 * @returns A signed JWT as a string.
 *
 * The function uses the `TOKEN_SECRET` environment variable to sign the JWT.
 * The payload includes the `id` and `email` provided as arguments.
 * Ensure that `TOKEN_SECRET` is a strong and secure key stored in your environment
 * variables for signing the JWT.
 *
 * Example usage:
 *
 * ```typescript
 * const token = createJWT(1, 'john_doe');
 * ```
 */
export const createJWT = (
  national_id: string,
  email: string,
  firstName: string,
  lastName: string
): string => {
  return jwt.sign(
    { national_id, email, firstName, lastName },
    process.env.TOKEN_SECRET!,
    {
      expiresIn: '24h',
    }
  );
};
