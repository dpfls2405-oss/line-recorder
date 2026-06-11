import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

pool.on('connect', (client) => {
  client.query(`SET search_path TO ${process.env.DB_SCHEMA ?? 'public'}`)
})

export default pool
