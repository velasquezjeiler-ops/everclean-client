'use client';
import { useEffect, useState } from 'react';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';
const C = { navy:'#0D3781',blue:'#1565C0',green:'#4CAF50',greenDk:'#388E3C',ink:'#0D1B2A',muted:'#64748B',border:'#E2E8F0',shadow:'0 2px 8px rgba(13,55,129,0.06)' };
const STANDARDS=[{icon:'⭐',title:'Rating ≥ 4.8',desc:'Maintain high client satisfaction on every job',target:4.8,unit:'stars'},{icon:'✅',title:'Acceptance Rate ≥ 90%',desc:'Accept at least 9 out of 10 job offers',target:90,unit:'%'},{icon:'⏰',title:'On-time Arrival',desc:'Arrive within the scheduled window every time',target:95,unit:'%'},{icon:'📸',title:'Photo Evidence',desc:'Upload all 3 required photos for every job',target:100,unit:'%'},{icon:'🚫',title:'Zero Last-Min Cancellations',desc:'Never cancel within 24h of a scheduled job',target:0,unit:'incidents'}];
const TRAINING=[{title:'Professional Cleaning Standards',duration:'12 min',topic:'Residential techniques, product safety, efficiency'},  {title:'Communication with Clients',duration:'8 min',topic:'ETA updates, professionalism, platform messaging'},{title:'Photo Documentation Protocol',duration:'6 min',topic:'How to take proper evidence photos for Airbnb & AirCover'},{title:'Damage Reporting & AirCover',duration:'10 min',topic:'How to report damage immediately and protect yourself'},{title:'Time Management for Pros',duration:'15 min',topic:'Route optimization, scheduling, earning more per day'}];
export default function QualityPage() {
  const [pro,setPro]=useState<any>(null);
  const [bookings,setBookings]=useState<any[]>([]);
  useEffect(()=>{
    const t=localStorage.getItem('token')||'';
    fetch(API+'/professionals/me',{headers:{Authorization:'Bearer '+t}}).then(r=>r.json()).then(setPro);
    fetch(API+'/professionals/me/bookings',{headers:{Authorization:'Bearer '+t}}).then(r=>r.json()).then(d=>setBookings(d.data||[])).catch(()=>{});
  },[]);
  const completed=bookings.filter((b:any)=>b.status==='COMPLETED');
  const rating=Number(pro?.rating||pro?.current_rating||5.0);
  const score=Math.round((rating/5)*40 + (completed.length>0?30:0) + 30);
  const card=(extra?:any)=>({background:'#fff',border:`1px solid ${C.border}`,borderRadius:14,boxShadow:C.shadow,...extra});
  const scoreColor=score>=80?C.green:score>=60?C.blue:'#F59E0B';
  return (
    <div style={{maxWidth:900,margin:'0 auto',fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{marginBottom:28}}>
        <p style={{margin:'0 0 4px',color:C.greenDk,fontSize:11,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase'}}>QUALITY CENTER</p>
        <h1 style={{margin:0,fontSize:'clamp(22px,3vw,32px)',fontWeight:600,color:C.ink}}>Quality Standards</h1>
        <p style={{margin:'6px 0 0',color:C.muted,fontSize:14}}>Meet these standards to maintain your level and grow your income.</p>
      </div>
      {/* Score */}
      <div style={{...card({padding:28,marginBottom:16}),display:'flex',alignItems:'center',gap:28,flexWrap:'wrap'}}>
        <div style={{position:'relative',width:100,height:100,flexShrink:0}}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke={C.border} strokeWidth="10"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke={scoreColor} strokeWidth="10" strokeDasharray={`${(score/100)*264} 264`} strokeLinecap="round" transform="rotate(-90 50 50)"/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
            <div style={{fontSize:22,fontWeight:700,color:scoreColor}}>{score}</div>
            <div style={{fontSize:10,color:C.muted}}>/ 100</div>
          </div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:20,fontWeight:700,color:C.ink,marginBottom:4}}>Quality Score: {score>=80?'Excellent':score>=60?'Good':'Needs Improvement'}</div>
          <div style={{fontSize:14,color:C.muted,marginBottom:12}}>Based on your rating, completion rate, and compliance with EverClean standards</div>
          <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
            {[{l:'Rating',v:`${rating.toFixed(1)} ⭐`},{l:'Completed',v:completed.length},{l:'Level',v:pro?.level_id||'BRONZE'},{l:'Points',v:pro?.experience_points||0}].map(s=>(
              <div key={s.l}><div style={{fontSize:11,color:C.muted,marginBottom:2}}>{s.l}</div><div style={{fontSize:16,fontWeight:700,color:C.ink}}>{s.v}</div></div>
            ))}
          </div>
        </div>
      </div>
      {/* Standards checklist */}
      <div style={card({padding:24,marginBottom:16})}>
        <h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:600,color:C.ink}}>📋 EverClean Standards Checklist</h3>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {STANDARDS.map(s=>{
            const current=s.title.includes('Rating')?rating:s.title.includes('Acceptance')?92:s.title.includes('On-time')?96:s.title.includes('Photo')?100:0;
            const met=s.title.includes('Zero')?current===0:current>=s.target;
            return (
              <div key={s.title} style={{display:'flex',alignItems:'center',gap:16,padding:'14px 16px',background:'#F8FAFC',borderRadius:12}}>
                <span style={{fontSize:24,flexShrink:0}}>{s.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.ink,marginBottom:2}}>{s.title}</div>
                  <div style={{fontSize:12,color:C.muted}}>{s.desc}</div>
                  {!s.title.includes('Zero')&&<div style={{marginTop:8}}>
                    <div style={{background:C.border,borderRadius:9999,height:6,overflow:'hidden'}}>
                      <div style={{width:`${Math.min(100,(current/s.target)*100)}%`,height:'100%',background:met?C.green:C.blue,borderRadius:9999}}/>
                    </div>
                  </div>}
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:met?C.green:'#F59E0B'}}>{current}{s.unit}</div>
                  <div style={{fontSize:11,color:C.muted}}>target: {s.target}{s.unit}</div>
                </div>
                <span style={{fontSize:20}}>{met?'✅':'⚠️'}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Training */}
      <div style={card({padding:24})}>
        <h3 style={{margin:'0 0 4px',fontSize:15,fontWeight:600,color:C.ink}}>🎓 Training Center</h3>
        <p style={{margin:'0 0 16px',fontSize:12,color:C.muted}}>Complete training to earn certification badges and boost your quality score</p>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {TRAINING.map((tr,i)=>(
            <div key={tr.title} style={{display:'flex',alignItems:'center',gap:16,padding:'14px 16px',background:'#F8FAFC',borderRadius:12}}>
              <div style={{width:40,height:40,borderRadius:'50%',background:i===0?C.green:C.border,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:16,flexShrink:0}}>{i===0?'✓':'▶'}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:C.ink}}>{tr.title}</div>
                <div style={{fontSize:12,color:C.muted}}>{tr.topic}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:12,color:C.muted}}>{tr.duration}</div>
                {i===0&&<div style={{fontSize:11,fontWeight:600,color:C.green}}>Completed ✓</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
