# EverClean — Financial Engine v2.0
# Para: Agente Replit
# Archivo objetivo: /home/runner/workspace/api-server/server.mjs

## OBJETIVO
Implementar las reglas financieras definitivas de EverClean en el archivo
`api-server/server.mjs`. NO tocar ningún otro archivo.

## REGLAS DE NEGOCIO — IMPLEMENTAR EXACTAMENTE ASÍ

### Split plataforma
- EverClean retiene: 50% de cada servicio
- Pro recibe: 50% de cada servicio (antes de bonos)

### Bonos por nivel (pagados del margen de EverClean)
- PLATA (0-10 jobs/mes): 0% bono
- GOLD (11-25 jobs/mes): +5% bono sobre su base
- PLATINUM (26+ jobs/mes): +10% bono sobre su base

### VIP Membership
- Descuento: 15% sobre el precio del servicio
- Membresía: $49/mes (opcional, cancel anytime)
- El descuento se absorbe proporcionalmente en el split 50/50

### Instant Pay — fee total 10%
- Stripe toma: ~3% (2.9% + $0.30 fijo)
- EverClean retiene: 7% restante como ingreso adicional
- Fuente del fee por nivel:
  - PLATA: sin bono → 10% sale de sus ganancias → pro recibe 90% de base
  - GOLD: bono 5% cubre mitad + 5% de ganancias → pro recibe 95% de base
  - PLATINUM: bono 10% cubre todo el fee → pro recibe 100% de base
- GOLD y PLATINUM: cada 6to instant pay es GRATIS

### Margen dinámico (NO es fijo)
- Varía según tarifa horaria del pro que reclama el job
- Pro $18/hr en job $180 → margen EverClean ~80%
- Pro $25/hr en job $180 → margen EverClean ~69%
- Pro $30/hr en job $180 → margen EverClean ~66%
- Cap $30/hr protege margen mínimo ~40%

## IMPLEMENTACIÓN

Busca la función `calcProPayout` en `api-server/server.mjs` y reemplázala
con el siguiente bloque completo:

```javascript
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
```

## ADEMÁS — busca y reemplaza estos valores en todo el archivo

1. `clientPrice * 0.55` → `clientPrice * PRO_SPLIT`
2. `clientPrice * 0.45` → `clientPrice * PLATFORM_SPLIT`
3. `price * 0.55` → `price * PRO_SPLIT`
4. `price * 0.45` → `price * PLATFORM_SPLIT`
5. `client_price,0) * 0.55` → `client_price,0) * 0.50`

## VERIFICACIÓN

Después de los cambios ejecuta:
```bash
curl -s "http://localhost:8080/api/quote?service=HOUSE_CLEANING&sqft=1000&state=NJ"
```

Debe retornar:
- `clientPrice`: 180
- `maxPayout`: 90 (50% de 180)
- `proPayoutAt18`: 36 (18×2h, margen EC = 80%)
- `proPayoutAt22`: 44 (22×2h, margen EC = 75.6%)
- `proPayoutAt30`: 60 (30×2h, margen EC = 66.7%)

## GIT
```bash
git add api-server/server.mjs
git commit -m "feat: Financial Engine v2.0 — 50/50 split, VIP 15%, PLATA/GOLD/PLATINUM instant pay"
git push origin main
```

## NO TOCAR
- Lógica de marketplace y bandas de subasta
- Rate cap rules ($25-30/hr limits)
- Endpoints de Stripe, auth, bookings
- Pricing matrix de estados
- Cualquier otro archivo fuera de api-server/server.mjs
