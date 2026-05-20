const { createRequire } = require('module');
const requireFromProject = createRequire('/home/runner/workspace/api-server/server.mjs');

let pg;
try {
  pg = requireFromProject('pg');
} catch (e) {
  try {
    pg = require('/home/runner/workspace/node_modules/pg');
  } catch (e2) {
    try {
      pg = require('/home/runner/workspace/api-server/node_modules/pg');
    } catch (e3) {
      console.error('Could not load pg from workspace or api-server node_modules.');
      console.error('Try: npm install pg');
      process.exit(1);
    }
  }
}

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false
});

const sql = `
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS final_estimated_price NUMERIC,
  ADD COLUMN IF NOT EXISTS pricing_state_code TEXT,
  ADD COLUMN IF NOT EXISTS pricing_market_label TEXT,
  ADD COLUMN IF NOT EXISTS pricing_note TEXT,
  ADD COLUMN IF NOT EXISTS sqft_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS pricing_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS commercial_restrooms INTEGER,
  ADD COLUMN IF NOT EXISTS commercial_breakrooms INTEGER,
  ADD COLUMN IF NOT EXISTS restroom_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS breakroom_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS supplies_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS commercial_subtotal_before_minimum NUMERIC,
  ADD COLUMN IF NOT EXISTS commercial_minimum NUMERIC,
  ADD COLUMN IF NOT EXISTS commercial_minimum_applied BOOLEAN,
  ADD COLUMN IF NOT EXISTS zip_plus4 TEXT,
  ADD COLUMN IF NOT EXISTS postal_code_full TEXT,
  ADD COLUMN IF NOT EXISTS address_validated BOOLEAN,
  ADD COLUMN IF NOT EXISTS cleaner_count INTEGER,
  ADD COLUMN IF NOT EXISTS additional_service_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS minimum_visit_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS selected_service_window_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS final_service_window_hours NUMERIC,
  ADD COLUMN IF NOT EXISTS property_type TEXT,
  ADD COLUMN IF NOT EXISTS sqft_verification_required BOOLEAN;
`;

pool.query(sql)
  .then(() => {
    console.log('OK: bookings table columns verified.');
  })
  .catch((e) => {
    console.error('Migration failed:', e.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
