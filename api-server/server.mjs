import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '-refresh';
const DB_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());


// ═══════════════════════════════════════════════
// NOTIFICATION SYSTEM — Resend + Twilio
// ═══════════════════════════════════════════════

async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        from: 'EverClean <noreply@evercleanapp.com>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });
  } catch(e) { console.error('Email error:', e.message); }
}

async function sendSMS({ to, message }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from || !to) return;
  try {
    const auth = Buffer.from(sid + ':' + token).toString('base64');
    await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + auth },
      body: new URLSearchParams({ To: to, From: from, Body: message }).toString(),
    });
  } catch(e) { console.error('SMS error:', e.message); }
}

function bookingEmailHtml({ title, body, bookingId, cta, ctaUrl }) {
  return '<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">' +
    '<div style="background:linear-gradient(135deg,#0D3781,#1565C0);borderRadius:12px;padding:24px;color:#fff;marginBottom:24px">' +
    '<h1 style="margin:0;fontSize:22px">EverClean</h1></div>' +
    '<h2 style="color:#0D1B2A">' + title + '</h2>' +
    '<p style="color:#64748B;lineHeight:1.6">' + body + '</p>' +
    (cta ? '<a href="' + (ctaUrl||'https://evercleanapp.com') + '" style="display:inline-block;padding:12px 24px;background:#4CAF50;color:#fff;borderRadius:9999px;textDecoration:none;fontWeight:600;marginTop:16px">' + cta + '</a>' : '') +
    '<p style="color:#94A3B8;fontSize:12px;marginTop:32px">EverClean App — Your cleaning, simplified.</p></div>';
}

async function notifyBookingCreated(booking, clientEmail, clientPhone) {
  await sendEmail({
    to: clientEmail,
    subject: 'Booking Confirmed — EverClean #' + booking.id?.slice(0,8),
    html: bookingEmailHtml({
      title: 'Your booking is confirmed!',
      body: 'We received your request for ' + (booking.service_type||'').replace(/_/g,' ') + ' at ' + (booking.address||'') + ', ' + (booking.city||'') + ', ' + (booking.state||'') + '. We are finding the best professional for you.',
      cta: 'View Booking', ctaUrl: 'https://evercleanapp.com/dashboard',
    }),
  });
  await sendSMS({ to: clientPhone, message: 'EverClean: Your booking is confirmed! We will notify you when a professional is assigned. evercleanapp.com' });
}

async function notifyProAssigned(booking, clientEmail, clientPhone, proName) {
  await sendEmail({
    to: clientEmail,
    subject: 'Professional Assigned — ' + proName + ' is coming!',
    html: bookingEmailHtml({
      title: proName + ' will be your cleaner!',
      body: 'Great news! ' + proName + ' has been assigned to your service on ' + (booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleDateString() : '') + '. You will receive an ETA when they are on their way.',
      cta: 'Track Service', ctaUrl: 'https://evercleanapp.com/dashboard',
    }),
  });
  await sendSMS({ to: clientPhone, message: 'EverClean: ' + proName + ' has been assigned to your cleaning! Track at evercleanapp.com' });
}

async function notifyEtaSent(booking, clientEmail, clientPhone, etaMinutes) {
  const etaText = etaMinutes ? etaMinutes + ' minutes away' : 'on the way';
  await sendEmail({
    to: clientEmail,
    subject: 'Your cleaner is on the way!',
    html: bookingEmailHtml({
      title: 'Your cleaner is ' + etaText + '!',
      body: 'Your professional is heading to your location now. Estimated arrival: ' + etaText + '. Please make sure someone is available to let them in.',
      cta: 'View Details', ctaUrl: 'https://evercleanapp.com/dashboard',
    }),
  });
  await sendSMS({ to: clientPhone, message: 'EverClean: Your cleaner is ' + etaText + '! Make sure someone is available. evercleanapp.com' });
}

async function notifyServiceCompleted(booking, clientEmail, clientPhone) {
  await sendEmail({
    to: clientEmail,
    subject: 'Service Completed — How did we do?',
    html: bookingEmailHtml({
      title: 'Your service is complete!',
      body: 'Your cleaning has been completed. We hope everything looks great! Please take a moment to rate your experience — it helps our professionals grow.',
      cta: 'Rate Your Service', ctaUrl: 'https://evercleanapp.com/dashboard',
    }),
  });
  await sendSMS({ to: clientPhone, message: 'EverClean: Your cleaning is done! Please rate your experience at evercleanapp.com' });
}


// === DB POOL ===
function getPool() {
  return new pg.Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
}

// === STRIPE (lazy init so a missing key never crashes startup) ===
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(key, { apiVersion: '2024-06-20' });
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
  return { clientPrice: price, hours, sqftUsed, sqftCorrected, tier, multiplier, maxPayout: parseFloat((price * PRO_SPLIT).toFixed(2)) };
}

function calcCarWashPrice({ vehicleCode, pkg, addons = [] }) {
  const veh = CAR_WASH_RATES[vehicleCode];
  if (!veh) return null;
  const base = veh[pkg];
  if (!base) return null;
  const addonsTotal = addons.reduce((s, a) => s + (CAR_WASH_ADDONS[a] || 0), 0);
  const clientPrice = base + addonsTotal;
  return { clientPrice, proBase: parseFloat((clientPrice * PRO_SPLIT).toFixed(2)), platformFee: parseFloat((clientPrice * PLATFORM_SPLIT).toFixed(2)) };
}

// ============================================================
// EVERCLEAN FINANCIAL ENGINE v2.0
// Split: 50% pro / 50% EverClean
// PLATA: 0% bono | GOLD: +5% | PLATINUM: +10%
// Instant Pay 10% total: Stripe ~3% + EverClean 7%
//   PLATA:    10% de ganancias → recibe 90% base
//   GOLD:     5% bono + 5% ganancias → recibe 95% base
//   PLATINUM: 10% del bono → recibe 100% base
// Margen dinámico: 40%-80% según tarifa del pro
// ============================================================
const PLATFORM_SPLIT  = 0.50;
const PRO_SPLIT       = 0.50;
const VIP_DISCOUNT    = 0.15;
const STRIPE_PCT      = 0.029;
const STRIPE_FIXED    = 0.30;
const INSTANT_FEE     = 0.10;
const INSTANT_EC_KEEP = 0.07;
const LEVEL_BONUS = { PLATA: 0.00, GOLD: 0.05, PLATINUM: 0.10 };

function normLevel(l) {
  const map = { BRONZE:'PLATA', SILVER:'PLATA', ROOKIE:'PLATA',
                ELITE:'PLATINUM', ORO:'GOLD', PLATINO:'PLATINUM' };
  const u = (l || 'PLATA').toUpperCase();
  return LEVEL_BONUS[u] !== undefined ? u : (map[u] || 'PLATA');
}

function calcProPayout(hourlyRate, hours, clientPrice, level = 'PLATA') {
  const lvl = normLevel(level);
  const bonusPct = LEVEL_BONUS[lvl] ?? 0;
  const base = parseFloat((hourlyRate * hours).toFixed(2));
  const bonus = parseFloat((base * bonusPct).toFixed(2));
  const total = parseFloat((base + bonus).toFixed(2));
  const maxPayout = parseFloat((clientPrice * PRO_SPLIT).toFixed(2));
  return Math.min(total, maxPayout);
}

function calcInstantPayout(basePayout, level = 'PLATA', instantCount = 0) {
  const lvl = normLevel(level);
  const bonusPct = LEVEL_BONUS[lvl] ?? 0;
  const base = parseFloat((basePayout / (1 + bonusPct)).toFixed(2));
  const freeInstant = (lvl === 'GOLD' || lvl === 'PLATINUM')
    && instantCount > 0 && (instantCount % 6 === 0);
  const stripeFee = parseFloat((basePayout * STRIPE_PCT + STRIPE_FIXED).toFixed(2));
  if (freeInstant) {
    return {
      finalPayout: parseFloat((basePayout - stripeFee).toFixed(2)),
      instantFee: 0, stripeFee, ecKeeps: 0,
      totalFee: stripeFee, freeInstant: true
    };
  }
  const instantFeeAmt = parseFloat((basePayout * INSTANT_FEE).toFixed(2));
  const ecKeeps = parseFloat((basePayout * INSTANT_EC_KEEP).toFixed(2));
  let grossPayout;
  if (lvl === 'PLATINUM') {
    grossPayout = base;                                    // 100% base
  } else if (lvl === 'GOLD') {
    grossPayout = parseFloat((base * 0.95).toFixed(2));   // 95% base
  } else {
    grossPayout = parseFloat((base * 0.90).toFixed(2));   // 90% base
  }
  const finalPayout = parseFloat((grossPayout - stripeFee).toFixed(2));
  return {
    finalPayout, instantFee: instantFeeAmt, ecKeeps,
    stripeFee, totalFee: parseFloat((instantFeeAmt + stripeFee).toFixed(2)),
    freeInstant: false, level: lvl
  };
}

function applyVIPDiscount(clientPrice) {
  return parseFloat((clientPrice * (1 - VIP_DISCOUNT)).toFixed(2));
}

function calcMargin(clientPrice, proPayoutAmt) {
  if (!clientPrice || clientPrice === 0) return 0;
  return parseFloat(((clientPrice - proPayoutAmt) / clientPrice * 100).toFixed(1));
}

function hasCoords(lat, lng) {
  return lat !== null && lat !== undefined && lng !== null && lng !== undefined &&
    Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
}

async function insertKnownColumns(pool, table, values) {
  const colsRes = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name=$1`,
    [table]
  );
  const available = new Set(colsRes.rows.map(r => r.column_name));
  const entries = Object.entries(values).filter(([key, value]) =>
    available.has(key) && value !== undefined
  );
  if (entries.length === 0) return null;

  const cols = entries.map(([key]) => `"${key.replace(/"/g, '""')}"`);
  const placeholders = entries.map((_, idx) => `$${idx + 1}`);
  const vals = entries.map(([, value]) => value);
  const result = await pool.query(
    `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`,
    vals
  );
  return result.rows[0] || null;
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function geocodeAddress(address, city, state) {
  try {
    const q = encodeURIComponent(`${address || ''} ${city || ''} ${state || ''}`.trim());
    if (!q) return null;
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { 'User-Agent': 'EverClean/1.0' } }
    );
    const data = await r.json();
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch(e) {}
  return null;
}

// === HEALTHZ ===
app.get('/', (_, res) => res.json({ status: 'ok', service: 'EverClean API' }));
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
  const {
    email,
    password,
    phone,
    role,
    name,
    fullName,
    address,
    city,
    state,
    zip,
    zipCode,
    hourlyRate,
    serviceRadiusMiles,
    servicesOffered,
    language,
  } = req.body;
  const pool = getPool();
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedRole = String(role || 'CLIENT').trim().toUpperCase();
    const displayName = String(fullName || name || '').trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }
    if (!['CLIENT', 'PROFESSIONAL'].includes(normalizedRole)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query('BEGIN');

    const user = await insertKnownColumns(pool, 'users', {
      email: normalizedEmail,
      password_hash: hash,
      phone: phone || null,
      role: normalizedRole,
      name: displayName || null,
    });

    if (normalizedRole === 'PROFESSIONAL') {
      await insertKnownColumns(pool, 'professionals', {
        user_id: user.id,
        full_name: displayName || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || 'NJ',
        zip_code: zipCode || zip || null,
        hourly_rate: Number(hourlyRate || 18),
        service_radius_miles: Number(serviceRadiusMiles || 25),
        payout_schedule: 'WEEKLY',
        is_available: false,
        avg_rating: 0,
        total_services: 0,
        total_earnings: 0,
        completion_rate: 100,
        language: JSON.stringify(Array.isArray(language) ? language : ['English']),
        services_offered: JSON.stringify(Array.isArray(servicesOffered) ? servicesOffered : []),
        application_status: 'PENDING',
        verification_status: 'PENDING',
        status: 'PENDING',
      });
    } else {
      await insertKnownColumns(pool, 'companies', {
        user_id: user.id,
        name: displayName || normalizedEmail.split('@')[0],
        contact_name: displayName || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || 'NJ',
        zip: zipCode || zip || null,
      });
    }

    await pool.query('COMMIT');

    const accessToken = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
    res.status(201).json({ id: user.id, email: user.email, role: user.role, userId: user.id, accessToken, refreshToken });
  } catch (e) {
    try { await pool.query('ROLLBACK'); } catch {}
    if (e.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: e.message });
  }
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
    return res.json({ type: 'laundry', service, clientPrice, weightLbs: lbs, proBase: parseFloat((clientPrice * PRO_SPLIT).toFixed(2)), platformFee: parseFloat((clientPrice * PLATFORM_SPLIT).toFixed(2)) });
  }
  if (service === 'DRY_CLEANING') {
    const items = parseInt(req.query.item_count) || 1;
    const clientPrice = items * 12;
    return res.json({ type: 'dry_cleaning', service, clientPrice, itemCount: items, proBase: parseFloat((clientPrice * PRO_SPLIT).toFixed(2)), platformFee: parseFloat((clientPrice * PLATFORM_SPLIT).toFixed(2)) });
  }
  return res.status(400).json({ error: `Unknown service: ${service}` });
});

// === CAR WASH VEHICLES CATALOG ===
app.get('/api/car-wash/vehicles', (_, res) => {
  const vehicles = Object.entries(CAR_WASH_RATES).map(([code, pkgs]) => ({ code, packages: pkgs }));
  res.json({ vehicles });
});

// === ADMIN CUSTOMER SEARCH ===
// Used by the admin booking UI to pick an existing customer instead of typing
// an email by hand. Returns the customer's user id, basic profile, and any
// saved address from their company record so the form can prefill it.
app.get('/api/admin/customers/search', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const rawQ = String(req.query.q || '').trim();
  const requestedLimit = parseInt(req.query.limit, 10);
  const limit = Math.min(
    Math.max(Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : 10, 1),
    25,
  );
  const pool = getPool();
  try {
    const params = [];
    let where = "u.role = 'CLIENT'";
    if (rawQ) {
      params.push(`%${rawQ.toLowerCase()}%`);
      where += ` AND (
        LOWER(u.email) LIKE $1
        OR LOWER(COALESCE(u.name, '')) LIKE $1
        OR LOWER(COALESCE(u.phone, '')) LIKE $1
        OR LOWER(COALESCE(c.name, '')) LIKE $1
        OR LOWER(COALESCE(c.contact_name, '')) LIKE $1
      )`;
    }
    params.push(limit);
    const limitIdx = `$${params.length}`;
    const r = await pool.query(
      `SELECT
         u.id          AS user_id,
         u.email       AS email,
         u.name        AS name,
         u.phone       AS phone,
         c.id          AS company_id,
         c.name        AS company_name,
         c.contact_name AS contact_name,
         c.address     AS address,
         c.city        AS city,
         c.state       AS state,
         c.zip         AS zip
       FROM users u
       LEFT JOIN companies c ON c.user_id = u.id
       WHERE ${where}
       ORDER BY u.created_at DESC
       LIMIT ${limitIdx}`,
      params,
    );
    res.json({ data: r.rows });
  } catch (e) {
    console.error('GET /api/admin/customers/search:', e.message);
    res.status(500).json({ error: e.message });
  } finally {
    await pool.end();
  }
});

// === BOOKINGS ===
function titleCase(s) {
  return String(s).toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

function fallbackAddressNormalize({ address, city, state, zip_code }) {
  const rawZip = String(zip_code).trim();
  const zipMatch = rawZip.match(/^(\d{5})(?:[- ]?(\d{4}))?$/);
  const zip5 = zipMatch ? zipMatch[1] : rawZip.replace(/\D/g, '').slice(0, 5);
  const zip4 = zipMatch && zipMatch[2] ? zipMatch[2] : null;
  const postalFull = zip4 ? `${zip5}-${zip4}` : zip5;

  const stateUpper = String(state).trim().toUpperCase().slice(0, 2);
  const addressTC = titleCase(String(address).trim());
  const cityTC = titleCase(String(city).trim());

  let confidence = 'LOW';
  if (zip5.length === 5 && zip4) confidence = 'HIGH';
  else if (zip5.length === 5) confidence = 'MEDIUM';

  return {
    address_validated: false,
    formatted_address: `${addressTC}, ${cityTC}, ${stateUpper} ${postalFull}`,
    address_line1: addressTC,
    city: cityTC,
    state: stateUpper,
    zip_code: zip5,
    zip_plus4: zip4,
    postal_code_full: postalFull,
    latitude: null,
    longitude: null,
    google_place_id: null,
    dpv_confirmation: null,
    address_confidence: confidence,
    provider: 'fallback',
  };
}

// === ADDRESS VALIDATION CACHE ===
// Two-layer cache (in-memory LRU+TTL backed by Postgres) to avoid re-billing
// Google for repeated identical addresses, including across restarts/instances.
function parsePosInt(raw, fallback) {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
const ADDRESS_CACHE_MAX = parsePosInt(process.env.ADDRESS_CACHE_MAX, 5000);
const ADDRESS_CACHE_TTL_MS =
  parsePosInt(process.env.ADDRESS_CACHE_TTL_DAYS, 60) * 24 * 60 * 60 * 1000;
const ADDRESS_CACHE_CLEANUP_INTERVAL_MS =
  parsePosInt(process.env.ADDRESS_CACHE_CLEANUP_HOURS, 6) * 60 * 60 * 1000;
function parsePosFloat(raw, fallback) {
  const n = parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
// Google Address Validation API list price is $0.017 per request as of 2025.
// Override with ADDRESS_VALIDATION_COST_USD if your contract differs.
const ADDRESS_VALIDATION_COST_USD =
  parsePosFloat(process.env.ADDRESS_VALIDATION_COST_USD, 0.017);
const addressCache = new Map(); // key -> { value, expiresAt }
const addressCacheStats = { hits: 0, misses: 0, startedAt: Date.now() };

// Long-lived pool for the persistent address cache so we don't pay
// connection setup on every validateWithGoogle call.
let addressCachePool = null;
function getAddressCachePool() {
  if (!DB_URL) return null;
  if (!addressCachePool) {
    addressCachePool = new pg.Pool({
      connectionString: DB_URL,
      ssl: { rejectUnauthorized: false },
      max: 4,
    });
    addressCachePool.on('error', (e) =>
      console.error('[address-cache] pool error:', e.message)
    );
  }
  return addressCachePool;
}

let addressCacheTableReady = null;
async function ensureAddressCacheTable() {
  if (addressCacheTableReady) return addressCacheTableReady;
  const pool = getAddressCachePool();
  if (!pool) return false;
  addressCacheTableReady = (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS address_validation_cache (
          cache_key   TEXT PRIMARY KEY,
          value       JSONB NOT NULL,
          expires_at  TIMESTAMPTZ NOT NULL,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await pool.query(
        `CREATE INDEX IF NOT EXISTS address_validation_cache_expires_at_idx
           ON address_validation_cache (expires_at)`
      );
      return true;
    } catch (e) {
      console.error('[address-cache] failed to ensure table:', e.message);
      addressCacheTableReady = null; // allow retry on next call
      return false;
    }
  })();
  return addressCacheTableReady;
}

function hashAddressKey(key) {
  // Tiny non-crypto hash purely for log redaction (avoid logging full PII).
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function normalizeAddressKey({ address, city, state, zip_code }) {
  const norm = (v) => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const zipRaw = String(zip_code || '').trim();
  const zipMatch = zipRaw.match(/^(\d{5})/);
  const zip5 = zipMatch ? zipMatch[1] : zipRaw.replace(/\D/g, '').slice(0, 5);
  const st = String(state || '').trim().toUpperCase().slice(0, 2);
  return `${norm(address)}|${norm(city)}|${st}|${zip5}`;
}

function memoryCacheTouch(key, value, expiresAt) {
  if (addressCache.has(key)) addressCache.delete(key);
  addressCache.set(key, { value, expiresAt });
  while (addressCache.size > ADDRESS_CACHE_MAX) {
    const oldestKey = addressCache.keys().next().value;
    if (oldestKey === undefined) break;
    addressCache.delete(oldestKey);
  }
}

async function addressCacheGet(key) {
  // L1: in-memory
  const entry = addressCache.get(key);
  if (entry) {
    if (entry.expiresAt > Date.now()) {
      addressCache.delete(key);
      addressCache.set(key, entry); // refresh LRU recency
      return entry.value;
    }
    addressCache.delete(key);
  }
  // L2: Postgres
  const ok = await ensureAddressCacheTable();
  if (!ok) return null;
  try {
    const pool = getAddressCachePool();
    const r = await pool.query(
      `SELECT value, expires_at
         FROM address_validation_cache
        WHERE cache_key = $1 AND expires_at > NOW()`,
      [key]
    );
    if (!r.rows.length) return null;
    const value = r.rows[0].value;
    const expiresAt = new Date(r.rows[0].expires_at).getTime();
    memoryCacheTouch(key, value, expiresAt);
    return value;
  } catch (e) {
    console.error('[address-cache] get error:', e.message);
    return null;
  }
}

async function addressCacheSet(key, value) {
  const expiresAt = Date.now() + ADDRESS_CACHE_TTL_MS;
  memoryCacheTouch(key, value, expiresAt);
  const ok = await ensureAddressCacheTable();
  if (!ok) return;
  try {
    const pool = getAddressCachePool();
    await pool.query(
      `INSERT INTO address_validation_cache (cache_key, value, expires_at, updated_at)
       VALUES ($1, $2::jsonb, to_timestamp($3::double precision / 1000.0), NOW())
       ON CONFLICT (cache_key) DO UPDATE
         SET value = EXCLUDED.value,
             expires_at = EXCLUDED.expires_at,
             updated_at = NOW()`,
      [key, JSON.stringify(value), expiresAt]
    );
  } catch (e) {
    console.error('[address-cache] set error:', e.message);
  }
}

async function cleanupExpiredAddressCache() {
  const ok = await ensureAddressCacheTable();
  if (!ok) return;
  try {
    const pool = getAddressCachePool();
    const r = await pool.query(
      `DELETE FROM address_validation_cache WHERE expires_at <= NOW()`
    );
    if (r.rowCount > 0) {
      console.log(`[address-cache] cleanup removed ${r.rowCount} expired rows`);
    }
  } catch (e) {
    console.error('[address-cache] cleanup error:', e.message);
  }
}

// Schedule periodic cleanup of expired rows. unref so it doesn't keep
// the event loop alive on shutdown.
const addressCacheCleanupTimer = setInterval(() => {
  cleanupExpiredAddressCache().catch(() => {});
}, ADDRESS_CACHE_CLEANUP_INTERVAL_MS);
if (typeof addressCacheCleanupTimer.unref === 'function') {
  addressCacheCleanupTimer.unref();
}

async function validateWithGoogle({ address, city, state, zip_code }) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const cacheKey = normalizeAddressKey({ address, city, state, zip_code });
  const cached = await addressCacheGet(cacheKey);
  if (cached) {
    addressCacheStats.hits++;
    console.log(`[address-cache] HIT key=${hashAddressKey(cacheKey)} hits=${addressCacheStats.hits} misses=${addressCacheStats.misses} size=${addressCache.size}`);
    return { ...cached, cache: 'hit' };
  }
  addressCacheStats.misses++;
  console.log(`[address-cache] MISS key=${hashAddressKey(cacheKey)} hits=${addressCacheStats.hits} misses=${addressCacheStats.misses} size=${addressCache.size}`);

  const body = {
    address: {
      regionCode: 'US',
      addressLines: [String(address).trim()],
      locality: String(city || '').trim(),
      administrativeArea: String(state || '').trim().toUpperCase().slice(0, 2),
      postalCode: String(zip_code || '').trim(),
    },
    enableUspsCass: true,
  };

  const url = `https://addressvalidation.googleapis.com/v1:validateAddress?key=${encodeURIComponent(apiKey)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`Google Address Validation ${r.status}: ${text.slice(0, 300)}`);
  }

  const data = await r.json();
  const result = data?.result;
  if (!result) return null;

  const addr = result.address || {};
  const postal = addr.postalAddress || {};
  const verdict = result.verdict || {};
  const geocode = result.geocode || {};
  const usps = result.uspsData || {};

  const lines = postal.addressLines || [];
  const addressLine1 = lines[0] || String(address).trim();
  const stateOut = (postal.administrativeArea || state || '').toUpperCase().slice(0, 2);
  const cityOut = postal.locality || city || '';
  const fullPostal = postal.postalCode || zip_code || '';
  const [zip5, zip4] = fullPostal.split('-');

  const granularity = verdict.validationGranularity || 'OTHER';
  // Granularity: SUB_PREMISE, PREMISE, PREMISE_PROXIMITY, BLOCK, ROUTE, OTHER
  let confidence = 'LOW';
  if (['SUB_PREMISE', 'PREMISE'].includes(granularity) && verdict.addressComplete && !verdict.hasUnconfirmedComponents) {
    confidence = 'HIGH';
  } else if (['SUB_PREMISE', 'PREMISE', 'PREMISE_PROXIMITY'].includes(granularity)) {
    confidence = 'MEDIUM';
  }

  const dpv = usps.dpvConfirmation || null;
  if (dpv === 'Y') confidence = 'HIGH';
  else if (dpv === 'S' || dpv === 'D') confidence = 'MEDIUM';
  else if (dpv === 'N') confidence = 'LOW';

  const validated = {
    address_validated: confidence === 'HIGH',
    formatted_address: addr.formattedAddress || `${addressLine1}, ${cityOut}, ${stateOut} ${fullPostal}`,
    address_line1: addressLine1,
    city: cityOut,
    state: stateOut,
    zip_code: zip5 || fullPostal,
    zip_plus4: zip4 || null,
    postal_code_full: fullPostal,
    latitude: geocode.location?.latitude ?? null,
    longitude: geocode.location?.longitude ?? null,
    google_place_id: geocode.placeId || null,
    dpv_confirmation: dpv,
    address_confidence: confidence,
    provider: 'google',
    has_unconfirmed_components: !!verdict.hasUnconfirmedComponents,
    has_inferred_components: !!verdict.hasInferredComponents,
    missing_components: !!verdict.hasReplacedComponents || (verdict.addressComplete === false),
  };
  await addressCacheSet(cacheKey, validated);
  return { ...validated, cache: 'miss' };
}

app.post('/api/address-intelligence', async (req, res) => {
  // If place_id provided, use Places Details API
  if (req.body.place_id) {
    const key = process.env.GOOGLE_PLACES_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (key) {
      try {
        const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
        url.searchParams.set('place_id', req.body.place_id);
        url.searchParams.set('fields', 'formatted_address,address_components,geometry');
        url.searchParams.set('key', key);
        const r = await fetch(url.toString());
        const d = await r.json();
        if (d.result) {
          const comps = d.result.address_components || [];
          const get = (type) => comps.find(c => c.types.includes(type));
          const streetNum = get('street_number')?.long_name || '';
          const route = get('route')?.long_name || '';
          const city = get('locality')?.long_name || get('sublocality')?.long_name || '';
          const state = get('administrative_area_level_1')?.short_name || '';
          const zip = get('postal_code')?.long_name || '';
          const zip4 = get('postal_code_suffix')?.long_name || '';
          const postal = zip4 ? zip+'-'+zip4 : zip;
          return res.json({
            address_validated: true,
            formatted_address: d.result.formatted_address,
            address_line1: (streetNum+' '+route).trim(),
            city, state,
            zip_code: zip,
            zip_plus4: zip4 || null,
            postal_code_full: postal,
            latitude: d.result.geometry?.location?.lat || null,
            longitude: d.result.geometry?.location?.lng || null,
            google_place_id: req.body.place_id,
            address_confidence: 'HIGH',
          });
        }
      } catch(e) { console.error('Places Details error:', e.message); }
    }
  }
  // Original address-intelligence logic continues below...

  try {
    const { address, city, state, zip_code } = req.body || {};
    if (!address || !city || !state || !zip_code) {
      return res.status(400).json({ error: 'address, city, state and zip_code are required' });
    }

    if (process.env.GOOGLE_MAPS_API_KEY) {
      try {
        const validated = await validateWithGoogle({ address, city, state, zip_code });
        if (validated) return res.json(validated);
      } catch (err) {
        console.error('[address-intelligence] Google validation failed:', err.message);
        const fb = fallbackAddressNormalize({ address, city, state, zip_code });
        return res.json({ ...fb, provider_error: err.message });
      }
    }

    res.json(fallbackAddressNormalize({ address, city, state, zip_code }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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
      lat, lng,
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

    const platformFee = parseFloat((clientPrice * PLATFORM_SPLIT).toFixed(2));

    // Compatibilidad con schema existente: usar company_id si existe.
    // Admins can create bookings on behalf of an existing customer by passing
    // customer_user_id; in that case we attach the booking to that customer's
    // company so it shows up under their history (not the admin's).
    let bookingOwnerUserId = req.user.sub;
    if (req.user.role === 'ADMIN') {
      if (!req.body.customer_user_id) {
        return res.status(400).json({ error: 'customer_user_id is required for admin-created bookings' });
      }
      const customerRes = await pool.query(
        "SELECT id FROM users WHERE id=$1 AND role='CLIENT' LIMIT 1",
        [req.body.customer_user_id],
      );
      if (!customerRes.rows[0]) {
        return res.status(400).json({ error: 'Unknown customer_user_id' });
      }
      bookingOwnerUserId = customerRes.rows[0].id;
    }
    const compRes = await pool.query('SELECT id FROM companies WHERE user_id=$1 LIMIT 1', [bookingOwnerUserId]);
    let companyId = compRes.rows[0]?.id || null;
    if (!companyId && bookingOwnerUserId !== req.user.sub) {
      // Customer never finished onboarding a company row — create a minimal one
      // so the booking can still be linked back to them.
      const created = await insertKnownColumns(pool, 'companies', {
        user_id: bookingOwnerUserId,
        name: 'Customer',
      });
      companyId = created?.id || null;
    }

    const r = await pool.query(
      `INSERT INTO bookings (
         company_id, service_type, frequency, sqft, hours, bedrooms, bathrooms, state,
         address, city, zip, scheduled_at, notes,
         client_price, platform_fee, payout_status,
         vehicle_code, car_wash_package,
         weight_lbs, item_count, sqft_validated, status, created_at,
         final_estimated_price, pricing_state_code, pricing_market_label,
         pricing_note, sqft_rate, pricing_breakdown,
         commercial_restrooms, commercial_breakrooms,
         restroom_fee, breakroom_fee, supplies_fee,
         commercial_subtotal_before_minimum, commercial_minimum, commercial_minimum_applied,
         zip_plus4, postal_code_full, address_validated,
         cleaner_count, additional_service_hours,
         minimum_visit_hours, selected_service_window_hours,
         final_service_window_hours, property_type, sqft_verification_required
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
         $14,$15,'pending',$16,$17,$18,$19,$20,'PENDING_ASSIGNMENT',NOW(),
         $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,
         $35,$36,$37,$38,$39,$40,$41,$42,$43,$44
       ) RETURNING *`,
      [
        companyId,
        svcType,
        frequency,
        sqftUsed,
        hours,
        bedrooms ?? null,
        bathrooms ?? null,
        state,
        address,
        city,
        zipFinal,
        schedAt,
        notes,
        clientPrice,
        platformFee,
        vehicleCode ?? null,
        carPackage ?? null,
        weightLbs ?? null,
        itemCount ?? null,
        sqftCorrected ?? false,

        req.body.final_estimated_price ?? null,
        req.body.pricing_state_code ?? null,
        req.body.pricing_market_label ?? null,
        req.body.pricing_note ?? null,
        req.body.sqft_rate ?? null,
        req.body.pricing_breakdown
          ? (typeof req.body.pricing_breakdown === 'string'
              ? req.body.pricing_breakdown
              : JSON.stringify(req.body.pricing_breakdown))
          : null,

        req.body.commercial_restrooms ?? null,
        req.body.commercial_breakrooms ?? null,
        req.body.restroom_fee ?? null,
        req.body.breakroom_fee ?? null,
        req.body.supplies_fee ?? null,
        req.body.commercial_subtotal_before_minimum ?? null,
        req.body.commercial_minimum ?? null,
        req.body.commercial_minimum_applied ?? null,

        req.body.zip_plus4 ?? null,
        req.body.postal_code_full ?? null,
        req.body.address_validated ?? null,

        req.body.cleaner_count ?? null,
        req.body.additional_service_hours ?? null,
        req.body.minimum_visit_hours ?? null,
        req.body.selected_service_window_hours ?? null,
        req.body.final_service_window_hours ?? null,
        req.body.property_type ?? null,
        req.body.sqft_verification_required ?? null
      ]
    );
    const booking = r.rows[0];
    const coords = hasCoords(lat, lng)
      ? { lat: Number(lat), lng: Number(lng) }
      : await geocodeAddress(address, city, state);
    if (coords) {
      await pool.query(
        'UPDATE bookings SET lat=$1, lng=$2 WHERE id=$3',
        [coords.lat, coords.lng, booking.id]
      );
      booking.lat = coords.lat;
      booking.lng = coords.lng;
    }
    // Send booking created notification
  try {
    const clientRes2 = await pool.query('SELECT u.email, u.phone FROM companies co JOIN users u ON u.id=co.user_id WHERE co.id=$1', [booking.company_id]).catch(()=>({rows:[]}));
    if (clientRes2.rows.length) {
      const cl = clientRes2.rows[0];
      notifyBookingCreated(booking, cl.email, cl.phone).catch(()=>{});
    }
  } catch(e2) { console.error('Notification error:', e2.message); }
  res.json({ booking, sqft_corrected: sqftCorrected });
  } catch (e) { console.error('POST /api/bookings:', e.message); res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// MARKETPLACE CON SUBASTA ESCALONADA
app.get('/api/bookings/available', requireAuth, requireRole('PROFESSIONAL'), async (req, res) => {
  const pool = getPool();
  try {
    const proRes = await pool.query('SELECT id, lat, lng, service_radius_miles, hourly_rate FROM professionals WHERE user_id=$1', [req.user.sub]);
    const pro = proRes.rows[0];
    if (!pro) return res.status(404).json({ error: 'Professional not found' });
    const rate = parseFloat(pro.hourly_rate || 18);
    const radiusMiles = Number(pro.service_radius_miles || 25);
    const proHasCoords = hasCoords(pro.lat, pro.lng);
    const proLat = Number(pro.lat);
    const proLng = Number(pro.lng);

    // Subasta escalonada
    const minMinutes = 0; // First come first served - all pros see all jobs

    const r = await pool.query(
      `SELECT b.*,
         EXTRACT(EPOCH FROM (NOW() - b.created_at)) / 60 AS minutes_posted,
         LEAST($2::numeric * COALESCE(b.hours, 2), COALESCE(b.client_price,0) * 0.50) AS estimated_payout
       FROM bookings b
       WHERE b.status = 'PENDING_ASSIGNMENT'
         AND EXTRACT(EPOCH FROM (NOW() - b.created_at)) / 60 >= $1
       ORDER BY b.created_at ASC`,
      [minMinutes, rate]
    );

    const filtered = r.rows.filter(b => {
      if (!proHasCoords || !hasCoords(b.lat, b.lng)) return true;
      const dist = haversineDistance(proLat, proLng, Number(b.lat), Number(b.lng));
      b.distance_miles = Math.round(dist * 10) / 10;
      return dist <= radiusMiles;
    });

    const data = filtered.map(b => {
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

    res.json({ pro_rate: rate, pro_radius: radiusMiles, auction_delay_minutes: minMinutes, count: data.length, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.get('/api/admin/address-cache/stats', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const hits = addressCacheStats.hits;
  const misses = addressCacheStats.misses;
  const total = hits + misses;
  const hitRate = total > 0 ? hits / total : 0;
  const estimatedSavingsUsd = +(hits * ADDRESS_VALIDATION_COST_USD).toFixed(4);

  let persistentSize = null;
  let persistentActiveSize = null;
  try {
    const ok = await ensureAddressCacheTable();
    if (ok) {
      const pool = getAddressCachePool();
      const r = await pool.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE expires_at > NOW())::int AS active
         FROM address_validation_cache`
      );
      persistentSize = r.rows[0]?.total ?? null;
      persistentActiveSize = r.rows[0]?.active ?? null;
    }
  } catch (e) {
    console.error('[address-cache] stats query error:', e.message);
  }

  res.json({
    hits,
    misses,
    total_lookups: total,
    hit_rate: +hitRate.toFixed(4),
    memory_cache_size: addressCache.size,
    memory_cache_max: ADDRESS_CACHE_MAX,
    persistent_cache_size: persistentSize,
    persistent_cache_active_size: persistentActiveSize,
    cost_per_call_usd: ADDRESS_VALIDATION_COST_USD,
    estimated_savings_usd: estimatedSavingsUsd,
    ttl_days: ADDRESS_CACHE_TTL_MS / (24 * 60 * 60 * 1000),
    stats_started_at: new Date(addressCacheStats.startedAt).toISOString(),
  });
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
    const proRes = await pool.query('SELECT id, full_name, hourly_rate, lat, lng, service_radius_miles FROM professionals WHERE user_id=$1', [req.user.sub]);
    const pro = proRes.rows[0];
    if (!pro) return res.status(404).json({ error: 'Professional not found' });
    const b = await pool.query('SELECT * FROM bookings WHERE id=$1', [req.params.id]);
    if (!b.rows[0]) return res.status(404).json({ error: 'Booking not found' });
    const booking = b.rows[0];
    if (booking.status !== 'PENDING_ASSIGNMENT') return res.status(400).json({ error: 'Already assigned' });
    if (hasCoords(pro.lat, pro.lng) && hasCoords(booking.lat, booking.lng)) {
      const dist = haversineDistance(
        Number(pro.lat), Number(pro.lng),
        Number(booking.lat), Number(booking.lng)
      );
      if (dist > Number(pro.service_radius_miles || 25)) {
        return res.status(403).json({
          error: 'This job is outside your service radius',
          distance_miles: Math.round(dist * 10) / 10,
          radius_miles: pro.service_radius_miles
        });
      }
    }
    await pool.query('INSERT INTO booking_professionals (booking_id, professional_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, pro.id]);
    // Notify client that pro was assigned
    try {
      const bk = await pool.query('SELECT b.*, u.email as client_email, u.phone as client_phone FROM bookings b LEFT JOIN companies co ON co.id=b.company_id LEFT JOIN users u ON u.id=co.user_id WHERE b.id=$1', [req.params.id]);
      const proUser = await pool.query('SELECT full_name FROM users WHERE id=$1', [req.user.sub]);
      if (bk.rows.length) {
        const proName = proUser.rows[0]?.full_name || 'Your professional';
        notifyProAssigned(bk.rows[0], bk.rows[0].client_email, bk.rows[0].client_phone, proName).catch(()=>{});
      }
    } catch(ne) { console.error('Notify assign error:', ne.message); }
    const scheduledAt = req.body.scheduledAt || booking.scheduled_at;
    const clientPrice = parseFloat(booking.client_price || 0);
    const hours = parseInt(booking.hours || 2);
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
    // Notify client service completed
    try {
      const bkComp = await pool.query('SELECT b.*, u.email, u.phone FROM bookings b LEFT JOIN companies co ON co.id=b.company_id LEFT JOIN users u ON u.id=co.user_id WHERE b.id=$1', [req.params.id]);
      if (bkComp.rows.length) {
        notifyServiceCompleted(bkComp.rows[0], bkComp.rows[0].email, bkComp.rows[0].phone).catch(()=>{});
      }
    } catch(ne) { console.error('Notify complete error:', ne.message); }
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

app.post('/api/professionals/me/location', requireAuth, async (req, res) => {
  const { lat, lng } = req.body;
  if (!hasCoords(lat, lng)) return res.status(400).json({ error: 'lat and lng required' });
  const pool = getPool();
  try {
    await pool.query(
      'UPDATE professionals SET lat=$1, lng=$2 WHERE user_id=$3',
      [lat, lng, req.user.sub]
    );
    res.json({ ok: true });
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

app.post('/api/stripe/payment-intent', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ error: 'bookingId required' });
    const b = await pool.query('SELECT * FROM bookings WHERE id=$1', [bookingId]);
    if (!b.rows[0]) return res.status(404).json({ error: 'Booking not found' });
    const amount = Math.round(parseFloat(b.rows[0].client_price || 0) * 100);
    if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    const pi = await getStripe().paymentIntents.create({
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
      const account = await getStripe().accounts.create({
        type: 'express', country: 'US', email: pro.email || req.user.email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        metadata: { professional_id: pro.id },
      });
      accountId = account.id;
      await pool.query('UPDATE professionals SET stripe_account_id=$1 WHERE user_id=$2', [accountId, req.user.sub]);
    }
    const origin = req.headers.origin || 'https://everclean-client.vercel.app';
    const link = await getStripe().accountLinks.create({
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
    const account = await getStripe().accounts.retrieve(pro.stripe_account_id);
    res.json({ connected: account.charges_enabled, payoutsEnabled: account.payouts_enabled, accountId: account.id, detailsSubmitted: account.details_submitted });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.get('/api/stripe/dashboard', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  try {
    const balance = await getStripe().balance.retrieve();
    res.json({
      available: balance.available.map(b => ({ amount: b.amount / 100, currency: b.currency })),
      pending: balance.pending.map(b => ({ amount: b.amount / 100, currency: b.currency })),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// === START ===

// ADDRESS AUTOCOMPLETE
app.post('/api/address-autocomplete', async (req, res) => {
  const { input, state } = req.body;
  if (!input || input.length < 3) return res.json({ predictions: [] });
  const key = process.env.GOOGLE_PLACES_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return res.json({ predictions: [] });
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input + (state ? ' ' + state : '') + ' USA');
    url.searchParams.set('types', 'address');
    url.searchParams.set('components', 'country:us');
    url.searchParams.set('key', key);
    const r = await fetch(url.toString());
    const d = await r.json();
    const predictions = (d.predictions || []).map(p => ({
      place_id: p.place_id,
      description: p.description,
      main_text: p.structured_formatting?.main_text || '',
      secondary_text: p.structured_formatting?.secondary_text || '',
    }));
    res.json({ predictions });
  } catch(e) { res.json({ predictions: [] }); }
});

// ADDRESS INTELLIGENCE with place_id support
// GET /api/address-suggestions?input=...
app.get('/api/address-suggestions', async (req, res) => {
  const { input } = req.query;
  if (!input || input.length < 4) return res.json([]);
  const key = process.env.GOOGLE_PLACES_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return res.json([]);
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input + ' USA');
    url.searchParams.set('types', 'address');
    url.searchParams.set('components', 'country:us');
    url.searchParams.set('language', 'en');
    url.searchParams.set('key', key);
    const r = await fetch(url.toString());
    const d = await r.json();
    if (d.status !== 'OK') return res.json([]);
    const predictions = (d.predictions || []).slice(0, 5).map(p => ({
      place_id: p.place_id,
      description: p.description,
      main_text: p.structured_formatting?.main_text || p.description.split(',')[0],
      secondary_text: p.structured_formatting?.secondary_text || '',
    }));
    res.json(predictions);
  } catch(e) { res.json([]); }
});


// ═══════════════════════════════════════════════
// ADMIN ENDPOINTS - WALLET, RFQs, EVIDENCE, ALERTS
// ═══════════════════════════════════════════════

// GET /api/admin/wallet/summary
app.get('/api/admin/wallet/summary', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const pool = getPool();
  try {
    const members = await pool.query("SELECT COUNT(*)::int as count FROM users WHERE membership_status='vip'").catch(()=>({rows:[{count:0}]}));
    const issued = await pool.query("SELECT COALESCE(SUM(minutes),0) as total FROM wallet_transactions WHERE type='SUBSCRIPTION_CREDIT'").catch(()=>({rows:[{total:0}]}));
    const consumed = await pool.query("SELECT COALESCE(SUM(ABS(minutes)),0) as total FROM wallet_transactions WHERE minutes < 0").catch(()=>({rows:[{total:0}]}));
    const outstanding = await pool.query("SELECT COALESCE(SUM(time_wallet_minutes),0) as total FROM users WHERE membership_status='vip'").catch(()=>({rows:[{total:0}]}));
    const topConsumers = await pool.query("SELECT u.email, ABS(SUM(wt.minutes)) as minutes FROM wallet_transactions wt JOIN users u ON u.id=wt.user_id WHERE wt.minutes < 0 GROUP BY u.email ORDER BY minutes DESC LIMIT 5").catch(()=>({rows:[]}));
    res.json({
      active_members: members.rows[0].count,
      total_minutes_issued: Number(issued.rows[0].total),
      total_minutes_consumed: Number(consumed.rows[0].total),
      outstanding_minutes: Number(outstanding.rows[0].total),
      top_consumers: topConsumers.rows,
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// GET /api/admin/wallet/transactions
app.get('/api/admin/wallet/transactions', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query('SELECT wt.*, u.email as user_email FROM wallet_transactions wt LEFT JOIN users u ON u.id=wt.user_id ORDER BY wt.created_at DESC LIMIT 100').catch(()=>({rows:[]}));
    res.json({ data: r.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// GET /api/admin/rfqs
app.get('/api/admin/rfqs', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query('SELECT * FROM rfqs ORDER BY created_at DESC LIMIT 100').catch(()=>({rows:[]}));
    res.json({ data: r.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// POST /api/admin/rfqs
app.post('/api/admin/rfqs', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const pool = getPool();
  try {
    const { contact_name, contact_email, contact_phone, service_type, city, state, zip_code, sqft, frequency, required_scope } = req.body;
    const sqftNum = Number(sqft) || 0;
    const baseRate = service_type === 'POST_CONSTRUCTION' ? 0.30 : service_type === 'MEDICAL_CLEANING' ? 0.24 : 0.18;
    const calculated_price = sqftNum > 0 ? Math.round(sqftNum * baseRate / 0.55) : null;
    const r = await pool.query(
      'INSERT INTO rfqs (contact_name, contact_email, contact_phone, service_type, city, state, zip_code, sqft, frequency, required_scope, status, calculated_price, target_margin) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
      [contact_name, contact_email, contact_phone, service_type, city, state, zip_code, sqftNum||null, frequency, required_scope, 'NEW', calculated_price, 45]
    );
    res.json({ success: true, rfq: r.rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// GET /api/admin/evidence
app.get('/api/admin/evidence', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query('SELECT * FROM evidence_items ORDER BY created_at DESC LIMIT 100').catch(()=>({rows:[]}));
    res.json({ data: r.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// GET /api/admin/alerts
app.get('/api/admin/alerts', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query("SELECT * FROM n8n_webhook_events ORDER BY created_at DESC LIMIT 100").catch(()=>({rows:[]}));
    res.json({ data: r.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// PATCH /api/admin/alerts/:id/acknowledge
app.patch('/api/admin/alerts/:id/acknowledge', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const pool = getPool();
  try {
    await pool.query("UPDATE n8n_webhook_events SET status='ACKNOWLEDGED' WHERE id=$1", [req.params.id]).catch(()=>{});
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// POST /api/webhooks/n8n - receive n8n events
app.post('/api/webhooks/n8n', async (req, res) => {
  const pool = getPool();
  try {
    const { event_type, source, payload, severity } = req.body;
    await pool.query(
      'INSERT INTO n8n_webhook_events (event_type, source, payload, severity, status) VALUES ($1,$2,$3,$4,$5)',
      [event_type||'UNKNOWN', source||'n8n', JSON.stringify(payload||{}), severity||'LOW', 'NEW']
    ).catch(()=>{});
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// GET /api/admin/kpis
app.get('/api/admin/kpis', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const pool = getPool();
  try {
    const bookings = await pool.query("SELECT COUNT(*)::int as total, SUM(COALESCE(client_price,0))::numeric as revenue, SUM(COALESCE(platform_fee,0))::numeric as fees FROM bookings").catch(()=>({rows:[{total:0,revenue:0,fees:0}]}));
    const pending = await pool.query("SELECT COUNT(*)::int as count FROM bookings WHERE status='PENDING_ASSIGNMENT'").catch(()=>({rows:[{count:0}]}));
    const vip = await pool.query("SELECT COUNT(*)::int as count FROM users WHERE membership_status='vip'").catch(()=>({rows:[{count:0}]}));
    const b = bookings.rows[0];
    const revenue = Number(b.revenue||0);
    const fees = Number(b.fees||0);
    const margin = revenue > 0 ? (fees/revenue*100).toFixed(1) : '0';
    res.json({
      total_bookings: b.total,
      total_revenue: revenue,
      platform_fees: fees,
      real_margin_pct: Number(margin),
      target_margin_pct: 45,
      margin_gap: (45 - Number(margin)).toFixed(1),
      pending_bookings: pending.rows[0].count,
      active_vip_members: vip.rows[0].count,
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});


// ADMIN PROPERTIES
app.get('/api/admin/properties', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query('SELECT * FROM properties ORDER BY created_at DESC').catch(()=>({rows:[]}));
    res.json({ data: r.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.post('/api/admin/properties', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const pool = getPool();
  try {
    const { name, address, city, state, zip_code, bedrooms, bathrooms, sqft, ical_url, platform } = req.body;
    const r = await pool.query(
      'INSERT INTO properties (name, address, city, state, zip_code, bedrooms, bathrooms, sqft, ical_url, platform, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true) RETURNING *',
      [name, address||null, city||null, state||null, zip_code||null, bedrooms||null, bathrooms||null, sqft||null, ical_url||null, platform||'AIRBNB']
    );
    res.json({ success: true, property: r.rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.post('/api/admin/properties/:id/sync-calendar', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const pool = getPool();
  try {
    const prop = await pool.query('SELECT * FROM properties WHERE id=$1', [req.params.id]);
    if (!prop.rows.length) return res.status(404).json({ error: 'Not found' });
    const p = prop.rows[0];
    if (!p.ical_url) return res.status(400).json({ error: 'No iCal URL configured' });
    await pool.query('INSERT INTO ical_sync_logs (property_id, status) VALUES ($1,$2)', [p.id, 'SYNC_REQUESTED']).catch(()=>{});
    res.json({ success: true, message: 'Calendar sync queued' });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});
app.listen(PORT, '0.0.0.0', () => {
  console.log(`EverClean API listening on port ${PORT}`);
  // Warm the persistent address cache (creates table if missing) and
  // sweep any rows that already expired while the server was down.
  ensureAddressCacheTable()
    .then((ok) => { if (ok) return cleanupExpiredAddressCache(); })
    .catch((e) => console.error('[address-cache] startup init failed:', e.message));
});

// ETA endpoint
app.post('/api/bookings/:id/eta', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const { eta_minutes, eta_message, pro_lat, pro_lng } = req.body;
    await pool.query('UPDATE bookings SET eta_minutes=$1, eta_message=$2, pro_lat=$3, pro_lng=$4, eta_sent_at=NOW() WHERE id=$5', [eta_minutes||null, eta_message||null, pro_lat||null, pro_lng||null, req.params.id]);
    const r = await pool.query('SELECT * FROM bookings WHERE id=$1', [req.params.id]);
    res.json({ success: true, booking: r.rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// PATCH companies/me
app.patch('/api/companies/me', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const userId = req.user.sub;
    const { name, full_name, phone, billingAddress, billing_address, address, billingCity, billing_city, city, billingState, billing_state, state, billingZip, billing_zip, zip_code } = req.body;
    const fullName = name || full_name;
    const addr = billingAddress || billing_address || address;
    const cty = billingCity || billing_city || city;
    const st = billingState || billing_state || state;
    const zip = billingZip || billing_zip || zip_code;
    if (fullName || phone) {
      const fields = [], vals = [];
      if (fullName) { fields.push('full_name=$'+(fields.length+1)); vals.push(fullName); }
      if (phone) { fields.push('phone=$'+(fields.length+1)); vals.push(phone); }
      if (fields.length) { vals.push(userId); await pool.query('UPDATE users SET '+fields.join(',')+' WHERE id=$'+vals.length, vals); }
    }
    const cc = await pool.query('SELECT id FROM companies WHERE user_id=$1', [userId]);
    if (cc.rows.length > 0) {
      const fields = [], vals = [];
      if (fullName) { fields.push('name=$'+(fields.length+1)); vals.push(fullName); }
      if (addr) { fields.push('billing_address=$'+(fields.length+1)); vals.push(addr); }
      if (cty) { fields.push('billing_city=$'+(fields.length+1)); vals.push(cty); }
      if (st) { fields.push('billing_state=$'+(fields.length+1)); vals.push(st); }
      if (zip) { fields.push('billing_zip=$'+(fields.length+1)); vals.push(zip); }
      if (fields.length) { vals.push(cc.rows[0].id); await pool.query('UPDATE companies SET '+fields.join(',')+' WHERE id=$'+vals.length, vals); }
    } else {
      await pool.query('INSERT INTO companies (user_id,name,billing_address,billing_city,billing_state,billing_zip) VALUES ($1,$2,$3,$4,$5,$6)', [userId,fullName||'Client',addr||null,cty||null,st||null,zip||null]);
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});


// MEMBERSHIP WALLET
app.get('/api/membership/wallet', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const userId = req.user.sub;
    const u = await pool.query('SELECT membership_status, time_wallet_minutes, wallet_balance FROM users WHERE id=$1', [userId]);
    const txns = await pool.query('SELECT * FROM wallet_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50', [userId]).catch(()=>({rows:[]}));
    res.json({ ...u.rows[0], transactions: txns.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// MEMBERSHIP SUBSCRIBE
app.post('/api/membership/subscribe', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const userId = req.user.sub;
    const mins = Math.round((49/36)*60);
    await pool.query('UPDATE users SET membership_status=$1, time_wallet_minutes=COALESCE(time_wallet_minutes,0)+$2 WHERE id=$3', ['vip', mins, userId]);
    await pool.query('INSERT INTO wallet_transactions (user_id,type,minutes,amount_usd,description) VALUES ($1,$2,$3,$4,$5)', [userId,'SUBSCRIPTION_CREDIT',mins,49,'VIP monthly credit']).catch(()=>{});
    res.json({ success: true, minutes_added: mins });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// REFERRALS
app.get('/api/referrals', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query('SELECT * FROM referrals WHERE referrer_id=$1 ORDER BY created_at DESC', [req.user.sub]).catch(()=>({rows:[]}));
    res.json({ data: r.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// AIRBNB PROPERTIES
app.get('/api/airbnb/properties', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const r = await pool.query('SELECT * FROM properties WHERE user_id=$1 ORDER BY created_at DESC', [req.user.sub]).catch(()=>({rows:[]}));
    res.json({ data: r.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

app.post('/api/airbnb/properties', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const { name, ical_url, address, city, state, platform } = req.body;
    if (!name || !ical_url) return res.status(400).json({ error: 'name and ical_url required' });
    const r = await pool.query(
      'INSERT INTO properties (user_id,name,ical_url,address,city,state,platform) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [req.user.sub, name, ical_url, address||null, city||null, state||null, platform||'AIRBNB']
    );
    res.json({ success: true, property: r.rows[0] });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// PRO LEVEL EVENTS
app.get('/api/professionals/me/level-events', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const proRes = await pool.query('SELECT id FROM professionals WHERE user_id=$1 LIMIT 1', [req.user.sub]);
    if (!proRes.rows.length) return res.json({ data: [] });
    const r = await pool.query('SELECT * FROM level_events WHERE professional_id=$1 ORDER BY created_at DESC LIMIT 50', [proRes.rows[0].id]).catch(()=>({rows:[]}));
    res.json({ data: r.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});

// COMPLETE BOOKING - cashback + level update
app.post('/api/bookings/:id/complete', requireAuth, async (req, res) => {
  const pool = getPool();
  try {
    const bRes = await pool.query('SELECT * FROM bookings WHERE id=$1', [req.params.id]);
    if (!bRes.rows.length) return res.status(404).json({ error: 'Not found' });
    const b = bRes.rows[0];
    await pool.query("UPDATE bookings SET status='COMPLETED', checked_out_at=NOW() WHERE id=$1", [req.params.id]);
    const cashback = Number(b.client_price||0) * 0.05;
    if (cashback > 0 && b.company_id) {
      const cu = await pool.query('SELECT user_id FROM companies WHERE id=$1', [b.company_id]).catch(()=>({rows:[]}));
      if (cu.rows.length) {
        await pool.query('UPDATE users SET wallet_balance=COALESCE(wallet_balance,0)+$1 WHERE id=$2', [cashback, cu.rows[0].user_id]).catch(()=>{});
        await pool.query('INSERT INTO cashback_transactions (user_id,booking_id,amount,description) VALUES ($1,$2,$3,$4)', [cu.rows[0].user_id, req.params.id, cashback, '5% cashback']).catch(()=>{});
      }
    }
    if (b.professional_id) {
      const pr = await pool.query('SELECT * FROM professionals WHERE id=$1', [b.professional_id]).catch(()=>({rows:[]}));
      if (pr.rows.length) {
        const p = pr.rows[0];
        const cnt = (p.services_this_month||0)+1;
        const lvl = cnt>=26?'GOLD':cnt>=11?'SILVER':'BRONZE';
        await pool.query('UPDATE professionals SET services_this_month=$1,level_id=$2,experience_points=COALESCE(experience_points,0)+10 WHERE id=$3', [cnt,lvl,p.id]).catch(()=>{});
        await pool.query('INSERT INTO level_events (professional_id,event_type,points_delta,description) VALUES ($1,$2,$3,$4)', [p.id,'SERVICE_COMPLETED',10,'Service completed']).catch(()=>{});
      }
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
  finally { await pool.end(); }
});
