'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';
const C = { navy:'#0D3781',blue:'#1565C0',green:'#4CAF50',greenDk:'#388E3C',ink:'#0D1B2A',muted:'#64748B',border:'#E2E8F0',shadow:'0 2px 8px rgba(13,55,129,0.06)' };
const COPY: Record<string, Record<string, string>> = {
  en: {
    kicker: 'WALLET',
    title: 'My Wallet',
    sub: '5% cashback on every service. Credits never expire. Earn 2% from referrals forever.',
    maintenance: 'Maintenance Wallet',
    cashback: 'Total Cashback',
    referral: 'Referral Earnings',
    history: 'Cashback History',
    historyText: '5% of each completed service goes to your wallet',
    empty: 'No completed services yet',
    refer: 'Refer and Earn',
    referText: 'Earn 2% of every service your referrals book forever',
    code: 'YOUR REFERRAL CODE',
    copy: 'Copy Code',
    copied: 'Copied!',
    coverage: '$1,000,000 Service Coverage - Every Booking',
    coverageText: 'Every EverClean service is automatically covered by our liability insurance. Coverage is voided if payment is made outside the platform. This protects you and ensures quality.',
    completedServices: 'completed services',
    peopleReferred: 'people referred',
    deepWindows: 'For Deep Cleaning and Windows',
  },
  es: {
    kicker: 'BILLETERA',
    title: 'Mi billetera',
    sub: '5% cashback en cada servicio. Los creditos nunca expiran. Gana 2% por referidos para siempre.',
    maintenance: 'Billetera de mantenimiento',
    cashback: 'Cashback total',
    referral: 'Ganancias por referidos',
    history: 'Historial de cashback',
    historyText: '5% de cada servicio completado va a tu billetera',
    empty: 'Aun no hay servicios completados',
    refer: 'Refiere y gana',
    referText: 'Gana 2% de cada servicio reservado por tus referidos para siempre',
    code: 'TU CODIGO DE REFERIDO',
    copy: 'Copiar codigo',
    copied: 'Copiado!',
    coverage: 'Cobertura de servicio de $1,000,000 - Cada booking',
    coverageText: 'Cada servicio de EverClean esta cubierto automaticamente por nuestro seguro de responsabilidad. La cobertura se anula si el pago se realiza fuera de la plataforma. Esto te protege y asegura calidad.',
    completedServices: 'servicios completados',
    peopleReferred: 'personas referidas',
    deepWindows: 'Para Deep Cleaning y ventanas',
  },
};
function Badge({label,color='#0D3781'}:{label:string;color?:string}){return <span style={{width:34,height:34,borderRadius:10,background:color+'14',border:'1px solid '+color+'30',color,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,flexShrink:0}}>{label}</span>}
export default function WalletPage() {
  const { lang } = useTranslation();
  const tx = COPY[lang] || COPY.en;
  const [user,setUser]=useState<any>(null);
  const [bookings,setBookings]=useState<any[]>([]);
  const [referrals,setReferrals]=useState<any[]>([]);
  const [copied,setCopied]=useState(false);
  useEffect(()=>{
    const t=localStorage.getItem('token')||'';
    fetch(API+'/auth/me',{headers:{Authorization:'Bearer '+t}}).then(r=>r.json()).then(setUser);
    fetch(API+'/bookings',{headers:{Authorization:'Bearer '+t}}).then(r=>r.json()).then(d=>setBookings((d.data||[]).filter((b:any)=>b.status==='COMPLETED')));
    fetch(API+'/referrals',{headers:{Authorization:'Bearer '+t}}).then(r=>r.json()).then(d=>setReferrals(d.data||[])).catch(()=>{});
  },[]);
  const cashback=bookings.reduce((s:number,b:any)=>s+Number(b.client_price||0)*0.05,0);
  const walletBalance=user?.wallet_balance||cashback;
  const refCode=user?.referral_code||('EC-'+(user?.id||'').slice(0,6).toUpperCase());
  const refEarned=referrals.reduce((s:number,r:any)=>s+Number(r.total_earned||0),0);
  const card=(extra?:any)=>({background:'#fff',border:`1px solid ${C.border}`,borderRadius:14,boxShadow:C.shadow,...extra});
  function copy(){navigator.clipboard.writeText(refCode);setCopied(true);setTimeout(()=>setCopied(false),2000);}
  const svc=(v?:string)=>(v||'Service').replace(/_/g,' ').toLowerCase().replace(/\b\w/g,(c:string)=>c.toUpperCase());
  return (
    <div style={{maxWidth:900,margin:'0 auto',fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{marginBottom:28}}>
        <p style={{margin:'0 0 4px',color:C.greenDk,fontSize:11,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase'}}>{tx.kicker}</p>
        <h1 style={{margin:0,fontSize:'clamp(22px,3vw,32px)',fontWeight:600,color:C.ink}}>{tx.title}</h1>
        <p style={{margin:'6px 0 0',color:C.muted,fontSize:14}}>{tx.sub}</p>
      </div>
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:16}}>
        {[{l:tx.maintenance,v:`${walletBalance.toFixed(2)}`,sub:tx.deepWindows,c:C.green},
          {l:tx.cashback,v:`${cashback.toFixed(2)}`,sub:`${bookings.length} ${tx.completedServices}`,c:C.blue},
          {l:tx.referral,v:`${refEarned.toFixed(2)}`,sub:`${referrals.length} ${tx.peopleReferred}`,c:C.navy}].map(s=>(
          <div key={s.l} style={card({padding:20})}>
            <div style={{marginBottom:8}}><Badge label={s.l.slice(0,2).toUpperCase()} color={s.c}/></div>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{s.l}</div>
            <div style={{fontSize:28,fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        {/* Cashback history */}
        <div style={card({padding:24})}>
          <h3 style={{margin:'0 0 4px',fontSize:15,fontWeight:600,color:C.ink}}>{tx.history}</h3>
          <p style={{margin:'0 0 16px',fontSize:12,color:C.muted}}>{tx.historyText}</p>
          {bookings.length===0
            ?<div style={{padding:'40px 0',textAlign:'center',color:C.muted,fontSize:14}}>{tx.empty}</div>
            :<div style={{display:'flex',flexDirection:'column',gap:8}}>
              {bookings.slice(0,6).map((b:any)=>(
                <div key={b.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',background:'#F8FAFC',borderRadius:10}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:C.ink}}>{svc(b.service_type)}</div>
                    <div style={{fontSize:11,color:C.muted}}>{b.scheduled_at?new Date(b.scheduled_at).toLocaleDateString():''}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:12,color:C.muted}}>${Number(b.client_price||0).toFixed(0)}</div>
                    <div style={{fontSize:13,fontWeight:700,color:C.green}}>+${(Number(b.client_price||0)*0.05).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>}
        </div>
        {/* Referrals */}
        <div style={card({padding:24})}>
          <h3 style={{margin:'0 0 4px',fontSize:15,fontWeight:600,color:C.ink}}>{tx.refer}</h3>
          <p style={{margin:'0 0 16px',fontSize:12,color:C.muted}}>{tx.referText}</p>
          <div style={{background:'linear-gradient(135deg,#0D3781,#1565C0)',borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.6)',marginBottom:6,letterSpacing:'0.1em'}}>{tx.code}</div>
            <div style={{fontSize:22,fontWeight:700,color:'#fff',letterSpacing:'0.08em',marginBottom:12}}>{refCode}</div>
            <button onClick={copy} style={{padding:'8px 20px',borderRadius:9999,border:0,background:C.green,color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}>
              {copied?tx.copied:tx.copy}
            </button>
          </div>
          <div style={{background:'#F0FDF4',borderRadius:10,padding:16,marginBottom:16}}>
            {['Share your code with friends or Airbnb hosts','They book their first EverClean service','You earn 2% of every booking they make','Commissions credited to your wallet automatically'].map((s,i)=>(
              <div key={i} style={{display:'flex',gap:10,marginBottom:i<3?8:0}}>
                <span style={{width:20,height:20,borderRadius:'50%',background:C.green,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0}}>{i+1}</span>
                <span style={{fontSize:12,color:C.ink}}>{s}</span>
              </div>
            ))}
          </div>
          {referrals.length>0&&<div>
            <div style={{fontSize:12,fontWeight:600,color:C.ink,marginBottom:8}}>Your referrals ({referrals.length})</div>
            {referrals.map((r:any)=>(
              <div key={r.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${C.border}`,fontSize:12}}>
                <span style={{color:C.ink}}>{r.referred_name||'Member'}</span>
                <span style={{color:C.green,fontWeight:600}}>+${Number(r.total_earned||0).toFixed(2)}</span>
              </div>
            ))}
          </div>}
        </div>
      </div>
      {/* Insurance badge */}
      <div style={{...card({padding:20}),display:'flex',alignItems:'center',gap:16,background:'linear-gradient(135deg,#F0FDF4,#EFF6FF)'}}>
        <Badge label="CV" color={C.greenDk}/>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:C.ink}}>{tx.coverage}</div>
          <div style={{fontSize:13,color:C.muted}}>{tx.coverageText}</div>
        </div>
      </div>
    </div>
  );
}
