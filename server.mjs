import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '-refresh';
const DB_URL = process.env.DATABASE_URL;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// === DB POOL ===
function getPool() {
  return new pg.Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
}

// === AUTH MIDDLEWARE ===
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch { return res.status(401).json({ error: 'Invalid token' }); }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

// === PRICING ENGINE ===
const STATE_TIERS = {
  NJ:'A',NY:'A',CT:'A',CA:'A',MA:'A',WA:'A',DC:'A',HI:'A',AK:'A',RI:'A',NH:'A',
  FL:'B',TX:'B',IL:'B',CO:'B',MD:'B',VA:'B',OR:'B',AZ:'B',NV:'B',UT:'B',DE:'B',VT:'B',
  GA:'C',NC:'C',TN:'C',OH:'C',PA:'C',MI:'C',MN:'C',WI:'C',SC:'C',ME:'C',
  AL:'D',AR:'D',LA:'D',MS:'D',MO:'D',KY:'D',IN:'D',OK:'D',WV:'D',KS:'D',
  NE:'D',IA:'D',NM:'D',ID:'D',MT:'D',WY:'D',SD:'D',ND:'D',
};
const TIER_MULTI = { A:1.20, B:1.00, C:0.90, D:0.85 };

const SERVICE_RATES = {
  HOUSE_CLEANING:    { rate:0.15, min:120, commercial:false },
  DEEP_CLEANING:     { rate:0.20, min:150, commercial:false },
  MOVE_IN_OUT:       { rate:0.28, min:200, commercial:false },
  SAME_DAY_CLEANING: { rate:0.18, min:130, commercial:false },
  OFFICE_CLEANING:   { rate:0.14, min:150, commercial:true  },
  POST_CONSTRUCTION: { rate:0.22, min:180, commercial:true  },
  MEDICAL_CLEANING:  { rate:0.32, min:250, commercial:true  },
  CARPET_CLEANING:   { rate:0.18, min:130, commercial:false },
  WINDOW_CLEANING:   { rate:0.16, min:120, commercial:false },
  ORGANIZING:        { rate:0.15, min:120, commercial:false },
};

const FREQ_DISC = { ONE_TIME:0, WEEKLY:0.15, BI_WEEKLY:0.10, MONTHLY:0.05 };

const ROOM_SQFT_MIN = {
  '0-1':400,'1-1':500,'1-2':650,'2-1':750,'2-2':1000,
  '3-2':1200,'3-3':1500,'4-2':1800,'4-3':2200,'4-4':2600,
  '5-3':2800,'5-4':3200,'6-4':3800,
};

const CAR_WASH_RATES = {
  COMPACT:  { BASIC:45, STANDARD:65, INTERIOR:60, FULL:95,  PREMIUM:130, VIP:180 },
  SEDAN:    { BASIC:50, STANDARD:70, INTERIOR:65, FULL:105, PREMIUM:140, VIP:195 },
  SUV_MID:  { BASIC:60, STANDARD:85, INTERIOR:75, FULL:125, PREMIUM:165, VIP:220 },
  SUV_LG:   { BASIC:70, STANDARD:95, INTERIOR:85, FULL:140, PREMIUM:185, VIP:245 },
  SUV_XL:   { BASIC:80, STANDARD:110,INTERIOR:95, FULL:160, PREMIUM:210, VIP:275 },
  TRUCK_S:  { BASIC:65, STANDARD:90, INTERIOR:80, FULL:130, PREMIUM:170, VIP:230 },
  TRUCK_DC: { BASIC:75, STANDARD:100,INTERIOR:90, FULL:150, PREMIUM:195, VIP:260 },
  TRUCK_HD: { BASIC:90, STANDARD:120,INTERIOR:105,FULL:175, PREMIUM:225, VIP:295 },
  VAN:      { BASIC:80, STANDARD:105,INTERIOR:95, FULL:155, PREMIUM:200, VIP:265 },
};

const CAR_WASH_ADDONS = { OZONE:35, PAINT_LIGHT:60, CERAMIC:120, ENGINE:45 };

function getStateTier(state) {
  const tier = STATE_TIERS[state?.toUpperCase()] || 'B';
  return { tier, multiplier: TIER_MULTI[tier] };
}

function estimatedHours(sqft) {
  if (sqft <= 1000) return 2;
  if (sqft <= 2000) return 3;
  if (sqft <= 3500) return 4;
  return 5;
}

function calcCleaningPrice({ serviceType, sqft, bedrooms, bathrooms, state = 'NJ', frequency = 'ONE_TIME' }) {
  const cfg = SERVICE_RATES[serviceType];
  if (!cfg) return null;
  const { tier, multiplier } = getStateTier(state);
  const disc = FREQ_DISC[frequency] ?? 0;
  let sqftUsed = sqft || 0;
  let sqftCorrected = false;
  if (bedrooms != null && bathrooms != null) {
    const minSqft = ROOM_SQFT_MIN[`${bedrooms}-${bathrooms}`];
    if (minSqft && sqftUsed < minSqft) { sqftUsed = minSqft; sqftCorrected = true; }
  }
  if (sqftUsed <= 0) return null;
  const base  = Math.max(sqftUsed * cfg.rate * multiplier, cfg.min * multiplier);
  const price = parseFloat((base * (1 - disc)).toFixed(2));
  const hours = estimatedHours(sqftUsed);
  return { clientPrice: price, hours, sqftUsed, sqftCorrected, tier, multiplier, maxPayout: parseFloat((price * 0.55).toFixed(2)) };
}

function calcCarWashPrice({ vehicleCode, pkg, addons = [] }) {
  const veh = CAR_WASH_RATES[vehicleCode];
  if (!veh) return null;
  const base = veh[pkg];
  if (!base) return null;
  const addonsTotal = addons.reduce((s, a) => s + (CAR_WASH_ADDONS[a] || 0), 0);
  const clientPrice = base + addonsTotal;
  return { clientPrice, proBase: parseFloat((clientPrice * 0.55).toFixed(2)), platformFee: parseFloat((clientPrice * 0.45).toFixed(2)) };
}

function calcProPayout(hourlyRate, hours, clientPrice) {
  return Math.min(parseFloat((hourlyRate * hours).toFixed(2)), parseFloat((clientPrice * 0.55).toFixed(2)));
}

// === HEALTHZ ===
app.get('/api/healthz', (_, res) => res.json({ status: 'ok' }));

// === AUTH ===
app.post('/api/auth/login', async (req, res) => {
  const { email, password, phone } = req.body;
  const pool = getPool();
  try {
    let user;
    if (email && password) {
      const r = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      user = r.rows[0];
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    } else if (phone) {
      const r = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
      user = r.rows[0];
      if (!user) return res.status(401).json({ error: 'User not found' });
    } else {
      return res.status(400).json({ error: 'Email+password or phone required' });
    }
    const accessToken  = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
    res.json({ accessToken, refreshToken, role: user.role, userId: user.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const pool = getPool();
    const r = await pool.query('SELECT * FROM users WHERE id = $1', [payload.sub]);
    await pool.end();
    const user = r.rows[0];
    if (!user) return res.status(401).json({ error: 'User not found' });
    const accessToken = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ accessToken });
  } catch { res.status(401).json({ error: 'Invalid refresh token' }); }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query('SELECT id, email, phone, role, created_at as "createdAt", name FROM users WHERE id = $1', [req.user.sub]);
    res.json(r.rows[0] || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, phone, role, name } = req.body;
  const pool = getPool();
  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      'INSERT INTO users (email, password_hash, phone, role, name) VALUES ($1,$2,$3,$4,$5) RETURNING id, email, role',
      [email, hash, phone, role || 'CLIENT', name]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// === QUOTE (público) ===
app.get('/api/quote', async (req, res) => {
  const { service, sqft, state = 'NJ', frequency = 'ONE_TIME', bedrooms, bathrooms, vehicle_code, package: pkg, addons } = req.query;
  if (!service) return res.status(400).json({ error: 'service required' });

  if (SERVICE_RATES[service]) {
    const result = calcCleaningPrice({
      serviceType: service, sqft: parseInt(sqft) || 0, state, frequency,
      bedrooms: bedrooms != null ? parseInt(bedrooms) : null,
      bathrooms: bathrooms != null ? parseInt(bathrooms) : null,
    });
    if (!result) return res.status(400).json({ error: 'Invalid sqft or service' });
    return res.json({
      type: 'cleaning', service, ...result,
      proPayoutAt18: calcProPayout(18, result.hours, result.clientPrice),
      proPayoutAt22: calcProPayout(22, result.hours, result.clientPrice),
      proPayoutAt30: calcProPayout(30, result.hours, result.clientPrice),
    });
  }
  if (service === 'CAR_WASH') {
    if (!vehicle_code || !pkg) return res.status(400).json({ error: 'vehicle_code and package required' });
    const addonList = addons ? (Array.isArray(addons) ? addons : addons.split(',')) : [];
    const result = calcCarWashPrice({ vehicleCode: vehicle_code, pkg, addons: addonList });
    if (!result) return res.status(400).json({ error: 'Invalid vehicle_code or package' });
    return res.json({ type: 'car_wash', service, vehicle_code, package: pkg, ...result });
  }
  if (service === 'LAUNDRY_PICKUP') {
    const lbs = Math.max(parseFloat(req.query.weight_lbs) || 10, 10);
    const clientPrice = Math.max(lbs * 3 + 30, 60);
    return res.json({ type: 'laundry', service, clientPrice, weightLbs: lbs, proBase: parseFloat((clientPrice * 0.55).toFixed(2)), platformFee: parseFloat((clientPrice * 0.45).toFixed(2)) });
  }
  if (service === 'DRY_CLEANING') {
    const items = parseInt(req.query.item_count) || 1;
    const clientPrice = items * 12;
    return res.json({ type: 'dry_cleaning', service, clientPrice, itemCount: items, proBase: parseFloat((clientPrice * 0.55).toFixed(2)), platformFee: parseFloat((clientPrice * 0.45).toFixed(2)) });
  }
  return res.status(400).json({ error: `Unknown service: ${service}` });
});

// === CAR WASH VEHICLES CATALOG ===
app.get('/api/car-wash/vehicles', (_, res) => {
  const vehicles = Object.entries(CAR_WASH_RATES).map(([code, pkgs]) => ({ code, packages: pkgs }));
  res.json({ vehicles });
});

// === BOOKINGS ===
app.get('/api/bookings', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const { role, sub } = req.user;
    let query, params = [];
    if (role === 'ADMIN') {
      query = `SELECT b.*, c.name as "companyName", c.contact_name as "contactName",
        (SELECT json_agg(json_build_object('professional', json_build_object('id',p.id,'fullName',p.full_name,'avgRating',p.avg_rating)))
         FROM booking_professionals bp JOIN professionals p ON p.id=bp.professional_id WHERE bp.booking_id=b.id) as professionals
        FROM bookings b LEFT JOIN companies c ON c.id=b.company_id ORDER BY b.created_at DESC LIMIT $1`;
      params = [req.query.limit || 100];
    } else if (role === 'PROFESSIONAL') {
      query = `SELECT b.*, c.name as "companyName"
        FROM bookings b JOIN booking_professionals bp ON bp.booking_id=b.id JOIN professionals p ON p.id=bp.professional_id
        LEFT JOIN companies c ON c.id=b.company_id WHERE p.user_id=$1 ORDER BY b.created_at DESC`;
      params = [sub];
    } else {
      query = `SELECT b.*,
        (SELECT json_agg(json_build_object('professional', json_build_object('id',p.id,'fullName',p.full_name,'avgRating',p.avg_rating,'phone',p.phone)))
         FROM booking_professionals bp JOIN professionals p ON p.id=bp.professional_id WHERE bp.booking_id=b.id) as professionals
        FROM bookings b WHERE b.company_id IN (SELECT id FROM companies WHERE user_id=$1) ORDER BY b.created_at DESC`;
      params = [sub];
    }
    const r = await pool.query(query, params);
    res.json({ data: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.post('/api/bookings', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const {
      serviceType, service_type, frequency = 'ONE_TIME',
      sqft, bedrooms, bathrooms, state = 'NJ',
      address, city, zip, zip_code,
      scheduledAt, scheduled_date, scheduled_time, notes,
      vehicle_code, package: carPkg, car_wash_addons = [],
      weight_lbs, item_count,
    } = req.body;

    const svcType = service_type || serviceType;
    const zipFinal = zip_code || zip;
    const schedAt = scheduledAt || (scheduled_date && scheduled_time ? `${scheduled_date}T${scheduled_time}:00` : null);

    if (!svcType || !address || !schedAt) return res.status(400).json({ error: 'serviceType, address and scheduledAt required' });

    let clientPrice, hours = null, sqftUsed = null, sqftCorrected = false;
    let vehicleCode = null, carPackage = null, weightLbs = null, itemCount = null;

    if (SERVICE_RATES[svcType]) {
      const calc = calcCleaningPrice({ serviceType: svcType, sqft: parseInt(sqft) || 0, bedrooms, bathrooms, state, frequency });
      if (!calc) return res.status(400).json({ error: 'Invalid sqft or service' });
      clientPrice = calc.clientPrice; hours = calc.hours; sqftUsed = calc.sqftUsed; sqftCorrected = calc.sqftCorrected;
    } else if (svcType === 'CAR_WASH') {
      if (!vehicle_code || !carPkg) return res.status(400).json({ error: 'vehicle_code and package required' });
      const calc = calcCarWashPrice({ vehicleCode: vehicle_code, pkg: carPkg, addons: car_wash_addons });
      if (!calc) return res.status(400).json({ error: 'Invalid vehicle or package' });
      clientPrice = calc.clientPrice; vehicleCode = vehicle_code; carPackage = carPkg;
    } else if (svcType === 'LAUNDRY_PICKUP') {
      weightLbs = Math.max(parseFloat(weight_lbs) || 10, 10);
      clientPrice = Math.max(weightLbs * 3 + 30, 60);
    } else if (svcType === 'DRY_CLEANING') {
      itemCount = parseInt(item_count) || 1;
      clientPrice = itemCount * 12;
    } else {
      return res.status(400).json({ error: `Unknown service: ${svcType}` });
    }

    const platformFee = parseFloat((clientPrice * 0.45).toFixed(2));

    // Compatibilidad con schema existente: usar company_id si existe
    const compRes = await pool.query('SELECT id FROM companies WHERE user_id=$1 LIMIT 1', [req.user.sub]);
    const companyId = compRes.rows[0]?.id || null;

    const r = await pool.query(
      `INSERT INTO bookings (
         company_id, service_type, frequency, sqft, hours, bedrooms, bathrooms, state,
         address, city, zip, scheduled_at, notes,
         client_price, platform_fee, payout_status,
         vehicle_code, car_wash_package,
         weight_lbs, item_count, sqft_validated, status, created_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
         $14,$15,'pending',$16,$17,$18,$19,$20,'PENDING_ASSIGNMENT',NOW()
       ) RETURNING *`,
      [companyId, svcType, frequency, sqftUsed, hours, bedrooms||null, bathrooms||null, state,
       address, city, zipFinal, schedAt, notes,
       clientPrice, platformFee, vehicleCode, carPackage,
       weightLbs, itemCount, sqftCorrected]
    );
    res.json({ booking: r.rows[0], sqft_corrected: sqftCorrected });
  } catch (e) { console.error('POST /api/bookings:', e.message); res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// MARKETPLACE CON SUBASTA ESCALONADA
app.get('/api/bookings/available', requireAuth, requireRole('PROFESSIONAL'), async (req, res) => {
  const pool = getPool();
  try {
    const proRes = await pool.query('SELECT id, hourly_rate FROM professionals WHERE user_id=$1', [req.user.sub]);
    const pro = proRes.rows[0];
    if (!pro) return res.status(404).json({ error: 'Professional not found' });
    const rate = parseFloat(pro.hourly_rate || 18);

    // Subasta escalonada
    let minMinutes;
    if (rate <= 18)      minMinutes = 0;
    else if (rate <= 19) minMinutes = 5;
    else if (rate <= 20) minMinutes = 10;
    else if (rate <= 30) minMinutes = 15;
    else                 minMinutes = 30;

    const r = await pool.query(
      `SELECT b.*,
         EXTRACT(EPOCH FROM (NOW() - b.created_at)) / 60 AS minutes_posted,
         LEAST($2::numeric * COALESCE(b.hours, 2), COALESCE(b.client_price,0) * 0.55) AS estimated_payout
       FROM bookings b
       WHERE b.status = 'PENDING_ASSIGNMENT'
         AND EXTRACT(EPOCH FROM (NOW() - b.created_at)) / 60 >= $1
         AND (
           b.service_type NOT IN ('OFFICE_CLEANING','POST_CONSTRUCTION','MEDICAL_CLEANING')
           OR $2::numeric BETWEEN 18 AND 22
         )
       ORDER BY b.created_at ASC`,
      [minMinutes, rate]
    );

    const data = r.rows.map(b => {
      const mins = parseFloat(b.minutes_posted);
      const zone = mins < 5 ? '$18/hr only' : mins < 10 ? 'Up to $19/hr' : mins < 15 ? 'Up to $20/hr' : mins < 30 ? 'Open $18-$30' : 'Open all rates';
      return {
        ...b,
        serviceType: b.service_type,
        scheduledAt: b.scheduled_at,
        minutes_posted: parseFloat(mins.toFixed(1)),
        auction_zone: zone,
        estimated_payout: parseFloat((b.estimated_payout || 0).toFixed(2)),
        tip: rate > 18 ? `Lowering your rate increases job visibility` : null,
      };
    });

    res.json({ pro_rate: rate, auction_delay_minutes: minMinutes, count: data.length, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.get('/api/bookings/admin/stats', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query(`SELECT status, COUNT(*)::int as count, SUM(COALESCE(total_amount,COALESCE(client_price,0)))::numeric as total FROM bookings GROUP BY status`);
    res.json({ stats: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.get('/api/bookings/:id', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query('SELECT * FROM bookings WHERE id=$1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.post('/api/bookings/:id/claim', requireAuth, requireRole('PROFESSIONAL'), async (req, res) => {
  const pool = getPool();
  try {
    const proRes = await pool.query('SELECT id, full_name, hourly_rate FROM professionals WHERE user_id=$1', [req.user.sub]);
    const pro = proRes.rows[0];
    if (!pro) return res.status(404).json({ error: 'Professional not found' });
    const b = await pool.query('SELECT * FROM bookings WHERE id=$1', [req.params.id]);
    if (!b.rows[0]) return res.status(404).json({ error: 'Booking not found' });
    if (b.rows[0].status !== 'PENDING_ASSIGNMENT') return res.status(400).json({ error: 'Already assigned' });
    await pool.query('INSERT INTO booking_professionals (booking_id, professional_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, pro.id]);
    const scheduledAt = req.body.scheduledAt || b.rows[0].scheduled_at;
    const clientPrice = parseFloat(b.rows[0].client_price || 0);
    const hours = parseInt(b.rows[0].hours || 2);
    const payout = calcProPayout(parseFloat(pro.hourly_rate || 18), hours, clientPrice);
    await pool.query("UPDATE bookings SET status='CONFIRMED', scheduled_at=$2, payout_amount=$3 WHERE id=$1", [req.params.id, scheduledAt, payout]);
    res.json({ scheduledAt, payout, proName: pro.full_name });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.post('/api/bookings/:id/checkin', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    await pool.query("UPDATE bookings SET status='IN_PROGRESS', checked_in_at=NOW() WHERE id=$1", [req.params.id]);
    res.json({ status: 'IN_PROGRESS' });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.post('/api/bookings/:id/checkout', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    await pool.query("UPDATE bookings SET status='COMPLETED', checked_out_at=NOW() WHERE id=$1", [req.params.id]);
    res.json({ status: 'COMPLETED' });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.post('/api/bookings/:id/rate', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const { rating, tip } = req.body;
    await pool.query('UPDATE bookings SET rating=$2, tip=$3, rated=true WHERE id=$1', [req.params.id, rating, tip || 0]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.get('/api/bookings/:id/eta', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const proRes = await pool.query('SELECT lat, lng, full_name FROM professionals WHERE user_id=$1', [req.user.sub]);
    if (!proRes.rows[0]) return res.status(404).json({ error: 'Professional not found' });
    const pro = proRes.rows[0];
    const bRes = await pool.query('SELECT lat, lng, address, city, state, zip FROM bookings WHERE id=$1', [req.params.id]);
    if (!bRes.rows[0]) return res.status(404).json({ error: 'Booking not found' });
    const b = bRes.rows[0];
    let distanceMiles = 0, etaMinutes = 0;
    if (pro.lat && pro.lng && b.lat && b.lng) {
      const R = 3958.8;
      const dLat = ((Number(b.lat)-Number(pro.lat))*Math.PI)/180;
      const dLng = ((Number(b.lng)-Number(pro.lng))*Math.PI)/180;
      const a = Math.pow(Math.sin(dLat/2),2) + Math.cos(Number(pro.lat)*Math.PI/180)*Math.cos(Number(b.lat)*Math.PI/180)*Math.pow(Math.sin(dLng/2),2);
      distanceMiles = R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
      etaMinutes = Math.ceil((distanceMiles/25)*60)+5;
    }
    const dest = encodeURIComponent(`${b.address||''}, ${b.city||''}, ${b.state||''} ${b.zip||''}`);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${pro.lat},${pro.lng}&destination=${dest}`;
    const previewUrl = `https://www.google.com/maps?q=${dest}`;
    try {
      const cRes = await pool.query(
        'SELECT u.phone FROM companies c JOIN users u ON u.id=c.user_id WHERE c.id=(SELECT company_id FROM bookings WHERE id=$1) LIMIT 1',
        [req.params.id]);
      if (cRes.rows[0]?.phone && process.env.TWILIO_ACCOUNT_SID) {
        const twilio = (await import('twilio')).default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const etaStr = etaMinutes < 60 ? etaMinutes+' min' : Math.floor(etaMinutes/60)+'h '+(etaMinutes%60)+'min';
        await twilio.messages.create({ body: `EverClean: ${pro.full_name} is on the way! ETA: ${etaStr}`, from: process.env.TWILIO_PHONE_NUMBER, to: cRes.rows[0].phone });
      }
    } catch (e2) { console.error('ETA notify:', e2.message); }
    res.json({ distanceMiles: Math.round(distanceMiles*10)/10, etaMinutes, etaText: etaMinutes<60?`${etaMinutes} min`:`${Math.floor(etaMinutes/60)}h ${etaMinutes%60}min`, mapsUrl, previewUrl, proName: pro.full_name });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.patch('/api/bookings/:id/status', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    await pool.query('UPDATE bookings SET status=$2 WHERE id=$1', [req.params.id, req.body.status]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// === PAYOUTS ===
app.get('/api/payouts/me', requireAuth, requireRole('PROFESSIONAL'), async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query(
      `SELECT b.id, b.service_type, b.scheduled_at, b.client_price, b.payout_amount, b.platform_fee, b.payout_status, b.hours, b.sqft, b.state
       FROM bookings b JOIN booking_professionals bp ON bp.booking_id=b.id JOIN professionals p ON p.id=bp.professional_id
       WHERE p.user_id=$1 AND b.status IN ('COMPLETED') ORDER BY b.scheduled_at DESC`,
      [req.user.sub]);
    const total   = r.rows.reduce((s, x) => s + parseFloat(x.payout_amount || 0), 0);
    const paid    = r.rows.filter(x => x.payout_status === 'paid').reduce((s, x) => s + parseFloat(x.payout_amount || 0), 0);
    const pending = r.rows.filter(x => x.payout_status === 'pending').reduce((s, x) => s + parseFloat(x.payout_amount || 0), 0);
    res.json({ summary: { total_earned: +total.toFixed(2), total_paid: +paid.toFixed(2), pending_payout: +pending.toFixed(2) }, payouts: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.post('/api/payouts/:bookingId/process', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const pool = getPool();
  try {
    const { bookingId } = req.params;
    const b = await pool.query(
      `SELECT b.*, p.hourly_rate FROM bookings b
       JOIN booking_professionals bp ON bp.booking_id=b.id JOIN professionals p ON p.id=bp.professional_id
       WHERE b.id=$1 LIMIT 1`, [bookingId]);
    if (!b.rows[0]) return res.status(404).json({ error: 'Booking not found' });
    const booking = b.rows[0];
    const payout  = calcProPayout(parseFloat(booking.hourly_rate || 18), parseInt(booking.hours || 2), parseFloat(booking.client_price || 0));
    const fee     = parseFloat((parseFloat(booking.client_price || 0) - payout).toFixed(2));
    const margin  = booking.client_price > 0 ? parseFloat((fee / parseFloat(booking.client_price) * 100).toFixed(1)) : 0;
    await pool.query("UPDATE bookings SET payout_amount=$1, platform_fee=$2, payout_status='processing' WHERE id=$3", [payout, fee, bookingId]);
    res.json({ booking_id: bookingId, client_price: booking.client_price, payout_amount: payout, platform_fee: fee, margin_pct: margin, note: margin < 45 ? '⚠️ Margin below 45%' : '✅ OK' });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.get('/api/payouts/admin/summary', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query(
      `SELECT COUNT(*)::int total_bookings, SUM(client_price) total_revenue, SUM(payout_amount) total_payouts,
              SUM(platform_fee) total_fees,
              ROUND(AVG(CASE WHEN client_price>0 THEN (client_price-COALESCE(payout_amount,0))/client_price*100 END),1) avg_margin,
              COUNT(*) FILTER (WHERE payout_status='pending') pending_count,
              SUM(payout_amount) FILTER (WHERE payout_status='pending') pending_amount
       FROM bookings WHERE status='COMPLETED'`);
    const byState = await pool.query(
      `SELECT state, COUNT(*)::int bookings, SUM(client_price) revenue, SUM(platform_fee) fees
       FROM bookings WHERE status='COMPLETED' GROUP BY state ORDER BY revenue DESC NULLS LAST LIMIT 20`);
    res.json({ summary: r.rows[0], by_state: byState.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// === PROFESSIONALS ===
app.get('/api/professionals', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query('SELECT * FROM professionals ORDER BY created_at DESC');
    res.json({ data: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.get('/api/professionals/me', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query('SELECT * FROM professionals WHERE user_id=$1', [req.user.sub]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Professional not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.patch('/api/professionals/me', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const { fullName, phone, email, bio, address, city, state, zipCode, serviceRadiusMiles, hourlyRate, payoutSchedule, language, servicesOffered } = req.body;
    const sets = [], vals = [];
    let i = 1;
    if (fullName !== undefined)           { sets.push(`full_name=$${i++}`);             vals.push(fullName); }
    if (phone !== undefined)              { sets.push(`phone=$${i++}`);                 vals.push(phone); }
    if (email !== undefined)              { sets.push(`email=$${i++}`);                 vals.push(email); }
    if (bio !== undefined)                { sets.push(`bio=$${i++}`);                   vals.push(bio); }
    if (address !== undefined)            { sets.push(`address=$${i++}`);               vals.push(address); }
    if (city !== undefined)               { sets.push(`city=$${i++}`);                  vals.push(city); }
    if (state !== undefined)              { sets.push(`state=$${i++}`);                 vals.push(state); }
    if (zipCode !== undefined)            { sets.push(`zip_code=$${i++}`);              vals.push(zipCode); }
    if (serviceRadiusMiles !== undefined) { sets.push(`service_radius_miles=$${i++}`);  vals.push(serviceRadiusMiles); }
    if (hourlyRate !== undefined)         { sets.push(`hourly_rate=$${i++}`);           vals.push(hourlyRate); }
    if (payoutSchedule !== undefined)     { sets.push(`payout_schedule=$${i++}`);       vals.push(payoutSchedule); }
    if (language !== undefined)           { sets.push(`language=$${i++}::text[]`);      vals.push(Array.isArray(language) ? language : []); }
    if (servicesOffered !== undefined)    { sets.push(`services_offered=$${i++}::text[]`); vals.push(Array.isArray(servicesOffered) ? servicesOffered : []); }
    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
    vals.push(req.user.sub);
    await pool.query(`UPDATE professionals SET ${sets.join(',')} WHERE user_id=$${i}`, vals);
    const r = await pool.query('SELECT * FROM professionals WHERE user_id=$1', [req.user.sub]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.get('/api/professionals/me/bookings', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query(
      `SELECT b.*, c.name as "companyName" FROM bookings b
       JOIN booking_professionals bp ON bp.booking_id=b.id JOIN professionals p ON p.id=bp.professional_id
       LEFT JOIN companies c ON c.id=b.company_id WHERE p.user_id=$1 ORDER BY b.created_at DESC`, [req.user.sub]);
    res.json({ data: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.patch('/api/professionals/me/availability', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    await pool.query('UPDATE professionals SET is_available=$2 WHERE user_id=$1', [req.user.sub, req.body.isAvailable]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// === COMPANIES ===
app.get('/api/companies/me', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query('SELECT * FROM companies WHERE user_id=$1', [req.user.sub]);
    res.json(r.rows[0] || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.patch('/api/companies/me', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const { name, billingAddress, billingCity, billingState, billingZip, taxId } = req.body;
    await pool.query(
      `UPDATE companies SET name=COALESCE($2,name), address=COALESCE($3,address), city=COALESCE($4,city), state=COALESCE($5,state), zip=COALESCE($6,zip), tax_id=COALESCE($7,tax_id) WHERE user_id=$1`,
      [req.user.sub, name, billingAddress, billingCity, billingState, billingZip, taxId]);
    const r = await pool.query('SELECT * FROM companies WHERE user_id=$1', [req.user.sub]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// === LEADS ===
app.get('/api/leads', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT $1', [req.query.limit || 100]);
    res.json({ data: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.post('/api/leads', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const { contactName, contactEmail, contactPhone, companyName, status } = req.body;
    const r = await pool.query(
      'INSERT INTO leads (contact_name,contact_email,contact_phone,company_name,status) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [contactName, contactEmail, contactPhone, companyName, status || 'NEW']);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// === STRIPE ===
import Stripe from 'stripe';
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2024-06-20' });

app.post('/api/stripe/payment-intent', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ error: 'bookingId required' });
    const b = await pool.query('SELECT * FROM bookings WHERE id=$1', [bookingId]);
    if (!b.rows[0]) return res.status(404).json({ error: 'Booking not found' });
    const amount = Math.round(parseFloat(b.rows[0].client_price || 0) * 100);
    if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    const pi = await stripe.paymentIntents.create({
      amount, currency: 'usd',
      metadata: { booking_id: bookingId, service_type: b.rows[0].service_type },
      receipt_email: req.user.email,
    });
    await pool.query('UPDATE bookings SET stripe_payment_intent_id=$1 WHERE id=$2', [pi.id, bookingId]);
    res.json({ clientSecret: pi.client_secret, paymentIntentId: pi.id, amount: amount / 100 });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.post('/api/stripe/connect/onboard', requireAuth, requireRole('PROFESSIONAL'), async (req, res) => {
  const pool = getPool();
  try {
    const proRes = await pool.query('SELECT * FROM professionals WHERE user_id=$1', [req.user.sub]);
    const pro = proRes.rows[0];
    if (!pro) return res.status(404).json({ error: 'Professional not found' });
    let accountId = pro.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express', country: 'US', email: pro.email || req.user.email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        metadata: { professional_id: pro.id },
      });
      accountId = account.id;
      await pool.query('UPDATE professionals SET stripe_account_id=$1 WHERE user_id=$2', [accountId, req.user.sub]);
    }
    const origin = req.headers.origin || 'https://everclean-client.vercel.app';
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/pro/profile?stripe=refresh`,
      return_url: `${origin}/pro/profile?stripe=success`,
      type: 'account_onboarding',
    });
    res.json({ url: link.url, accountId });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.get('/api/stripe/connect/status', requireAuth, requireRole('PROFESSIONAL'), async (req, res) => {
  const pool = getPool();
  try {
    const proRes = await pool.query('SELECT stripe_account_id FROM professionals WHERE user_id=$1', [req.user.sub]);
    const pro = proRes.rows[0];
    if (!pro?.stripe_account_id) return res.json({ connected: false });
    const account = await stripe.accounts.retrieve(pro.stripe_account_id);
    res.json({ connected: account.charges_enabled, payoutsEnabled: account.payouts_enabled, accountId: account.id, detailsSubmitted: account.details_submitted });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.get('/api/stripe/dashboard', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  try {
    const balance = await stripe.balance.retrieve();
    res.json({
      available: balance.available.map(b => ({ amount: b.amount / 100, currency: b.currency })),
      pending: balance.pending.map(b => ({ amount: b.amount / 100, currency: b.currency })),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// === START ===
app.listen(PORT, '0.0.0.0', () => console.log(`EverClean API listening on port ${PORT}`));
