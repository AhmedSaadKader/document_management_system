import client from '../database';

/**
 * Executes an SQL query and returns the result.
 *
 * @param sqlQuery - The SQL query string to execute.
 * @param sqlParams - An array of parameters to be used in the SQL query.
 * @returns The result of the SQL query execution.
 *
 * This function connects to the PostgreSQL database using the `client` instance
 * imported from the `database` module, executes the provided SQL query with the
 * given parameters, and returns the result. The connection is released after
 * the query execution.
 *
 * If an error occurs during connection or query execution, it throws a
 * `DatabaseConnectionError` with details of the issue.
 *
 * Example usage:
 *
 * ```typescript
 * const result = await connectionSQLResult('SELECT * FROM users WHERE id = $1', [1]);
 * console.log(result.rows);
 * ```
 */
export const connectionSQLResult = async (
  sqlQuery: string,
  sqlParams: (string | number)[]
) => {
  const conn = await client.connect();
  try {
    // Execute the query
    const result = await conn.query(sqlQuery, [...sqlParams]);

    // Return the result of the query
    return result;
  } catch (err) {
    // Release the connection before throwing an error
    conn.release();

    // Throw a custom error from the error_handler module
    throw new DatabaseConnectionError(err as string);
  } finally {
    // Ensure the connection is released
    conn.release();
  }
};
