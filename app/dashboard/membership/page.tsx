'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';
const C = { navy:'#0D3781',blue:'#1565C0',green:'#4CAF50',greenDk:'#388E3C',ink:'#0D1B2A',muted:'#64748B',border:'#E2E8F0',shadow:'0 2px 8px rgba(13,55,129,0.06)' };
const VIP_RATE=36,MARKET_RATE=45,FEE=49,CREDITS=+(49/36).toFixed(2);
const COPY: Record<string, Record<string, string>> = { en:{kicker:'{tx.kicker}',title:'VIP Membership',sub:'{tx.sub}',member:'VIP Member',free:'Free Plan',upgradeText:'Upgrade to lock in $36/hr and never lose hours',accumulate:'Hours accumulate every month - they never expire',upgrade:'Upgrade to VIP',calculator:'Booking Calculator',hours:'{tx.hours}',market:'{tx.market}',vipRate:'{tx.vipRate}',walletUsed:'{tx.walletUsed}',youPay:'{tx.youPay}',benefits:'VIP Benefits',history:'Time Wallet History'}, es:{kicker:'MEMBRESIA',title:'Membresia VIP',sub:'Tus horas nunca expiran. Tu profesional siempre es tuyo.',member:'Miembro VIP',free:'Plan gratis',upgradeText:'Sube a VIP para fijar $36/hr y no perder horas',accumulate:'Las horas se acumulan cada mes - nunca expiran',upgrade:'Subir a VIP',calculator:'Calculadora de booking',hours:'Horas necesarias',market:'Tarifa mercado',vipRate:'Tarifa VIP',walletUsed:'Creditos usados',youPay:'Tu pagas',benefits:'Beneficios VIP',history:'Historial de horas'} };
function Badge({label}:{label:string}){return <span style={{width:34,height:34,borderRadius:10,background:'#0D378114',border:'1px solid #0D378130',color:'#0D3781',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,flexShrink:0}}>{label}</span>}
export default function MembershipPage() {
  const { lang } = useTranslation();
  const tx = COPY[lang] || COPY.en;
  const [user,setUser]=useState<any>(null);
  const [txns,setTxns]=useState<any[]>([]);
  const [hours,setHours]=useState(2);
  const [msg,setMsg]=useState('');
  useEffect(()=>{
    const t=localStorage.getItem('token')||'';
    fetch(API+'/auth/me',{headers:{Authorization:'Bearer '+t}}).then(r=>r.json()).then(setUser);
    fetch(API+'/membership/wallet',{headers:{Authorization:'Bearer '+t}}).then(r=>r.json()).then(w=>setTxns(w.transactions||[])).catch(()=>{});
  },[]);
  const isVIP=user?.membership_status==='vip';
  const walletHrs=+((user?.time_wallet_minutes||0)/60).toFixed(2);
  const creditsToUse=Math.min(walletHrs,hours);
  const cashToPay=Math.max(0,(hours-creditsToUse)*VIP_RATE);
  const s=(b:string,st:string)=>({background:b,border:`1px solid ${C.border}`,borderRadius:14,boxShadow:C.shadow,padding:st});
  return (
    <div style={{maxWidth:900,margin:'0 auto',fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{marginBottom:28}}>
        <p style={{margin:'0 0 4px',color:C.greenDk,fontSize:11,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase'}}>MEMBERSHIP</p>
        <h1 style={{margin:0,fontSize:'clamp(22px,3vw,32px)',fontWeight:600,color:C.ink}}>{tx.title}</h1>
        <p style={{margin:'6px 0 0',color:C.muted,fontSize:14}}>Your hours never expire. Your cleaner is always yours.</p>
      </div>
      {/* Status Banner */}
      <div style={{...s(isVIP?'linear-gradient(135deg,#0D3781,#1565C0)':'#fff','28px'),marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
              <span style={{fontSize:28}}>{isVIP?<Badge label="VIP"/>:<Badge label="FR"/>}</span>
              <div>
                <div style={{fontSize:20,fontWeight:700,color:isVIP?'#fff':C.ink}}>{isVIP?tx.member:tx.free}</div>
                <div style={{fontSize:13,color:isVIP?'rgba(255,255,255,0.7)':C.muted}}>{isVIP?tx.accumulate:tx.upgradeText}</div>
              </div>
            </div>
            {isVIP&&<div style={{display:'flex',gap:24,marginTop:12}}>
              {[{l:'TIME WALLET',v:`${walletHrs}h`,c:'#fff'},{l:'ADDED/MONTH',v:`${CREDITS}h`,c:C.green},{l:'YOUR RATE',v:`$${VIP_RATE}/hr`,c:'#fff'},{l:'MARKET RATE',v:`$${MARKET_RATE}/hr`,c:'rgba(255,255,255,0.5)'}].map(x=>(
                <div key={x.l}><div style={{fontSize:10,color:'rgba(255,255,255,0.55)',marginBottom:2,letterSpacing:'0.1em'}}>{x.l}</div><div style={{fontSize:22,fontWeight:700,color:x.c,textDecoration:x.c==='rgba(255,255,255,0.5)'?'line-through':'none'}}>{x.v}</div></div>
              ))}
            </div>}
          </div>
          {!isVIP&&<button onClick={()=>setMsg('Stripe activation coming soon. Contact support@evercleanapp.com')} style={{padding:'14px 28px',borderRadius:9999,border:0,background:C.green,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer'}}>{tx.upgrade} - ${FEE}/mo</button>}
        </div>
        {msg&&<div style={{marginTop:12,padding:'10px 14px',borderRadius:8,background:'rgba(0,0,0,0.12)',color:isVIP?'#fff':C.ink,fontSize:13}}>{msg}</div>}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        {/* Calculator */}
        <div style={{...s('#fff','24px')}}>
          <h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:600,color:C.ink}}>{tx.calculator}</h3>
          <label style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em'}}>Hours needed</label>
          <div style={{display:'flex',alignItems:'center',gap:12,margin:'8px 0 16px'}}>
            <button onClick={()=>setHours(h=>Math.max(1,+(h-0.5).toFixed(1)))} style={{width:36,height:36,borderRadius:'50%',border:`1px solid ${C.border}`,background:'#fff',fontSize:18,cursor:'pointer',fontWeight:700}}>−</button>
            <span style={{fontSize:28,fontWeight:700,color:C.ink,minWidth:60,textAlign:'center'}}>{hours}h</span>
            <button onClick={()=>setHours(h=>+(h+0.5).toFixed(1))} style={{width:36,height:36,borderRadius:'50%',border:`1px solid ${C.border}`,background:'#fff',fontSize:18,cursor:'pointer',fontWeight:700}}>+</button>
          </div>
          <div style={{background:'#F8FAFC',borderRadius:10,padding:16,display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:C.muted}}>Market rate ({hours}h × ${MARKET_RATE})</span><span style={{color:C.muted,textDecoration:'line-through'}}>${hours*MARKET_RATE}</span></div>
            {isVIP&&<div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:C.blue}}>VIP rate ({hours}h × ${VIP_RATE})</span><span style={{color:C.blue}}>${hours*VIP_RATE}</span></div>}
            {isVIP&&walletHrs>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:C.green}}>Wallet credits used ({creditsToUse}h)</span><span style={{color:C.green}}>−${+(creditsToUse*VIP_RATE).toFixed(0)}</span></div>}
            <div style={{display:'flex',justifyContent:'space-between',fontSize:16,fontWeight:700,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
              <span style={{color:C.ink}}>You pay</span>
              <span style={{color:isVIP?C.green:C.ink}}>${isVIP?cashToPay.toFixed(0):(hours*MARKET_RATE).toFixed(0)}</span>
            </div>
            {isVIP&&<div style={{fontSize:12,color:C.green,fontWeight:600}}>💚 You save ${((hours*MARKET_RATE)-cashToPay).toFixed(0)} vs market rate</div>}
          </div>
          {!isVIP&&<div style={{marginTop:12,padding:'10px 14px',borderRadius:8,background:'#F0FDF4',border:`1px solid #BBF7D0`,fontSize:12,color:C.greenDk}}>💡 As VIP you'd pay <strong>${(hours*VIP_RATE).toFixed(0)}</strong> and save <strong>${(hours*(MARKET_RATE-VIP_RATE)).toFixed(0)}</strong></div>}
        </div>
        {/* Benefits */}
        <div style={{...s('#fff','24px')}}>
          <h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:600,color:C.ink}}>{tx.benefits}</h3>
          {[{icon:'⏰',t:'Hours Never Expire',d:'Balance carries over every month, forever'},{icon:'💚',t:'$36/hr vs $45/hr market',d:'20% discount on every cleaning, always'},{icon:'⭐',t:'Guaranteed Match',d:'Favorite cleaner gets 48h exclusive priority'},{icon:'🛡️',t:'$1M Liability Coverage',d:'Every service protected automatically'},{icon:'⚡',t:`+${CREDITS}h every month`,d:`Your $${FEE} converts to ${CREDITS} cleaning hours`},{icon:'📱',t:'Priority Support',d:'Dedicated VIP support line 7 days/week'}].map(b=>(
            <div key={b.t} style={{display:'flex',gap:12,marginBottom:14}}>
              <Badge label={b.t.slice(0,2).toUpperCase()}/>
              <div><div style={{fontSize:13,fontWeight:600,color:C.ink}}>{b.t}</div><div style={{fontSize:12,color:C.muted}}>{b.d}</div></div>
            </div>
          ))}
        </div>
      </div>
      {/* Wallet History */}
      <div style={{...s('#fff','24px')}}>
        <h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:600,color:C.ink}}>{tx.history}</h3>
        {txns.length===0
          ?<div style={{padding:'40px 0',textAlign:'center',color:C.muted,fontSize:14}}>{isVIP?'No transactions yet — hours will appear here each month':'Upgrade to VIP to start accumulating hours'}</div>
          :<div style={{display:'flex',flexDirection:'column',gap:10}}>
            {txns.map((tx:any)=>(
              <div key={tx.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',background:'#F8FAFC',borderRadius:10}}>
                <div><div style={{fontSize:13,fontWeight:600,color:C.ink}}>{tx.description||tx.type}</div><div style={{fontSize:11,color:C.muted}}>{new Date(tx.created_at).toLocaleDateString()}</div></div>
                <div style={{fontSize:14,fontWeight:700,color:tx.minutes>0?C.green:'#EF4444'}}>{tx.minutes>0?'+':''}{+(tx.minutes/60).toFixed(2)}h</div>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}
