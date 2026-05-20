const { createRequire } = require('module');
const requireFromProject = createRequire('/home/runner/workspace/api-server/server.mjs');
const pg = requireFromProject('pg');
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false
});

pool.query(`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'bookings'
  ORDER BY ordinal_position;
`)
.then(r => {
  console.log(r.rows.map(x => x.column_name).join('\\n'));
})
.catch(e => {
  console.error(e.message);
  process.exitCode = 1;
})
.finally(() => pool.end());
