'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ─── CONSTANTES (mirror del backend) ────────────────────────

const STATE_OPTIONS = [
  { code:'NJ',name:'New Jersey',tier:'A'},{ code:'NY',name:'New York',tier:'A'},
  { code:'CT',name:'Connecticut',tier:'A'},{ code:'CA',name:'California',tier:'A'},
  { code:'MA',name:'Massachusetts',tier:'A'},{ code:'WA',name:'Washington',tier:'A'},
  { code:'FL',name:'Florida',tier:'B'},{ code:'TX',name:'Texas',tier:'B'},
  { code:'IL',name:'Illinois',tier:'B'},{ code:'CO',name:'Colorado',tier:'B'},
  { code:'MD',name:'Maryland',tier:'B'},{ code:'VA',name:'Virginia',tier:'B'},
  { code:'GA',name:'Georgia',tier:'C'},{ code:'NC',name:'North Carolina',tier:'C'},
  { code:'TN',name:'Tennessee',tier:'C'},{ code:'OH',name:'Ohio',tier:'C'},
  { code:'PA',name:'Pennsylvania',tier:'C'},{ code:'MI',name:'Michigan',tier:'C'},
  { code:'AL',name:'Alabama',tier:'D'},{ code:'TX',name:'Texas',tier:'B'},
  { code:'MO',name:'Missouri',tier:'D'},{ code:'AZ',name:'Arizona',tier:'B'},
];

const TIER_LABELS: Record<string,string> = {
  A: '🏙 Alto costo de vida (+20%)',
  B: '🏘 Tarifa base nacional',
  C: '🌳 Tarifa regional (-10%)',
  D: '🌾 Tarifa económica (-15%)',
};

const STATE_MULTIPLIERS: Record<string,number> = {
  A: 1.20, B: 1.00, C: 0.90, D: 0.85,
};

const SERVICE_RATES: Record<string,{label:string;icon:string;rate:number;min:number;commercial:boolean;desc:string}> = {
  HOUSE_CLEANING:    {label:'House Cleaning',    icon:'🏠',rate:0.15,min:120,commercial:false,desc:'Regular residential'},
  DEEP_CLEANING:     {label:'Deep Cleaning',     icon:'✨',rate:0.20,min:150,commercial:false,desc:'Top-to-bottom'},
  MOVE_IN_OUT:       {label:'Move In / Out',     icon:'📦',rate:0.28,min:200,commercial:false,desc:'Full property reset'},
  SAME_DAY_CLEANING: {label:'Same Day',          icon:'⚡',rate:0.18,min:130,commercial:false,desc:'Available today'},
  OFFICE_CLEANING:   {label:'Office Cleaning',   icon:'🏢',rate:0.14,min:150,commercial:true, desc:'Pros $18-$22/hr'},
  POST_CONSTRUCTION: {label:'Post Construction', icon:'🔨',rate:0.22,min:180,commercial:true, desc:'After remodel'},
  MEDICAL_CLEANING:  {label:'Medical / Clinical',icon:'🏥',rate:0.32,min:250,commercial:true, desc:'Hospital-grade'},
  CARPET_CLEANING:   {label:'Carpet Cleaning',   icon:'🛋️',rate:0.18,min:130,commercial:false,desc:'Deep extraction'},
  WINDOW_CLEANING:   {label:'Window Cleaning',   icon:'🪟',rate:0.16,min:120,commercial:false,desc:'Interior & exterior'},
  ORGANIZING:        {label:'Organizing',         icon:'📋',rate:0.15,min:120,commercial:false,desc:'Declutter & organize'},
};

const FREQ_OPTIONS = [
  {key:'ONE_TIME', label:'One Time',  disc:0},
  {key:'MONTHLY',  label:'Monthly',   disc:0.05},
  {key:'BI_WEEKLY',label:'Bi-Weekly', disc:0.10},
  {key:'WEEKLY',   label:'Weekly',    disc:0.15},
];

// Mínimos por habitaciones (anti-fraude)
const ROOM_SQFT_MIN: Record<string,number> = {
  '0-1':400,'1-1':500,'1-2':650,
  '2-1':750,'2-2':1000,
  '3-2':1200,'3-3':1500,
  '4-2':1800,'4-3':2200,'4-4':2600,
  '5-3':2800,'5-4':3200,'6-4':3800,
};

function getRoomSqftMin(beds:number, baths:number):number|null {
  return ROOM_SQFT_MIN[`${beds}-${baths}`] ?? null;
}

function estimatedHours(sqft:number):number {
  if(sqft<=1000) return 2;
  if(sqft<=2000) return 3;
  if(sqft<=3500) return 4;
  return 5;
}

// Car wash
const VEHICLE_TYPES = [
  {code:'COMPACT', label:'Compact / Hatchback',  examples:'Corolla, Civic, Elantra, Golf, Mazda3'},
  {code:'SEDAN',   label:'Sedan',                examples:'Camry, Accord, Altima, BMW 3, Audi A4'},
  {code:'SUV_MID', label:'SUV Mediano',          examples:'RAV4, CR-V, Rogue, Equinox, Tucson'},
  {code:'SUV_LG',  label:'SUV Grande',           examples:'Highlander, Explorer, Telluride, Palisade'},
  {code:'SUV_XL',  label:'SUV Full-Size',        examples:'Expedition, Suburban, Yukon XL, Sequoia'},
  {code:'TRUCK_S', label:'Pickup Cabina Sencilla',examples:'F-150 Regular, Silverado Regular, Ram Regular'},
  {code:'TRUCK_DC',label:'Pickup Doble Cabina',  examples:'F-150 Crew, Ram Crew, Tacoma DC, Frontier DC'},
  {code:'TRUCK_HD',label:'Pickup Heavy Duty',    examples:'F-250, F-350, Ram 2500/3500, Silverado 2500HD'},
  {code:'VAN',     label:'Van / Minivan',        examples:'Odyssey, Pacifica, Sienna, Carnival, Grand Caravan'},
];

const CAR_PKG_DETAILS = {
  BASIC:    {label:'Basic Wash',     includes:'Exterior wash + secado + ventanas'},
  STANDARD: {label:'Standard',      includes:'Basic + aspirado interior + tablero'},
  INTERIOR: {label:'Interior Only', includes:'Aspirado + superficies + vidrios int.'},
  FULL:     {label:'Full Detail',   includes:'Exterior completo + interior completo'},
  PREMIUM:  {label:'Premium',       includes:'Full + cera + llantas + aromatizante'},
  VIP:      {label:'VIP',           includes:'Premium + protector + cuero + motor'},
};

const CAR_WASH_RATES: Record<string,Record<string,number>> = {
  COMPACT:  {BASIC:45,STANDARD:65,INTERIOR:60,FULL:95, PREMIUM:130,VIP:180},
  SEDAN:    {BASIC:50,STANDARD:70,INTERIOR:65,FULL:105,PREMIUM:140,VIP:195},
  SUV_MID:  {BASIC:60,STANDARD:85,INTERIOR:75,FULL:125,PREMIUM:165,VIP:220},
  SUV_LG:   {BASIC:70,STANDARD:95,INTERIOR:85,FULL:140,PREMIUM:185,VIP:245},
  SUV_XL:   {BASIC:80,STANDARD:110,INTERIOR:95,FULL:160,PREMIUM:210,VIP:275},
  TRUCK_S:  {BASIC:65,STANDARD:90,INTERIOR:80,FULL:130,PREMIUM:170,VIP:230},
  TRUCK_DC: {BASIC:75,STANDARD:100,INTERIOR:90,FULL:150,PREMIUM:195,VIP:260},
  TRUCK_HD: {BASIC:90,STANDARD:120,INTERIOR:105,FULL:175,PREMIUM:225,VIP:295},
  VAN:      {BASIC:80,STANDARD:105,INTERIOR:95,FULL:155,PREMIUM:200,VIP:265},
};

const ADDONS = [
  {code:'OZONE',      label:'Eliminación de olores',    price:35},
  {code:'PAINT_LIGHT',label:'Corrección de pintura',    price:60},
  {code:'CERAMIC',    label:'Recubrimiento cerámico',   price:120},
  {code:'ENGINE',     label:'Limpieza de motor',        price:45},
];

// ─── PRICE CALCULATOR ───────────────────────────────────────
function calcPrice(
  serviceType:string, sqft:number, beds:number|null, baths:number|null,
  stateCode:string, tier:string, frequency:string
):{price:number;hours:number;sqftUsed:number;corrected:boolean}|null {
  const cfg = SERVICE_RATES[serviceType];
  if(!cfg) return null;
  const multi = STATE_MULTIPLIERS[tier] ?? 1.00;
  const disc  = FREQ_OPTIONS.find(f=>f.key===frequency)?.disc ?? 0;

  let sqftUsed = sqft;
  let corrected = false;
  if(beds!=null && baths!=null){
    const minSqft = getRoomSqftMin(beds, baths);
    if(minSqft && sqft < minSqft){ sqftUsed=minSqft; corrected=true; }
  }

  const base  = Math.max(sqftUsed * cfg.rate * multi, cfg.min * multi);
  const price = parseFloat((base * (1-disc)).toFixed(2));
  const hours = estimatedHours(sqftUsed);
  return {price, hours, sqftUsed, corrected};
}

// ─── COMPONENT ──────────────────────────────────────────────
export default function NewBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1|2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Service selection
  const [serviceType, setServiceType] = useState('');
  const [state, setState] = useState('NJ');
  const stateTier = STATE_OPTIONS.find(s=>s.code===state)?.tier ?? 'B';

  // Cleaning fields
  const [sqft, setSqft] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [frequency, setFrequency] = useState('ONE_TIME');

  // Car wash fields
  const [vehicleCode, setVehicleCode] = useState('');
  const [carPkg, setCarPkg] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // Laundry
  const [weightLbs, setWeightLbs] = useState('10');
  // Dry cleaning
  const [itemCount, setItemCount] = useState('1');

  // Step 2
  const [address, setAddress] = useState('');
  const [city, setCity]       = useState('');
  const [zipCode, setZipCode] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');

  const isCleaning = serviceType in SERVICE_RATES;
  const isCarWash  = serviceType === 'CAR_WASH';
  const isLaundry  = serviceType === 'LAUNDRY_PICKUP';
  const isDry      = serviceType === 'DRY_CLEANING';

  // Live price calculation
  const priceCalc = (() => {
    if(!serviceType) return null;
    if(isCleaning){
      const s = parseInt(sqft)||0;
      if(s===0 && !beds) return null;
      return calcPrice(serviceType, s, beds?parseInt(beds):null, baths?parseInt(baths):null, state, stateTier, frequency);
    }
    if(isCarWash && vehicleCode && carPkg){
      const base = CAR_WASH_RATES[vehicleCode]?.[carPkg] ?? 0;
      const addonsTotal = selectedAddons.reduce((sum,a)=>sum+(ADDONS.find(x=>x.code===a)?.price??0),0);
      return {price: base+addonsTotal, hours:null, sqftUsed:null, corrected:false};
    }
    if(isLaundry){
      const lbs = Math.max(parseFloat(weightLbs)||10, 10);
      return {price: Math.max(lbs*3+30,60), hours:null, sqftUsed:null, corrected:false};
    }
    if(isDry){
      return {price: (parseInt(itemCount)||1)*12, hours:null, sqftUsed:null, corrected:false};
    }
    return null;
  })();

  const canStep1 = serviceType && priceCalc && priceCalc.price > 0;

  async function handleSubmit(){
    if(!address || !scheduledDate || !scheduledTime){ setError('Completa todos los campos requeridos.'); return; }
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('ec_token');
      const body: Record<string,unknown> = {
        service_type: serviceType, address, city, state, zip_code: zipCode,
        scheduled_date: scheduledDate, scheduled_time: scheduledTime, notes, frequency,
      };
      if(isCleaning){ body.sqft=parseInt(sqft)||0; body.bedrooms=beds?parseInt(beds):null; body.bathrooms=baths?parseInt(baths):null; }
      if(isCarWash){ body.vehicle_code=vehicleCode; body.package=carPkg; body.car_wash_addons=selectedAddons; }
      if(isLaundry) body.weight_lbs=parseFloat(weightLbs)||10;
      if(isDry)     body.item_count=parseInt(itemCount)||1;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings`, {
        method:'POST',
        headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body: JSON.stringify(body),
      });
      if(!res.ok) throw new Error((await res.json()).error ?? 'Error');
      router.push('/dashboard?booked=1');
    } catch(e:unknown){
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Steps */}
      <div className="flex items-center gap-3 mb-8">
        {[1,2].map(s=>(
          <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
            ${step>=s ? 'bg-gradient-to-br from-blue-600 to-green-500 text-white shadow' : 'bg-gray-200 text-gray-400'}`}>{s}</div>
        ))}
        <span className="text-sm text-gray-500">{step===1?'Servicio y precio':'Cuándo y dónde'}</span>
      </div>

      {/* ── STEP 1 ── */}
      {step===1 && (
        <div className="space-y-6">

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select value={state} onChange={e=>setState(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              {STATE_OPTIONS.filter((s,i,a)=>a.findIndex(x=>x.code===s.code)===i).map(s=>(
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">{TIER_LABELS[stateTier]}</p>
          </div>

          {/* Cleaning services */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Servicios de limpieza (por sqft)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(SERVICE_RATES).map(([key,cfg])=>(
                <button key={key} onClick={()=>setServiceType(key)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${serviceType===key?'border-blue-500 bg-blue-50':'border-gray-200 hover:border-blue-300'}`}>
                  <div className="text-xl mb-1">{cfg.icon}</div>
                  <div className="text-xs font-semibold text-gray-800 leading-tight">{cfg.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">${(cfg.rate*STATE_MULTIPLIERS[stateTier]).toFixed(2)}/sqft</div>
                  {cfg.commercial && <div className="text-xs text-amber-600 mt-0.5">Comercial</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Additional services */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Servicios adicionales</p>
            <div className="grid grid-cols-3 gap-2">
              {[{key:'CAR_WASH',label:'Car Wash',icon:'🚗'},{key:'LAUNDRY_PICKUP',label:'Laundry',icon:'👕'},{key:'DRY_CLEANING',label:'Dry Cleaning',icon:'👔'}]
                .map(s=>(
                <button key={s.key} onClick={()=>setServiceType(s.key)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${serviceType===s.key?'border-blue-500 bg-blue-50':'border-gray-200 hover:border-blue-300'}`}>
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-xs font-semibold text-gray-800">{s.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cleaning inputs */}
          {isCleaning && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Habitaciones</label>
                  <select value={beds} onChange={e=>setBeds(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                    <option value="">--</option>
                    {[0,1,2,3,4,5,6].map(n=><option key={n} value={n}>{n===0?'Studio':n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Baños</label>
                  <select value={baths} onChange={e=>setBaths(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                    <option value="">--</option>
                    {[1,2,3,4].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              {beds && baths && getRoomSqftMin(parseInt(beds),parseInt(baths)) && (
                <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                  Mínimo estimado para {beds==='0'?'Studio':`${beds}B/${baths}B`}: {getRoomSqftMin(parseInt(beds),parseInt(baths))} sqft
                </p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sqft exacto (opcional — validamos contra habitaciones)</label>
                <input type="number" min="100" value={sqft} onChange={e=>setSqft(e.target.value)}
                  placeholder="ej: 1200"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg font-semibold focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              {priceCalc?.corrected && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                  ⚠️ Sqft ajustado a {priceCalc.sqftUsed} según las habitaciones declaradas
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia</label>
                <div className="grid grid-cols-4 gap-2">
                  {FREQ_OPTIONS.map(f=>(
                    <button key={f.key} onClick={()=>setFrequency(f.key)}
                      className={`py-2 rounded-lg border-2 text-xs font-semibold transition-all ${frequency===f.key?'border-green-500 bg-green-50 text-green-700':'border-gray-200 text-gray-600 hover:border-green-300'}`}>
                      {f.label}
                      {f.disc>0 && <span className="block text-green-600">-{f.disc*100}%</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Car wash inputs */}
          {isCarWash && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de vehículo</label>
                <div className="space-y-2">
                  {VEHICLE_TYPES.map(v=>(
                    <button key={v.code} onClick={()=>setVehicleCode(v.code)}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all ${vehicleCode===v.code?'border-blue-500 bg-blue-50':'border-gray-200 hover:border-blue-300'}`}>
                      <div className="font-semibold text-sm text-gray-800">{v.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{v.examples}</div>
                    </button>
                  ))}
                </div>
              </div>
              {vehicleCode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paquete</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(CAR_PKG_DETAILS).map(([key,pkg])=>{
                      const price = CAR_WASH_RATES[vehicleCode]?.[key];
                      return (
                        <button key={key} onClick={()=>setCarPkg(key)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${carPkg===key?'border-blue-500 bg-blue-50':'border-gray-200 hover:border-blue-300'}`}>
                          <div className="text-sm font-semibold text-gray-800">{pkg.label}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{pkg.includes}</div>
                          <div className="text-blue-600 font-bold mt-1">${price}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {vehicleCode && carPkg && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add-ons (opcional)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ADDONS.map(a=>(
                      <button key={a.code}
                        onClick={()=>setSelectedAddons(prev=>prev.includes(a.code)?prev.filter(x=>x!==a.code):[...prev,a.code])}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${selectedAddons.includes(a.code)?'border-green-500 bg-green-50':'border-gray-200 hover:border-green-300'}`}>
                        <div className="text-xs font-semibold text-gray-800">{a.label}</div>
                        <div className="text-green-600 font-bold">+${a.price}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Laundry */}
          {isLaundry && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Libras estimadas (mín. 10 lbs)</label>
              <input type="number" min="10" value={weightLbs} onChange={e=>setWeightLbs(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg font-semibold focus:ring-2 focus:ring-blue-500 outline-none"/>
              <p className="text-xs text-gray-400 mt-1">$3/lb + $30 pickup & delivery</p>
            </div>
          )}

          {/* Dry cleaning */}
          {isDry && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de prendas</label>
              <input type="number" min="1" value={itemCount} onChange={e=>setItemCount(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg font-semibold focus:ring-2 focus:ring-blue-500 outline-none"/>
              <p className="text-xs text-gray-400 mt-1">$12 por prenda</p>
            </div>
          )}

          {/* Price preview */}
          {priceCalc && (
            <div className="bg-gradient-to-br from-blue-600 to-green-500 rounded-2xl p-5 text-white">
              <p className="text-sm text-blue-100 mb-1">Tu precio estimado ({STATE_OPTIONS.find(s=>s.code===state)?.name})</p>
              <p className="text-4xl font-black">${priceCalc.price.toFixed(2)}</p>
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-blue-100">
                {priceCalc.hours && <span>⏱ {priceCalc.hours}h</span>}
                {priceCalc.sqftUsed && <span>📐 {priceCalc.sqftUsed} sqft</span>}
                {FREQ_OPTIONS.find(f=>f.key===frequency)?.disc! > 0 && (
                  <span>🏷 -{FREQ_OPTIONS.find(f=>f.key===frequency)!.disc*100}%</span>
                )}
                {priceCalc.corrected && <span>⚠️ Sqft validado</span>}
              </div>
            </div>
          )}

          <button onClick={()=>canStep1&&setStep(2)} disabled={!canStep1}
            className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 to-green-500 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            Continuar →
          </button>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step===2 && (
        <div className="space-y-5">
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-800">{SERVICE_RATES[serviceType]?.label ?? serviceType}</div>
              {priceCalc?.hours && <div className="text-sm text-gray-500">{priceCalc.sqftUsed} sqft · {priceCalc.hours}h</div>}
            </div>
            <div className="text-2xl font-black text-blue-600">${priceCalc?.price.toFixed(2)}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
              <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="123 Main St, Apt 4B"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input value={city} onChange={e=>setCity(e.target.value)} placeholder="Newark"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
              <input value={zipCode} onChange={e=>setZipCode(e.target.value)} placeholder="08901"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input type="date" value={scheduledDate} onChange={e=>setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora *</label>
              <select value={scheduledTime} onChange={e=>setScheduledTime(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Seleccionar</option>
                {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'].map(t=>(
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
                placeholder="Código de acceso, mascotas, instrucciones especiales..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none"/>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

          <div className="flex gap-3">
            <button onClick={()=>setStep(1)}
              className="flex-1 py-4 rounded-xl font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
              ← Atrás
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 to-green-500 text-white hover:opacity-90 disabled:opacity-60 transition-all">
              {loading ? 'Creando...' : 'Confirmar Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
