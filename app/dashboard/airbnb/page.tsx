'use client';
import { useEffect, useState } from 'react';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';
const C = { navy:'#0D3781',blue:'#1565C0',green:'#4CAF50',greenDk:'#388E3C',ink:'#0D1B2A',muted:'#64748B',border:'#E2E8F0',shadow:'0 2px 8px rgba(13,55,129,0.06)' };
const SS:Record<string,{bg:string,color:string}>={SCHEDULED:{bg:'#DBEAFE',color:'#1E40AF'},ASSIGNED:{bg:'#EDE9FE',color:'#5B21B6'},COMPLETED:{bg:'#D1FAE5',color:'#065F46'},PENDING:{bg:'#FEF3C7',color:'#92400E'}};
export default function AirbnbPage() {
  const [properties,setProperties]=useState<any[]>([]);
  const [icalUrl,setIcalUrl]=useState('');
  const [propName,setPropName]=useState('');
  const [saving,setSaving]=useState(false);
  const [msg,setMsg]=useState('');
  const [refCopied,setRefCopied]=useState(false);
  const [user,setUser]=useState<any>(null);
  useEffect(()=>{
    const t=localStorage.getItem('token')||'';
    fetch(API+'/auth/me',{headers:{Authorization:'Bearer '+t}}).then(r=>r.json()).then(setUser);
    fetch(API+'/airbnb/properties',{headers:{Authorization:'Bearer '+t}}).then(r=>r.json()).then(d=>setProperties(d.data||[])).catch(()=>{});
  },[]);
  async function addProperty(){
    if(!icalUrl||!propName)return;
    setSaving(true);
    const t=localStorage.getItem('token')||'';
    try{
      const r=await fetch(API+'/airbnb/properties',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({name:propName,ical_url:icalUrl})});
      const d=await r.json();
      if(r.ok){setProperties(p=>[...p,d.property||{id:Date.now(),name:propName,ical_url:icalUrl,is_active:true}]);setIcalUrl('');setPropName('');setMsg('Property connected successfully!');}
      else setMsg(d.error||'Error connecting property');
    }catch{setMsg('Server error — try again');}
    setSaving(false);
  }
  const card=(extra?:any)=>({background:'#fff',border:`1px solid ${C.border}`,borderRadius:14,boxShadow:C.shadow,...extra});
  const refCode='AIRBNB-'+(user?.id||'HOST').slice(0,6).toUpperCase();
  return (
    <div style={{maxWidth:1000,margin:'0 auto',fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{marginBottom:28}}>
        <p style={{margin:'0 0 4px',color:C.greenDk,fontSize:11,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase'}}>AIRBNB MODULE</p>
        <h1 style={{margin:0,fontSize:'clamp(22px,3vw,32px)',fontWeight:600,color:C.ink}}>Short-Term Rental Manager</h1>
        <p style={{margin:'6px 0 0',color:C.muted,fontSize:14}}>Auto-schedule cleanings after every checkout. Photo evidence & AirCover reports included.</p>
      </div>
      {/* Connect calendar */}
      <div style={card({padding:24,marginBottom:16})}>
        <h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:600,color:C.ink}}>🔗 Connect Property Calendar</h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr auto',gap:12,alignItems:'end'}}>
          <div>
            <label style={{display:'block',fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Property Name</label>
            <input value={propName} onChange={e=>setPropName(e.target.value)} placeholder="Beach House Miami" style={{width:'100%',height:48,border:`1px solid ${C.border}`,borderRadius:8,padding:'0 14px',fontSize:14,color:C.ink,outline:'none',boxSizing:'border-box' as const}}/>
          </div>
          <div>
            <label style={{display:'block',fontSize:11,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>iCal URL (Airbnb / VRBO / Booking.com)</label>
            <input value={icalUrl} onChange={e=>setIcalUrl(e.target.value)} placeholder="https://www.airbnb.com/calendar/ical/..." style={{width:'100%',height:48,border:`1px solid ${C.border}`,borderRadius:8,padding:'0 14px',fontSize:14,color:C.ink,outline:'none',boxSizing:'border-box' as const}}/>
          </div>
          <button onClick={addProperty} disabled={saving||!icalUrl||!propName} style={{height:48,padding:'0 24px',borderRadius:9999,border:0,background:C.green,color:'#fff',fontSize:14,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap' as const,opacity:saving||!icalUrl||!propName?0.6:1}}>
            {saving?'Connecting...':'+ Connect'}
          </button>
        </div>
        {msg&&<div style={{marginTop:12,padding:'10px 14px',borderRadius:8,background:msg.includes('success')?'#F0FDF4':'#FEF2F2',color:msg.includes('success')?C.greenDk:'#991B1B',fontSize:13}}>{msg}</div>}
        <div style={{marginTop:16,padding:'12px 16px',background:'#F8FAFC',borderRadius:10,fontSize:12,color:C.muted}}>
          📍 <strong>How to get your iCal URL:</strong> Airbnb → Calendar → Availability Settings → Export Calendar. VRBO → Calendar → Export iCal.
        </div>
      </div>
      {/* Properties list */}
      {properties.length>0&&(
        <div style={{marginBottom:16}}>
          <h3 style={{margin:'0 0 14px',fontSize:15,fontWeight:600,color:C.ink}}>🏠 Your Properties ({properties.length})</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
            {properties.map((p:any)=>(
              <div key={p.id} style={card({padding:20})}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <div style={{fontSize:15,fontWeight:600,color:C.ink}}>{p.name}</div>
                  <span style={{borderRadius:9999,padding:'3px 10px',fontSize:11,fontWeight:600,background:p.is_active?'#D1FAE5':'#F1F5F9',color:p.is_active?'#065F46':'#64748B'}}>{p.is_active?'Active':'Inactive'}</span>
                </div>
                <div style={{fontSize:12,color:C.muted,marginBottom:8}}>{p.city&&`${p.city}, ${p.state}`}</div>
                <div style={{fontSize:11,color:C.blue,wordBreak:'break-all' as const}}>{p.ical_url?.slice(0,40)}...</div>
                <div style={{marginTop:12,padding:'10px 0',borderTop:`1px solid ${C.border}`,display:'flex',gap:16}}>
                  {[{l:'Syncing',v:'Every 15 min',c:C.green},{l:'Next checkout',v:'Checking...',c:C.blue}].map(s=>(
                    <div key={s.l}><div style={{fontSize:10,color:C.muted,marginBottom:2}}>{s.l}</div><div style={{fontSize:12,fontWeight:600,color:s.c}}>{s.v}</div></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {properties.length===0&&(
        <div style={card({padding:40,textAlign:'center',marginBottom:16})}>
          <div style={{fontSize:48,marginBottom:16}}>🏠</div>
          <div style={{fontSize:16,fontWeight:600,color:C.ink,marginBottom:8}}>No properties connected yet</div>
          <div style={{fontSize:14,color:C.muted}}>Connect your Airbnb or VRBO calendar above to auto-schedule cleanings after every checkout</div>
        </div>
      )}
      {/* How it works */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={card({padding:24})}>
          <h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:600,color:C.ink}}>⚡ How Auto-Scheduling Works</h3>
          {[{n:1,t:'Calendar syncs every 15 min',d:'We check your Airbnb calendar for new checkouts automatically'},{n:2,t:'Checkout detected',d:'A cleaning order is created automatically for the checkout date'},{n:3,t:'Pro assigned',d:'Best available professional dispatched within your area'},{n:4,t:'Photo evidence uploaded',d:'Pre-cleaning, inventory check, and post-cleaning photos'},{n:5,t:'Report sent to you',d:'PDF inspection report delivered to your email'}].map(s=>(
            <div key={s.n} style={{display:'flex',gap:12,marginBottom:14}}>
              <span style={{width:24,height:24,borderRadius:'50%',background:C.navy,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>{s.n}</span>
              <div><div style={{fontSize:13,fontWeight:600,color:C.ink}}>{s.t}</div><div style={{fontSize:12,color:C.muted}}>{s.d}</div></div>
            </div>
          ))}
        </div>
        <div style={card({padding:24})}>
          <h3 style={{margin:'0 0 4px',fontSize:15,fontWeight:600,color:C.ink}}>🤝 Host Referral Program</h3>
          <p style={{margin:'0 0 16px',fontSize:12,color:C.muted}}>Refer other Airbnb hosts and earn 2% of their cleanings forever</p>
          <div style={{background:'linear-gradient(135deg,#0D3781,#1565C0)',borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.6)',marginBottom:6,letterSpacing:'0.1em'}}>YOUR HOST REFERRAL CODE</div>
            <div style={{fontSize:20,fontWeight:700,color:'#fff',letterSpacing:'0.08em',marginBottom:12}}>{refCode}</div>
            <button onClick={()=>{navigator.clipboard.writeText(refCode);setRefCopied(true);setTimeout(()=>setRefCopied(false),2000);}} style={{padding:'8px 20px',borderRadius:9999,border:0,background:C.green,color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}>
              {refCopied?'✓ Copied!':'Copy Host Code'}
            </button>
          </div>
          <div style={{background:'#FFF7ED',borderRadius:10,padding:16,border:`1px solid #FED7AA`}}>
            <div style={{fontSize:13,fontWeight:600,color:'#92400E',marginBottom:8}}>🏆 Why hosts love EverClean</div>
            {['Automatic scheduling — no manual coordination','AirCover-ready damage reports with photos','Inventory checklists (towels, coffee, toiletries)','Consistent quality with same pro every time','2% lifetime commissions for referrals'].map((s,i)=>(
              <div key={i} style={{display:'flex',gap:8,marginBottom:i<4?6:0,fontSize:12,color:'#92400E'}}>
                <span>✓</span><span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
