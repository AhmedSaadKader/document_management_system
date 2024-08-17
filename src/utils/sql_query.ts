import client from '../database';

export const connectionSQLResult = async (
  sqlQuery: string,
  sqlParams: (string | number)[]
) => {
  try {
    const conn = await client.connect();
    const result = await conn.query(sqlQuery, [...sqlParams]);
    conn.release();
    return result;
  } catch (err) {
    throw new Error(`Error in sql connection or query: ${err}`);
  }
};
