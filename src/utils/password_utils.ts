import bcrypt from 'bcrypt';

const { BCRYPT_PASSWORD, SALT_ROUNDS } = process.env;

export const hashPassword = (password: string): string => {
  return bcrypt.hashSync(
    password + BCRYPT_PASSWORD,
    parseInt(SALT_ROUNDS as string)
  );
};

export const comparePassword = (
  password: string,
  hashedPassword: string
): boolean => {
  return bcrypt.compareSync(
    password + process.env.BCRYPT_PASSWORD,
    hashedPassword
  );
};
