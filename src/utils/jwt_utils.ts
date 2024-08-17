import jwt from 'jsonwebtoken';

export const createJWT = (id: number | string, username: string): string => {
  return jwt.sign({ id, username }, process.env.TOKEN_SECRET as string);
};
