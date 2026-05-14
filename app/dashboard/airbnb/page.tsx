'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://commercial-clean-setup.replit.app/api';
const C = { navy:'#0D3781',blue:'#1565C0',green:'#4CAF50',greenDk:'#388E3C',ink:'#0D1B2A',muted:'#64748B',border:'#E2E8F0',shadow:'0 2px 8px rgba(13,55,129,0.06)' };

const TXT: Record<string, any> = {
  en: {
    kicker:'AIRBNB MODULE', title:'Short-Term Rental Manager', subtitle:'Auto-schedule cleanings after every checkout. Photo evidence and AirCover reports included.',
    connect:'Connect Property Calendar', propertyName:'Property Name', ical:'iCal URL (Airbnb / VRBO / Booking.com)', connecting:'Connecting...', connectBtn:'Connect',
    connected:'Property connected successfully!', error:'Error connecting property', server:'Server error - try again',
    help:'How to get your iCal URL: Airbnb -> Calendar -> Availability Settings -> Export Calendar. VRBO -> Calendar -> Export iCal.',
    yourProperties:'Your Properties', active:'Active', inactive:'Inactive', syncing:'Syncing', every15:'Every 15 min', nextCheckout:'Next checkout', checking:'Checking...',
    emptyTitle:'No properties connected yet', emptyText:'Connect your Airbnb or VRBO calendar above to auto-schedule cleanings after every checkout',
    how:'How Auto-Scheduling Works', referral:'Host Referral Program', referralText:'Refer other Airbnb hosts and earn 2% of their cleanings forever',
    code:'YOUR HOST REFERRAL CODE', copy:'Copy Host Code', copied:'Copied!', why:'Why hosts love EverClean',
    steps:[
      ['Calendar syncs every 15 min','We check your Airbnb calendar for new checkouts automatically'],
      ['Checkout detected','A cleaning order is created automatically for the checkout date'],
      ['Pro assigned','Best available professional dispatched within your area'],
      ['Photo evidence uploaded','Pre-cleaning, inventory check, and post-cleaning photos'],
      ['Report sent to you','PDF inspection report delivered to your email'],
    ],
    reasons:['Automatic scheduling - no manual coordination','AirCover-ready damage reports with photos','Inventory checklists: towels, coffee, toiletries','Consistent quality with same pro every time','2% lifetime referral rewards'],
  },
  es: {
    kicker:'MODULO AIRBNB', title:'Administrador de rentas cortas', subtitle:'Programa limpiezas automaticamente despues de cada checkout. Incluye fotos y reportes para AirCover.',
    connect:'Conectar calendario de propiedad', propertyName:'Nombre de propiedad', ical:'URL iCal (Airbnb / VRBO / Booking.com)', connecting:'Conectando...', connectBtn:'Conectar',
    connected:'Propiedad conectada correctamente.', error:'Error conectando propiedad', server:'Error del servidor - intenta otra vez',
    help:'Como obtener tu URL iCal: Airbnb -> Calendar -> Availability Settings -> Export Calendar. VRBO -> Calendar -> Export iCal.',
    yourProperties:'Tus propiedades', active:'Activa', inactive:'Inactiva', syncing:'Sincronizacion', every15:'Cada 15 min', nextCheckout:'Proximo checkout', checking:'Revisando...',
    emptyTitle:'No hay propiedades conectadas', emptyText:'Conecta tu calendario Airbnb o VRBO para programar limpiezas despues de cada checkout',
    how:'Como funciona la programacion automatica', referral:'Programa de referidos para hosts', referralText:'Refiere otros hosts y gana 2% de sus limpiezas para siempre',
    code:'TU CODIGO DE REFERIDO HOST', copy:'Copiar codigo', copied:'Copiado!', why:'Por que los hosts aman EverClean',
    steps:[
      ['El calendario sincroniza cada 15 min','Revisamos tu calendario Airbnb para nuevos checkouts automaticamente'],
      ['Checkout detectado','Se crea una orden de limpieza para la fecha de checkout'],
      ['Pro asignado','El mejor profesional disponible es enviado en tu area'],
      ['Evidencia fotografica subida','Fotos pre-limpieza, inventario y post-limpieza'],
      ['Reporte enviado','Reporte PDF de inspeccion enviado a tu email'],
    ],
    reasons:['Programacion automatica - sin coordinacion manual','Reportes de danos listos para AirCover con fotos','Listas de inventario: toallas, cafe, articulos','Calidad consistente con el mismo pro','2% de comision vitalicia por referidos'],
  },
};

function Badge({ label, color = C.navy }: { label: string; color?: string }) {
  return <span style={{width:34,height:34,borderRadius:10,background:color+'14',border:'1px solid '+color+'30',color,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,flexShrink:0}}>{label}</span>;
}

export default function AirbnbPage() {
  const { lang } = useTranslation();
  const tx = TXT[lang] || TXT.en;
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
      if(r.ok){setProperties(p=>[...p,d.property||{id:Date.now(),name:propName,ical_url:icalUrl,is_active:true}]);setIcalUrl('');setPropName('');setMsg(tx.connected);}
      else setMsg(d.error||tx.error);
    }catch{setMsg(tx.server);}
    setSaving(false);
  }

  const card=(extra?:any)=>({background:'#fff',border:'1px solid '+C.border,borderRadius:14,boxShadow:C.shadow,...extra});
  const refCode='AIRBNB-'+(user?.id||'HOST').slice(0,6).toUpperCase();

  return (
    <div style={{maxWidth:1000,margin:'0 auto',fontFamily:"'Inter',system-ui,sans-serif"}}>
      <style>{'@media(max-width:760px){.airbnb-form,.airbnb-grid{grid-template-columns:1fr!important}.airbnb-form button{width:100%}}'}</style>
      <div style={{marginBottom:28}}>
        <p style={{margin:'0 0 4px',color:C.greenDk,fontSize:11,fontWeight:800,letterSpacing:'0.12em',textTransform:'uppercase'}}>{tx.kicker}</p>
        <h1 style={{margin:0,fontSize:'clamp(22px,3vw,32px)',fontWeight:700,color:C.ink}}>{tx.title}</h1>
        <p style={{margin:'6px 0 0',color:C.muted,fontSize:14}}>{tx.subtitle}</p>
      </div>

      <div style={card({padding:24,marginBottom:16})}>
        <h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:800,color:C.ink,display:'flex',gap:10,alignItems:'center'}}><Badge label="IC" color={C.blue}/>{tx.connect}</h3>
        <div className="airbnb-form" style={{display:'grid',gridTemplateColumns:'1fr 1.5fr auto',gap:12,alignItems:'end'}}>
          <div><label style={{display:'block',fontSize:11,fontWeight:800,color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{tx.propertyName}</label><input value={propName} onChange={e=>setPropName(e.target.value)} placeholder="Beach House Miami" style={{width:'100%',height:48,border:'1px solid '+C.border,borderRadius:8,padding:'0 14px',fontSize:14,color:C.ink,outline:'none',boxSizing:'border-box'}}/></div>
          <div><label style={{display:'block',fontSize:11,fontWeight:800,color:C.muted,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{tx.ical}</label><input value={icalUrl} onChange={e=>setIcalUrl(e.target.value)} placeholder="https://www.airbnb.com/calendar/ical/..." style={{width:'100%',height:48,border:'1px solid '+C.border,borderRadius:8,padding:'0 14px',fontSize:14,color:C.ink,outline:'none',boxSizing:'border-box'}}/></div>
          <button onClick={addProperty} disabled={saving||!icalUrl||!propName} style={{height:48,padding:'0 24px',borderRadius:9999,border:0,background:C.green,color:'#fff',fontSize:14,fontWeight:800,cursor:'pointer',whiteSpace:'nowrap',opacity:saving||!icalUrl||!propName?0.6:1}}>{saving?tx.connecting:tx.connectBtn}</button>
        </div>
        {msg&&<div style={{marginTop:12,padding:'10px 14px',borderRadius:8,background:msg.includes(tx.connected)?'#F0FDF4':'#FEF2F2',color:msg.includes(tx.connected)?C.greenDk:'#991B1B',fontSize:13}}>{msg}</div>}
        <div style={{marginTop:16,padding:'12px 16px',background:'#F8FAFC',borderRadius:10,fontSize:12,color:C.muted}}>{tx.help}</div>
      </div>

      {properties.length>0&&<div style={{marginBottom:16}}><h3 style={{margin:'0 0 14px',fontSize:15,fontWeight:800,color:C.ink}}>{tx.yourProperties} ({properties.length})</h3><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>{properties.map((p:any)=><div key={p.id} style={card({padding:20})}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}><div style={{display:'flex',gap:10,alignItems:'center'}}><Badge label="PR" color={C.navy}/><div style={{fontSize:15,fontWeight:800,color:C.ink}}>{p.name}</div></div><span style={{borderRadius:9999,padding:'3px 10px',fontSize:11,fontWeight:800,background:p.is_active?'#D1FAE5':'#F1F5F9',color:p.is_active?'#065F46':'#64748B'}}>{p.is_active?tx.active:tx.inactive}</span></div><div style={{fontSize:12,color:C.muted,marginBottom:8}}>{p.city&&String(p.city+', '+p.state)}</div><div style={{fontSize:11,color:C.blue,wordBreak:'break-all'}}>{p.ical_url?.slice(0,40)}...</div><div style={{marginTop:12,padding:'10px 0',borderTop:'1px solid '+C.border,display:'flex',gap:16}}>{[{l:tx.syncing,v:tx.every15,c:C.green},{l:tx.nextCheckout,v:tx.checking,c:C.blue}].map(s=><div key={s.l}><div style={{fontSize:10,color:C.muted,marginBottom:2}}>{s.l}</div><div style={{fontSize:12,fontWeight:800,color:s.c}}>{s.v}</div></div>)}</div></div>)}</div></div>}

      {properties.length===0&&<div style={card({padding:40,textAlign:'center',marginBottom:16})}><div style={{display:'flex',justifyContent:'center',marginBottom:16}}><Badge label="ST" color={C.navy}/></div><div style={{fontSize:16,fontWeight:800,color:C.ink,marginBottom:8}}>{tx.emptyTitle}</div><div style={{fontSize:14,color:C.muted}}>{tx.emptyText}</div></div>}

      <div className="airbnb-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={card({padding:24})}><h3 style={{margin:'0 0 16px',fontSize:15,fontWeight:800,color:C.ink}}>{tx.how}</h3>{tx.steps.map((s:any,i:number)=><div key={s[0]} style={{display:'flex',gap:12,marginBottom:14}}><span style={{width:24,height:24,borderRadius:'50%',background:C.navy,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{i+1}</span><div><div style={{fontSize:13,fontWeight:800,color:C.ink}}>{s[0]}</div><div style={{fontSize:12,color:C.muted}}>{s[1]}</div></div></div>)}</div>
        <div style={card({padding:24})}><h3 style={{margin:'0 0 4px',fontSize:15,fontWeight:800,color:C.ink}}>{tx.referral}</h3><p style={{margin:'0 0 16px',fontSize:12,color:C.muted}}>{tx.referralText}</p><div style={{background:'linear-gradient(135deg,#0D3781,#1565C0)',borderRadius:12,padding:20,marginBottom:16}}><div style={{fontSize:10,color:'rgba(255,255,255,0.6)',marginBottom:6,letterSpacing:'0.1em'}}>{tx.code}</div><div style={{fontSize:20,fontWeight:800,color:'#fff',letterSpacing:'0.08em',marginBottom:12}}>{refCode}</div><button onClick={()=>{navigator.clipboard.writeText(refCode);setRefCopied(true);setTimeout(()=>setRefCopied(false),2000);}} style={{padding:'8px 20px',borderRadius:9999,border:0,background:C.green,color:'#fff',fontSize:12,fontWeight:800,cursor:'pointer'}}>{refCopied?tx.copied:tx.copy}</button></div><div style={{background:'#FFF7ED',borderRadius:10,padding:16,border:'1px solid #FED7AA'}}><div style={{fontSize:13,fontWeight:800,color:'#92400E',marginBottom:8}}>{tx.why}</div>{tx.reasons.map((s:string,i:number)=><div key={i} style={{display:'flex',gap:8,marginBottom:i<tx.reasons.length-1?6:0,fontSize:12,color:'#92400E'}}><span style={{color:C.green,fontWeight:900}}>OK</span><span>{s}</span></div>)}</div></div>
      </div>
    </div>
  );
}


