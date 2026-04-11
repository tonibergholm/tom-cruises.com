import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: (string | number | boolean | null)[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  try {
    const result = await pool.query<T>(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: result.rowCount })
    return result
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect()
}

export default pool
