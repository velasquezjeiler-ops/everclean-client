'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';
const C = { navy:'#0D3781',blue:'#1565C0',green:'#4CAF50',greenDk:'#388E3C',ink:'#0D1B2A',muted:'#64748B',border:'#E2E8F0',shadow:'0 2px 8px rgba(13,55,129,0.06)',gold:'#F59E0B' };
const LEVELS=[{id:'BRONZE',label:'Bronze',icon:'🥉',min:0,max:10,commission:20,bonus:0,color:'#CD7F32',bg:'#FFF7ED',benefits:['Standard payouts (3-5 days)','Base hourly rate','Standard job visibility']},{id:'SILVER',label:'Silver',icon:'🥈',min:11,max:25,commission:15,bonus:10,color:'#9CA3AF',bg:'#F9FAFB',benefits:['+10% income bonus','Instant payouts (same day)','Priority job visibility','Silver badge on profile']},{id:'GOLD',label:'Gold',icon:'🥇',min:26,max:999,commission:10,bonus:15,color:'#F59E0B',bg:'#FFFBEB',benefits:['+15% income bonus','Instant payouts (same day)','Subsidized health micro-insurance','Gold badge — top search results','Dedicated support line']}];
const COPY: Record<string, Record<string, string>> = { en:{kicker:'{tx.kicker}',title:'My Level and {tx.benefits}',sub:'More services means higher level, more income, and better benefits.',services:'{tx.services}',rate:'{tx.rate}',commission:'Platform fee',benefits:'Benefits',points:'Points System',activity:'Recent Activity',current:'{tx.current}'}, es:{kicker:'CARRERA PRO',title:'Mi nivel y beneficios',sub:'Mas servicios significa mayor nivel, mas ingresos y mejores beneficios.',services:'servicios este mes',rate:'TU TARIFA EFECTIVA',commission:'Comision plataforma',benefits:'Beneficios',points:'Sistema de puntos',activity:'Actividad reciente',current:'ACTUAL'} };
function Badge({label,color='#0D3781'}:{label:string;color?:string}){return <span style={{width:38,height:38,borderRadius:12,background:color+'14',border:'1px solid '+color+'30',color,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,flexShrink:0}}>{label}</span>}
export default function LevelsPage() {
  const { lang } = useTranslation();
  const tx = COPY[lang] || COPY.en;
  const [pro,setPro]=useState<any>(null);
  const [bookings,setBookings]=useState<any[]>([]);
  const [events,setEvents]=useState<any[]>([]);
  useEffect(()=>{
    const t=localStorage.getItem('token')||'';
    fetch(API+'/professionals/me',{headers:{Authorization:'Bearer '+t}}).then(r=>r.json()).then(setPro);
    fetch(API+'/professionals/me/bookings',{headers:{Authorization:'Bearer '+t}}).then(r=>r.json()).then(d=>setBookings(d.data||[])).catch(()=>{});
    fetch(API+'/professionals/me/level-events',{headers:{Authorization:'Bearer '+t}}).then(r=>r.json()).then(d=>setEvents(d.data||[])).catch(()=>{});
  },[]);
  const now=new Date();
  const thisMonth=bookings.filter((b:any)=>{const d=new Date(b.created_at||b.scheduled_at||'');return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()&&b.status==='COMPLETED';});
  const servicesThisMonth=pro?.services_this_month||thisMonth.length;
  const currentLevel=LEVELS.find(l=>servicesThisMonth>=l.min&&servicesThisMonth<=l.max)||LEVELS[0];
  const nextLevel=LEVELS[LEVELS.indexOf(currentLevel)+1];
  const progress=nextLevel?((servicesThisMonth-currentLevel.min)/(nextLevel.min-currentLevel.min))*100:100;
  const baseRate=Number(pro?.hourly_rate||pro?.rate||20);
  const bonusRate=baseRate*(currentLevel.bonus/100);
  const card=(extra?:any)=>({background:'#fff',border:`1px solid ${C.border}`,borderRadius:14,boxShadow:C.shadow,...extra});
  return (
    <div style={{maxWidth:900,margin:'0 auto',fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{marginBottom:28}}>
        <p style={{margin:'0 0 4px',color:C.greenDk,fontSize:11,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase'}}>CAREER PATH</p>
        <h1 style={{margin:0,fontSize:'clamp(22px,3vw,32px)',fontWeight:600,color:C.ink}}>{tx.title}</h1>
        <p style={{margin:'6px 0 0',color:C.muted,fontSize:14}}>{tx.sub}</p>
      </div>
      {/* Current level banner */}
      <div style={{...card({padding:28,marginBottom:16}),background:`linear-gradient(135deg,${currentLevel.color}22,${currentLevel.bg})`}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <span style={{fontSize:52}}><Badge label={currentLevel.id.slice(0,2)} color={currentLevel.color}/></span>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>{currentLevel.label} </div>
              <div style={{fontSize:28,fontWeight:700,color:C.ink}}>{servicesThisMonth} services this month</div>
              {nextLevel&&<div style={{fontSize:13,color:C.muted,marginTop:4}}>{nextLevel.min-servicesThisMonth} more to reach {nextLevel.label} {nextLevel.icon}</div>}
              {!nextLevel&&<div style={{fontSize:13,color:currentLevel.color,fontWeight:600,marginTop:4}}>🏆 Maximum level achieved!</div>}
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:4}}>YOUR EFFECTIVE RATE</div>
            <div style={{fontSize:32,fontWeight:700,color:C.green}}>${(baseRate+bonusRate).toFixed(0)}/hr</div>
            {currentLevel.bonus>0&&<div style={{fontSize:12,color:C.green}}>Base ${baseRate} + {currentLevel.bonus}% bonus</div>}
            <div style={{fontSize:12,color:C.muted,marginTop:4}}>{tx.commission}: {currentLevel.commission}%</div>
          </div>
        </div>
        {nextLevel&&(
          <div style={{marginTop:20}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:C.muted,marginBottom:6}}>
              <span>{currentLevel.label}: {servicesThisMonth} services</span>
              <span>{nextLevel.label}: {nextLevel.min} services needed</span>
            </div>
            <div style={{background:'rgba(0,0,0,0.08)',borderRadius:9999,height:10,overflow:'hidden'}}>
              <div style={{width:`${Math.min(100,progress)}%`,height:'100%',background:currentLevel.color,borderRadius:9999,transition:'width 0.5s ease'}}/>
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:4,textAlign:'right'}}>{Math.round(progress)}% to {nextLevel.label}</div>
          </div>
        )}
      </div>
      {/* All levels */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:16}}>
        {LEVELS.map(l=>{
          const isCurrent=l.id===currentLevel.id;
          return (
            <div key={l.id} style={card({padding:20,border:isCurrent?`2px solid ${l.color}`:`1px solid ${C.border}`,position:'relative'})}>
              {isCurrent&&<div style={{position:'absolute',top:12,right:12,borderRadius:9999,padding:'3px 10px',fontSize:10,fontWeight:700,background:l.color,color:'#fff'}}>CURRENT</div>}
              <div style={{marginBottom:8}}><Badge label={l.id.slice(0,2)} color={l.color}/></div>
              <div style={{fontSize:16,fontWeight:700,color:C.ink,marginBottom:4}}>{l.label}</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:12}}>{l.id==='GOLD'?`${l.min}+`:`${l.min}–${l.max}`} services/month</div>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Benefits</div>
              {l.benefits.map((b:string)=>(
                <div key={b} style={{display:'flex',gap:8,marginBottom:6,fontSize:12,color:C.ink}}>
                  <span style={{color:l.id==='GOLD'?C.gold:l.id==='SILVER'?C.blue:C.muted}}>✓</span><span>{b}</span>
                </div>
              ))}
              <div style={{marginTop:14,padding:'10px 14px',borderRadius:10,background:l.bg,textAlign:'center'}}>
                <div style={{fontSize:11,color:C.muted}}>Platform commission</div>
                <div style={{fontSize:20,fontWeight:700,color:l.color}}>{l.commission}%</div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Points system */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={card({padding:24})}>
          <h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:600,color:C.ink}}>{tx.points}</h3>
          {[{icon:'✅',l:'Service completed',pts:'+10 pts',c:C.green},{icon:'🏆',l:'Perfect Week (no cancellations)',pts:'+50 pts',c:C.gold},{icon:'⭐',l:'5-star rating received',pts:'+5 pts',c:C.blue},{icon:'❌',l:'Last-minute cancellation',pts:'−25 pts',c:'#EF4444'},{icon:'⚠️',l:'No-show',pts:'−50 pts',c:'#EF4444'},{icon:'🔥',l:'10 services in a week',pts:'+30 pts',c:C.green}].map(p=>(
            <div key={p.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <Badge label={p.l.slice(0,2).toUpperCase()} color={p.c}/>
                <span style={{fontSize:13,color:C.ink}}>{p.l}</span>
              </div>
              <span style={{fontSize:13,fontWeight:700,color:p.c}}>{p.pts}</span>
            </div>
          ))}
        </div>
        <div style={card({padding:24})}>
          <h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:600,color:C.ink}}>{tx.activity}</h3>
          {events.length===0
            ?<div style={{padding:'40px 0',textAlign:'center',color:C.muted,fontSize:14}}>No activity yet — complete your first service to earn points</div>
            :<div style={{display:'flex',flexDirection:'column',gap:10}}>
              {events.slice(0,8).map((e:any)=>(
                <div key={e.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'#F8FAFC',borderRadius:10}}>
                  <div><div style={{fontSize:13,fontWeight:600,color:C.ink}}>{e.description||e.event_type}</div><div style={{fontSize:11,color:C.muted}}>{new Date(e.created_at).toLocaleDateString()}</div></div>
                  <span style={{fontSize:13,fontWeight:700,color:Number(e.points_delta)>0?C.green:'#EF4444'}}>{Number(e.points_delta)>0?'+':''}{e.points_delta} pts</span>
                </div>
              ))}
            </div>}
        </div>
      </div>
    </div>
  );
}
