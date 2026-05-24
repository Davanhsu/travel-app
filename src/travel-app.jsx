// v$(date +%s)
import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Firebase ───
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, getDocs, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAdHjcnI678F2XvpLcNNMpbDBRR8bkLYY0",
  authDomain: "hafnicetravel.firebaseapp.com",
  projectId: "hafnicetravel",
  storageBucket: "hafnicetravel.firebasestorage.app",
  messagingSenderId: "773425164448",
  appId: "1:773425164448:web:a33752aa9339f50ae099c5",
};

const fbApp  = initializeApp(firebaseConfig);
const fbAuth = getAuth(fbApp);
const fbDb   = getFirestore(fbApp);

// 啟用離線快取
try { enableIndexedDbPersistence(fbDb); } catch(e) {}

// ─────────────────────────────────────────────────────────────
// SVG Icons
// ─────────────────────────────────────────────────────────────
const Icon = ({ name, size=22, color="currentColor", sw=1.5 }) => {
  const s = { width:size, height:size, display:"block", flexShrink:0 };
  const p = { fill:"none", stroke:color, strokeWidth:sw, strokeLinecap:"round", strokeLinejoin:"round" };
  const icons = {
    calendar:      <svg style={s} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="17" rx="2" {...p}/><path d="M3 10h18M8 3v4M16 3v4" {...p}/></svg>,
    map:           <svg style={s} viewBox="0 0 24 24"><path d="M9 4L3 7v14l6-3 6 3 6-3V4l-6 3-6-3z" {...p}/><path d="M9 4v14M15 7v14" {...p}/></svg>,
    wallet:        <svg style={s} viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="14" rx="2" {...p}/><path d="M2 10h20" {...p}/><circle cx="17" cy="15" r="1.5" {...p}/><path d="M6 3l14 3" {...p}/></svg>,
    bookmark:      <svg style={s} viewBox="0 0 24 24"><path d="M5 3h14a1 1 0 011 1v17l-8-4-8 4V4a1 1 0 011-1z" {...p}/></svg>,
    copy:          <svg style={s} viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" {...p}/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" {...p}/></svg>,
    plus:          <svg style={s} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" {...p}/></svg>,
    "pencil-sm":   <svg style={s} viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2.121 2.121 0 013 3L12 16H9v-3z" {...p}/></svg>,
    trash:         <svg style={s} viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" {...p}/><path d="M10 11v6M14 11v6" {...p}/></svg>,
    "chevron-left":<svg style={s} viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" {...p}/></svg>,
    sun:           <svg style={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" {...p}/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" {...p}/></svg>,
    clock:         <svg style={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...p}/><path d="M12 7v5l3 3" {...p}/></svg>,
    location:      <svg style={s} viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" {...p}/><circle cx="12" cy="9" r="2.5" {...p}/></svg>,
    camera:        <svg style={s} viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" {...p}/><circle cx="12" cy="13" r="4" {...p}/></svg>,
    "arrow-right": <svg style={s} viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" {...p}/></svg>,
    "arrow-left":  <svg style={s} viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" {...p}/></svg>,
    refresh:       <svg style={s} viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6" {...p}/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" {...p}/></svg>,
    check:         <svg style={s} viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" {...p}/></svg>,
    grip:          <svg style={s} viewBox="0 0 24 24"><circle cx="9" cy="7"  r="1.2" fill={color}/><circle cx="15" cy="7"  r="1.2" fill={color}/><circle cx="9" cy="12" r="1.2" fill={color}/><circle cx="15" cy="12" r="1.2" fill={color}/><circle cx="9" cy="17" r="1.2" fill={color}/><circle cx="15" cy="17" r="1.2" fill={color}/></svg>,
    scenery:       <svg style={s} viewBox="0 0 24 24"><path d="M3 19l5-8 3.5 5.5L15 10l6 9H3z" {...p}/><path d="M17 6c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" {...p}/></svg>,
    "external-link":<svg style={s} viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" {...p}/><path d="M15 3h6v6M10 14L21 3" {...p}/></svg>,
    users:         <svg style={s} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" {...p}/><circle cx="9" cy="7" r="4" {...p}/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" {...p}/></svg>,
    "credit-card": <svg style={s} viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" {...p}/><path d="M1 10h22" {...p}/></svg>,
    x:             <svg style={s} viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" {...p}/></svg>,
    "plane-up":    <svg style={s} viewBox="0 0 24 24"><path d="M12 2L8 8H5L2 10l4 1 1 4 2-1 1 4 3-1V2z" {...p}/><path d="M2 22h20" {...p}/></svg>,
    "plane-down":  <svg style={s} viewBox="0 0 24 24"><path d="M12 22l-4-6H5L2 14l4-1 1-4 2 1 1-4 3 1V22z" {...p}/><path d="M2 2h20" {...p}/></svg>,
    "chevron-right":<svg style={s} viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" {...p}/></svg>,
    "chevron-down":<svg style={s} viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" {...p}/></svg>,
  };
  return icons[name]||null;
};

// ─────────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────────
const deepClone = o => JSON.parse(JSON.stringify(o));
const genId = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const WEEKDAYS = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

function parseLocalDate(s){ const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); }
function formatLocalDate(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }

function generateDays(start, end, existingDays=[]) {
  const map={}; existingDays.forEach(d=>{map[d.fullDate]=d;});
  const days=[], s=parseLocalDate(start), e=parseLocalDate(end);
  for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1)){
    const fd=formatLocalDate(d);
    days.push(map[fd]||{ weekDay:WEEKDAYS[d.getDay()], dateNumber:String(d.getDate()).padStart(2,"0"), month:String(d.getMonth()+1).padStart(2,"0"), fullDate:fd, schedule:[] });
  }
  return days;
}

// ─────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────
const PALETTE = [
  {id:0, bg:"#7A8286",fg:"#FFF",accent:"#C8BEB4",label:"藍灰"},
  {id:1, bg:"#74747E",fg:"#FFF",accent:"#B8BEB8",label:"紫灰"},
  {id:2, bg:"#A8B0A8",fg:"#FFF",accent:"#C8BEB4",label:"霧灰綠"},
  {id:3, bg:"#C0B4A8",fg:"#FFF",accent:"#7A5454",label:"奶灰棕"},
  {id:4, bg:"#7A4E4E",fg:"#FFF",accent:"#C0B4A8",label:"玫瑰赭"},
  {id:5, bg:"#A07E7C",fg:"#FFF",accent:"#DDD0CE",label:"莫蘭迪玫"},
  {id:6, bg:"#9A9A9A",fg:"#FFF",accent:"#C8BEB4",label:"銀灰"},
  {id:7, bg:"#5E6870",fg:"#FFF",accent:"#A8B0A8",label:"石板藍"},
  {id:8, bg:"#889688",fg:"#FFF",accent:"#C8BEB0",label:"薄荷灰"},
  {id:9, bg:"#BCB49E",fg:"#FFF",accent:"#A07E7C",label:"米白"},
  {id:10,bg:"#7A9EB8",fg:"#FFF",accent:"#C8DCE8",label:"霧藍"},
  {id:11,bg:"#90B4C8",fg:"#FFF",accent:"#CCE0EC",label:"天空藍"},
  {id:12,bg:"#D4B84E",fg:"#FFF",accent:"#F0E4B0",label:"蛋黃"},
  {id:13,bg:"#D4AA6A",fg:"#FFF",accent:"#EEE0BC",label:"蜂蜜橘"},
];
const APP_BG="#EEECEA", CARD_BG="#F8F7F5", BORDER="#D8D2CC";
const TEXT_D="#2E2824", TEXT_M="#6A6058", TEXT_L="#A09890";

const CURRENCIES = [
  {code:"TWD",symbol:"NT$",name:"台幣"},
  {code:"USD",symbol:"$",  name:"美金"},
  {code:"JPY",symbol:"¥",  name:"日圓"},
  {code:"KRW",symbol:"₩",  name:"韓元"},
  {code:"EUR",symbol:"€",  name:"歐元"},
  {code:"GBP",symbol:"£",  name:"英鎊"},
  {code:"THB",symbol:"฿",  name:"泰銖"},
  {code:"SGD",symbol:"S$", name:"新加坡幣"},
  {code:"HKD",symbol:"HK$",name:"港幣"},
  {code:"AUD",symbol:"A$", name:"澳幣"},
];

// 記帳類別 SVG（純線條，網頁端正常渲染）
const CatIcon = ({ id, size=24, color="currentColor" }) => {
  const s = { width:size, height:size, display:"block", flexShrink:0 };
  const p = { fill:"none", stroke:color, strokeWidth:1.6, strokeLinecap:"round", strokeLinejoin:"round" };
  switch(id){
    case "food":      return <svg style={s} viewBox="0 0 24 24"><path d="M3 2v7c0 1.66 1.34 3 3 3h.5v10h2V12H9c1.66 0 3-1.34 3-3V2h-2v5H8V2H6v5H4V2H3z" {...p}/><path d="M16 2v20h2V13.5c1.38-.35 2.5-1.9 2.5-3.75V2h-2v6h-1V2h-1.5z" {...p}/></svg>;
    case "transport": return <svg style={s} viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2" {...p}/><path d="M16 8h4l3 5v4h-7V8z" {...p}/><circle cx="5.5" cy="18.5" r="2.5" {...p}/><circle cx="18.5" cy="18.5" r="2.5" {...p}/></svg>;
    case "hotel":     return <svg style={s} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" {...p}/><path d="M9 22V12h6v10" {...p}/></svg>;
    case "ticket":    return <svg style={s} viewBox="0 0 24 24"><path d="M2 9a3 3 0 010 6v2a2 2 0 002 2h16a2 2 0 002-2v-2a3 3 0 010-6V7a2 2 0 00-2-2H4a2 2 0 00-2 2v2z" {...p}/><path d="M13 5v14M9 9h.01M9 12h.01M9 15h.01" {...p}/></svg>;
    case "shop":      return <svg style={s} viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" {...p}/><path d="M3 6h18M16 10a4 4 0 01-8 0" {...p}/></svg>;
    case "beauty":    return <svg style={s} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...p}/><path d="M9 12l2 2 4-4" {...p}/></svg>;
    case "cloth":     return <svg style={s} viewBox="0 0 24 24"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.86H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.86l.58-3.57a2 2 0 00-1.34-2.23z" {...p}/></svg>;
    case "snack":     return <svg style={s} viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" {...p}/></svg>;
    case "health":    return <svg style={s} viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2" {...p}/></svg>;
    case "photo":     return <svg style={s} viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" {...p}/><circle cx="12" cy="13" r="4" {...p}/></svg>;
    case "social":    return <svg style={s} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" {...p}/><circle cx="9" cy="7" r="4" {...p}/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" {...p}/></svg>;
    case "other":     return <svg style={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" {...p}/><path d="M12 8v4M12 16h.01" {...p}/></svg>;
    case "scenery":   return <svg style={s} viewBox="0 0 24 24"><path d="M3 19l5-8 3.5 5.5L15 10l6 9H3z" {...p}/><circle cx="15" cy="6" r="2" {...p}/></svg>;
    default:          return <svg style={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" {...p}/></svg>;
  }
};

const EXPENSE_CATS = [
  {id:"food",     label:"餐飲"  },
  {id:"transport",label:"交通"  },
  {id:"hotel",    label:"住宿"  },
  {id:"ticket",   label:"景點票"},
  {id:"shop",     label:"購物"  },
  {id:"beauty",   label:"美妝"  },
  {id:"cloth",    label:"服飾"  },
  {id:"other",    label:"其他"  },
];

const TRANSPORT_MODES = [
  {id:"walk",  label:"步行",  emoji:"🚶"},
  {id:"mrt",   label:"捷運",  emoji:"🚇"},
  {id:"bus",   label:"公車",  emoji:"🚌"},
  {id:"taxi",  label:"計程車",emoji:"🚕"},
  {id:"train", label:"火車",  emoji:"🚂"},
  {id:"uber",  label:"Uber", emoji:"📱"},
  {id:"drive", label:"自駕",  emoji:"🚗"},
];

const DEFAULT_PREFS = { journalLabel:"My Travel Journal", pageTitle:"Have a nice trip" };

function buildDefaultTrips() {
  const t1 = { id:"t1", name:"Tokyo", subtitle:"東京城市漫遊", startDate:"2025-05-15", endDate:"2025-05-19", paletteIdx:4, coverImage:null, currency:"JPY", companions:[], expenses:[], bookmarks:[], flights:[], days:generateDays("2025-05-15","2025-05-19") };
  t1.days[0].schedule=[{id:"e1",time:"14:00",title:"抵達成田機場",location:"成田國際機場 Terminal 2",locationUrl:"",duration:"入境",content:""}];
  t1.days[1].schedule=[{id:"e2",time:"10:00",title:"淺草寺・仲見世通",location:"東京都台東區淺草2丁目",locationUrl:"",duration:"2 小時",content:"日本最古老的寺廟，必拍雷門大燈籠"},{id:"e3",time:"13:00",title:"上野公園・午餐",location:"上野公園 東京都台東區",locationUrl:"",duration:"1.5 小時",content:""},{id:"e4",time:"15:30",title:"秋葉原電器街",location:"秋葉原 東京都千代田區",locationUrl:"",duration:"2 小時",content:"3C、動漫、扭蛋天堂"}];
  t1.days[2].schedule=[{id:"e5",time:"09:00",title:"築地場外市場",location:"築地場外市場 東京都中央區",locationUrl:"",duration:"1.5 小時",content:"必吃海膽丼、玉子燒"},{id:"e6",time:"11:30",title:"TeamLab Planets",location:"TeamLab Planets 豐洲 東京",locationUrl:"",duration:"2 小時",content:"預先網路購票，建議早場入場"},{id:"e7",time:"15:00",title:"澀谷 Scramble 十字路口",location:"澀谷スクランブル交差点",locationUrl:"",duration:"1 小時",content:""}];
  t1.days[3].schedule=[{id:"e8",time:"10:30",title:"新宿御苑",location:"新宿御苑 東京都新宿區",locationUrl:"",duration:"2 小時",content:""},{id:"e9",time:"14:00",title:"原宿・竹下通",location:"竹下通 東京都渋谷區",locationUrl:"",duration:"1.5 小時",content:""},{id:"e10",time:"19:00",title:"東京鐵塔夜景",location:"東京タワー 港区芝公園",locationUrl:"",duration:"1 小時",content:""}];
  const t2 = { id:"t2", name:"Seoul", subtitle:"首爾感性散步", startDate:"2025-10-21", endDate:"2025-10-23", paletteIdx:7, coverImage:null, currency:"KRW", companions:[], expenses:[], bookmarks:[], flights:[], days:generateDays("2025-10-21","2025-10-23") };
  t2.days[0].schedule=[{id:"s1",time:"11:00",title:"聖水洞 Cafe Tour",location:"首爾聖水洞",duration:"2 小時"},{id:"s2",time:"14:00",title:"韓系文創小店",location:"聖水大林倉庫周邊",duration:"3 小時"}];
  return [t1,t2];
}

// ─────────────────────────────────────────────────────────────
// Shared UI
// ─────────────────────────────────────────────────────────────
function BottomSheet({show,onClose,title,children,maxH="90vh"}){
  if(!show) return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div style={{position:"absolute",inset:0,background:"rgba(20,16,14,.52)",backdropFilter:"blur(6px)"}} onClick={onClose}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"relative",background:CARD_BG,borderRadius:"28px 28px 0 0",padding:"0 22px 44px",maxWidth:430,width:"100%",margin:"0 auto",boxShadow:"0 -20px 60px rgba(0,0,0,.2)",animation:"slideUp .32s cubic-bezier(.34,1.56,.64,1)",maxHeight:maxH,overflowY:"auto"}}>
        <div style={{width:36,height:4,borderRadius:4,background:BORDER,margin:"14px auto 20px"}}/>
        {title&&<div style={{fontFamily:"Georgia,serif",fontSize:17,fontWeight:700,color:TEXT_D,marginBottom:20}}>{title}</div>}
        {children}
      </div>
    </div>
  );
}
function Dialog({show,icon,title,desc,onConfirm,onCancel,confirmLabel="確認",danger=false}){
  if(!show) return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{position:"absolute",inset:0,background:"rgba(20,16,14,.50)",backdropFilter:"blur(6px)"}} onClick={onCancel}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"relative",background:CARD_BG,borderRadius:28,padding:"32px 28px 28px",maxWidth:340,width:"100%",textAlign:"center",boxShadow:"0 24px 60px rgba(0,0,0,.22)",animation:"fadeIn .28s ease"}}>
        {icon&&<div style={{marginBottom:14,display:"flex",justifyContent:"center",color:danger?"#B04A38":"#8A7A6A"}}>{icon}</div>}
        <div style={{fontFamily:"Georgia,serif",fontSize:17,fontWeight:700,color:TEXT_D,marginBottom:8}}>{title}</div>
        {desc&&<div style={{fontSize:13,color:TEXT_M,lineHeight:1.8,marginBottom:24}}>{desc}</div>}
        <div style={{display:"flex",gap:12}}>
          <button onClick={onCancel} style={{flex:1,padding:"13px 0",borderRadius:16,border:`1.5px solid ${BORDER}`,color:TEXT_M,fontSize:14,background:"none",cursor:"pointer",fontFamily:"inherit"}}>取消</button>
          <button onClick={onConfirm} style={{flex:1,padding:"13px 0",borderRadius:16,background:danger?"#B04A38":"#5E6870",color:"#fff",fontSize:14,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit"}}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
function Field({label,value,onChange,placeholder,type="text"}){
  const [f,setF]=useState(false);
  return(
    <div>
      <label style={{fontSize:11,color:TEXT_L,display:"block",marginBottom:5,letterSpacing:"0.07em",textTransform:"uppercase"}}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{width:"100%",padding:"11px 14px",border:`1.5px solid ${f?"#7A8286":BORDER}`,borderRadius:14,background:f?"#fff":APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none",transition:"all .2s"}}/>
    </div>
  );
}
function EditableTitle({value,onChange,outerStyle,inputStyle,placeholder}){
  const [ed,setEd]=useState(false),[dr,setDr]=useState(value),ref=useRef();
  const go=()=>{setDr(value);setEd(true);setTimeout(()=>ref.current?.focus(),0);};
  const ok=()=>{setEd(false);if(dr.trim())onChange(dr.trim());else setDr(value);};
  const kd=e=>{if(e.key==="Enter")ok();if(e.key==="Escape"){setEd(false);setDr(value);}};
  if(ed) return <input ref={ref} value={dr} onChange={e=>setDr(e.target.value)} onBlur={ok} onKeyDown={kd} style={{...inputStyle,fontSize:16,background:"transparent",border:"none",borderBottom:`2px solid #7A8286`,outline:"none",width:"100%",padding:"2px 0"}}/>;
  return <div onClick={go} style={{...outerStyle,cursor:"text"}}>{value||placeholder}</div>;
}
function PalettePicker({value,onChange}){
  return(
    <div>
      <label style={{fontSize:11,color:TEXT_L,display:"block",marginBottom:8,letterSpacing:"0.07em",textTransform:"uppercase"}}>封面主色</label>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {PALETTE.map(p=>(
          <button key={p.id} onClick={()=>onChange(p.id)} style={{width:40,height:40,borderRadius:12,background:p.bg,border:`3px solid ${value===p.id?"rgba(255,255,255,.95)":"transparent"}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",boxShadow:value===p.id?`0 4px 14px ${p.bg}90`:"0 2px 6px rgba(0,0,0,.15)"}}>
            {value===p.id&&<Icon name="check" size={14} color="#fff" sw={2.5}/>}
          </button>
        ))}
      </div>
      <div style={{fontSize:11,color:TEXT_M,marginTop:7,fontStyle:"italic"}}>{PALETTE.find(p=>p.id===value)?.label}</div>
    </div>
  );
}
function CoverImagePicker({value, onChange}){
  // value 可以是 string(URL) 或 {url, posX, posY}
  const url  = typeof value==="object" ? value?.url  : value;
  const posX = typeof value==="object" ? (value?.posX??50) : 50;
  const posY = typeof value==="object" ? (value?.posY??50) : 50;

  const ref = useRef();
  const dragRef = useRef(null);
  const imgRef  = useRef();

  const hf=async e=>{
    const f=e.target.files[0]; if(!f) return;
    try{
      const u=await uploadToCloudinary(f, fbAuth.currentUser?.uid);
      onChange({url:u, posX:50, posY:50});
    } catch{
      const r=new FileReader();
      r.onload=async ev=>onChange({url:await compressImage(ev.target.result,1200,0.8), posX:50, posY:50});
      r.readAsDataURL(f);
    }
  };

  const startDrag = e=>{
    if(!url) return;
    const el=imgRef.current; if(!el) return;
    const rect=el.getBoundingClientRect();
    const clientX=e.touches?e.touches[0].clientX:e.clientX;
    const clientY=e.touches?e.touches[0].clientY:e.clientY;
    dragRef.current={rect, startX:clientX, startY:clientY, posX, posY};
    e.preventDefault();
  };
  const onDrag = e=>{
    if(!dragRef.current) return;
    const clientX=e.touches?e.touches[0].clientX:e.clientX;
    const clientY=e.touches?e.touches[0].clientY:e.clientY;
    const {rect,startX,startY}=dragRef.current;
    const dx=((clientX-startX)/rect.width)*100;
    const dy=((clientY-startY)/rect.height)*100;
    const newX=Math.max(0,Math.min(100, dragRef.current.posX-dx));
    const newY=Math.max(0,Math.min(100, dragRef.current.posY-dy));
    onChange({url, posX:newX, posY:newY});
  };
  const endDrag = ()=>{ dragRef.current=null; };

  return(
    <div>
      <label style={{fontSize:11,color:TEXT_L,display:"block",marginBottom:8,letterSpacing:"0.07em",textTransform:"uppercase"}}>封面圖片（選填）</label>
      <input ref={ref} type="file" accept="image/*" onChange={hf} style={{display:"none"}}/>
      <div style={{borderRadius:16,border:`2px dashed ${BORDER}`,overflow:"hidden",height:url?130:68,display:"flex",alignItems:"center",justifyContent:"center",cursor:url?"grab":"pointer",position:"relative",background:url?"transparent":APP_BG}}
        onClick={url?undefined:()=>ref.current.click()}
        onMouseDown={startDrag} onMouseMove={onDrag} onMouseUp={endDrag} onMouseLeave={endDrag}
        onTouchStart={startDrag} onTouchMove={onDrag} onTouchEnd={endDrag}>
        {url
          ? <img ref={imgRef} src={url} alt="cover" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:`${posX}% ${posY}%`,pointerEvents:"none",userSelect:"none"}}/>
          : <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,color:TEXT_L}}><Icon name="camera" size={22} color={TEXT_L} sw={1.3}/><span style={{fontSize:12}}>點擊上傳封面圖片</span></div>
        }
        {url&&<div style={{position:"absolute",bottom:6,right:8,background:"rgba(0,0,0,.45)",borderRadius:8,padding:"3px 8px",fontSize:10,color:"#fff",pointerEvents:"none"}}>拖曳調整位置</div>}
      </div>
      {url&&<div style={{display:"flex",gap:14,marginTop:6}}>
        <button onClick={()=>ref.current.click()} style={{fontSize:11,color:TEXT_M,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>更換圖片</button>
        <button onClick={()=>onChange(null)} style={{fontSize:11,color:"#B04A38",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>移除圖片</button>
      </div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ① 滾輪時間選擇器（仿 iOS Picker）
// ─────────────────────────────────────────────────────────────
const ITEM_H = 44;
function WheelColumn({items,value,onChange,width=64}){
  const ref=useRef(), isTouch=useRef(false), startY=useRef(0), startScroll=useRef(0);
  useEffect(()=>{
    const idx=items.indexOf(value);
    if(ref.current) ref.current.scrollTop=idx*ITEM_H;
  },[value,items]);
  const onScroll=()=>{
    if(!ref.current) return;
    const idx=Math.round(ref.current.scrollTop/ITEM_H);
    const v=items[Math.max(0,Math.min(idx,items.length-1))];
    if(v!==value) onChange(v);
  };
  return(
    <div style={{position:"relative",width,height:ITEM_H*3,overflow:"hidden",flexShrink:0}}>
      {/* 上下遮罩 */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:ITEM_H,background:`linear-gradient(to bottom,${CARD_BG},${CARD_BG}80)`,zIndex:2,pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:ITEM_H,background:`linear-gradient(to top,${CARD_BG},${CARD_BG}80)`,zIndex:2,pointerEvents:"none"}}/>
      {/* 中央選取線 */}
      <div style={{position:"absolute",top:ITEM_H,left:0,right:0,height:ITEM_H,borderTop:`1.5px solid ${BORDER}`,borderBottom:`1.5px solid ${BORDER}`,zIndex:3,pointerEvents:"none"}}/>
      <div ref={ref} onScroll={onScroll}
        style={{height:"100%",overflowY:"scroll",scrollSnapType:"y mandatory",scrollbarWidth:"none",paddingTop:ITEM_H,paddingBottom:ITEM_H}}>
        {items.map(item=>(
          <div key={item} style={{height:ITEM_H,display:"flex",alignItems:"center",justifyContent:"center",scrollSnapAlign:"center",fontFamily:"Georgia,serif",fontSize:22,fontWeight:item===value?700:400,color:item===value?TEXT_D:TEXT_L,transition:"all .15s",userSelect:"none"}}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
const HOURS   = Array.from({length:24},(_,i)=>String(i).padStart(2,"0"));
const MINUTES = Array.from({length:60},(_,i)=>String(i).padStart(2,"0"));
function TimePicker({value,onChange}){
  const [h,m] = (value||"09:00").split(":").map(v=>v||"00");
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"8px 0"}}>
      <WheelColumn items={HOURS}   value={h} onChange={v=>onChange(`${v}:${m}`)} width={72}/>
      <div style={{fontFamily:"Georgia,serif",fontSize:24,fontWeight:700,color:TEXT_D,marginBottom:2}}>:</div>
      <WheelColumn items={MINUTES} value={m} onChange={v=>onChange(`${h}:${v}`)} width={72}/>
    </div>
  );
}

// ─── 緊湊時間選擇器 ───
// 外觀：與 Field 等寬等高的長方形框
// 互動：預設滾輪，點擊中央時間數字直接切成 input 手動編輯，失焦或 Enter 回到滾輪
const ITEM_H_SM = 36;

function WheelColumnSm({items, value, onChange}){
  const LEN = items.length;
  const [offset, setOffset] = useState(()=> -items.indexOf(value) * ITEM_H_SM);
  const drag = useRef({active:false, startY:0, startOffset:0});
  const containerRef = useRef();
  const offsetRef = useRef(offset);

  useEffect(()=>{ offsetRef.current = offset; },[offset]);

  useEffect(()=>{
    const idx = items.indexOf(value);
    if(idx>=0){ const o = -idx * ITEM_H_SM; setOffset(o); offsetRef.current=o; }
  },[value, items]);

  const clampAndCommit = (raw)=>{
    const total = LEN * ITEM_H_SM;
    let o = ((raw % total) + total) % total;
    if(o > total/2) o -= total;
    const snapped = Math.round(o / ITEM_H_SM) * ITEM_H_SM;
    setOffset(snapped); offsetRef.current=snapped;
    const idx = ((-Math.round(snapped / ITEM_H_SM)) % LEN + LEN) % LEN;
    const v = items[idx];
    if(v && v !== value) onChange(v);
  };

  // passive:false 才能 preventDefault
  useEffect(()=>{
    const el = containerRef.current;
    if(!el) return;
    const onStart = e=>{
      drag.current = {active:true, startY:e.touches[0].clientY, startOffset:offsetRef.current};
    };
    const onMove = e=>{
      if(!drag.current.active) return;
      e.preventDefault(); // 阻止頁面滾動
      const dy = e.touches[0].clientY - drag.current.startY;
      const raw = drag.current.startOffset + dy;
      const total = LEN * ITEM_H_SM;
      let o = ((raw % total) + total) % total;
      if(o > total/2) o -= total;
      setOffset(o); offsetRef.current=o;
    };
    const onEnd = ()=>{
      drag.current.active = false;
      clampAndCommit(offsetRef.current);
    };
    el.addEventListener("touchstart", onStart, {passive:true});
    el.addEventListener("touchmove",  onMove,  {passive:false});
    el.addEventListener("touchend",   onEnd,   {passive:true});
    return ()=>{
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove",  onMove);
      el.removeEventListener("touchend",   onEnd);
    };
  },[items, value]);

  const onMouseDown = e=>{
    drag.current = {active:true, startY:e.clientY, startOffset:offsetRef.current};
    const onMove = e2=>{
      const dy = e2.clientY - drag.current.startY;
      const raw = drag.current.startOffset + dy;
      const total = LEN * ITEM_H_SM;
      let o = ((raw % total) + total) % total;
      if(o > total/2) o -= total;
      setOffset(o); offsetRef.current=o;
    };
    const onUp = ()=>{
      drag.current.active = false;
      clampAndCommit(offsetRef.current);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  return(
    <div ref={containerRef} style={{flex:1,position:"relative",height:ITEM_H_SM*3,overflow:"hidden",cursor:"grab",userSelect:"none",WebkitUserSelect:"none",touchAction:"none"}}
      onMouseDown={onMouseDown}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:ITEM_H_SM,background:`linear-gradient(to bottom,${APP_BG} 50%,transparent)`,zIndex:2,pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:ITEM_H_SM,background:`linear-gradient(to top,${APP_BG} 50%,transparent)`,zIndex:2,pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:ITEM_H_SM,left:4,right:4,height:ITEM_H_SM,borderTop:`1.5px solid ${BORDER}`,borderBottom:`1.5px solid ${BORDER}`,zIndex:3,pointerEvents:"none"}}/>
      <div style={{position:"absolute",inset:0}}>
        {Array.from({length:7},(_,i)=>i-3).map(rel=>{
          const rawIdx = -Math.round(offsetRef.current/ITEM_H_SM) + rel;
          const idx = ((rawIdx % LEN) + LEN) % LEN;
          const y = ITEM_H_SM + rel*ITEM_H_SM + (offset - Math.round(offset/ITEM_H_SM)*ITEM_H_SM);
          const isSel = rel===0;
          return(
            <div key={rel} style={{position:"absolute",left:0,right:0,top:y,height:ITEM_H_SM,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",fontSize:isSel?18:15,fontWeight:isSel?700:400,color:isSel?TEXT_D:TEXT_L,transition:"font-size .1s,color .1s"}}>
              {items[idx]}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompactTimePicker({value, onChange}){
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value || "09:00");
  const inputRef = useRef();

  const parts = (value || "09:00").split(":");
  const h = parts[0] || "09";
  const m = parts[1] || "00";

  const startEdit = ()=>{
    setDraft(value || "09:00");
    setEditing(true);
    setTimeout(()=>{ inputRef.current?.focus(); inputRef.current?.select(); }, 30);
  };
  const commitEdit = ()=>{
    const match = draft.match(/^([01]?\d|2[0-3]):?([0-5]\d)$/);
    if(match){
      const hh = match[1].padStart(2,"0"), mm = match[2].padStart(2,"0");
      onChange(`${hh}:${mm}`);
    }
    setEditing(false);
  };
  const onKey = e => {
    if(e.key==="Enter") commitEdit();
    if(e.key==="Escape"){ setEditing(false); }
  };

  // 共用外框樣式：與 Field 完全相同
  const boxStyle = {
    width:"100%",
    border:`1.5px solid ${editing?"#7A8286":BORDER}`,
    borderRadius:14,
    background:APP_BG,
    overflow:"hidden",
    display:"flex",
    alignItems:"stretch",
    // 滾輪高度 = 3 列，手動輸入高度 = 1 列（44px）
    height: editing ? 44 : ITEM_H_SM*3,
    transition:"height .2s ease",
  };

  if(editing){
    return (
      <div style={boxStyle}>
        <input
          ref={inputRef}
          value={draft}
          onChange={e=>setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={onKey}
          placeholder="09:30"
          style={{
            flex:1, border:"none", outline:"none", background:"transparent",
            fontFamily:"Georgia,serif", fontSize:18, fontWeight:700,
            color:TEXT_D, textAlign:"center", letterSpacing:"0.1em",
            padding:"0 14px",
          }}
        />
      </div>
    );
  }

  return (
    <div style={{...boxStyle, cursor:"pointer"}} onClick={startEdit}>
      <WheelColumnSm items={HOURS}   value={h} onChange={v=>onChange(`${v}:${m}`)}/>
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:"Georgia,serif", fontSize:18, fontWeight:700,
        color:TEXT_D, flexShrink:0, width:16, userSelect:"none",
        paddingBottom:1,
      }}>:</div>
      <WheelColumnSm items={MINUTES} value={m} onChange={v=>onChange(`${h}:${v}`)}/>
    </div>
  );
}
// ─── Cloudinary 圖片上傳 ───
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dq7gjb7wa/image/upload";
const CLOUDINARY_PRESET = "hafnice-traveldale";

async function uploadToCloudinary(file, uid){
  // 檔案驗證
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED = ["image/jpeg","image/png","image/webp","image/heic","image/heif"];
  if(file.size > MAX_SIZE) throw new Error("檔案超過 10MB 限制");
  if(!ALLOWED.includes(file.type)&&!file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i))
    throw new Error("不支援的檔案格式");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  if(uid){
    fd.append("folder", "travel_app/users/"+uid);
    fd.append("context", "uid="+uid);
  }
  const res = await fetch(CLOUDINARY_URL, {method:"POST", body:fd});
  const data = await res.json();
  if(data.secure_url) return data.secure_url;
  throw new Error("Upload failed: "+(data.error?.message||"unknown"));
}


function compressImage(dataUrl, maxW=800, quality=0.75){
  return new Promise(res=>{
    const img=new Image();
    img.onload=()=>{
      const scale=Math.min(1, maxW/Math.max(img.width,img.height));
      const w=Math.round(img.width*scale), h=Math.round(img.height*scale);
      const c=document.createElement("canvas"); c.width=w; c.height=h;
      c.getContext("2d").drawImage(img,0,0,w,h);
      res(c.toDataURL("image/jpeg",quality));
    };
    img.onerror=()=>res(dataUrl);
    img.src=dataUrl;
  });
}
function EventImageUploader({images, onChange}){
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFiles = async e => {
    const files = Array.from(e.target.files);
    if(!files.length) return;
    const remaining = 10 - (images||[]).length;
    const toUpload = files.slice(0, remaining);
    setUploadError(null);

    // 立即顯示本地預覽（樂觀更新）
    const localUrls = await Promise.all(toUpload.map(f=>new Promise(res=>{
      const r=new FileReader(); r.onload=ev=>res(ev.target.result); r.readAsDataURL(f);
    })));
    onChange([...(images||[]), ...localUrls]);
    setUploading(true);

    // 背景上傳 Cloudinary，完成後替換 URL
    try{
      const uid = fbAuth.currentUser?.uid;
      const cloudUrls = await Promise.all(toUpload.map(f=>uploadToCloudinary(f, uid)));
      // 把剛加入的 localUrls 替換成 cloudUrls
      onChange(prev=>{
        const newImgs = [...prev];
        const startIdx = newImgs.length - localUrls.length;
        cloudUrls.forEach((url,i)=>{ newImgs[startIdx+i]=url; });
        return newImgs;
      });
    } catch(err){
      const msg = err?.message||"";
      if(msg.includes("10MB")) setUploadError("檔案超過 10MB，請選擇較小的圖片");
      else if(msg.includes("格式")) setUploadError("不支援此檔案格式");
      else setUploadError("上傳失敗，請稍後再試");
    }
    setUploading(false);
    e.target.value = "";
  };
  const removeImg = idx => onChange((images||[]).filter((_,i)=>i!==idx));
  return (
    <div>
      <input ref={ref} type="file" accept="image/*" multiple onChange={handleFiles} style={{display:"none"}}/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {(images||[]).map((src,i)=>(
          <div key={i} style={{position:"relative",width:72,height:72,borderRadius:12,overflow:"hidden",flexShrink:0}}>
            <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            <button onClick={()=>removeImg(i)}
              style={{position:"absolute",top:3,right:3,width:20,height:20,borderRadius:"50%",background:"rgba(0,0,0,.55)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon name="x" size={10} color="#fff" sw={2.5}/>
            </button>
          </div>
        ))}
        {(images||[]).length < 6 && (
          <button onClick={()=>ref.current.click()}
            style={{width:72,height:72,borderRadius:12,border:`2px dashed ${BORDER}`,background:APP_BG,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,color:TEXT_L,flexShrink:0,transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="#7A8286";e.currentTarget.style.color=TEXT_M;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.color=TEXT_L;}}>
            <Icon name="camera" size={18} color="currentColor" sw={1.4}/>
            <span style={{fontSize:9,fontFamily:"inherit"}}>新增照片</span>
          </button>
        )}
      </div>
      {(images||[]).length > 0 && (
        <div style={{fontSize:10,color:TEXT_L,marginTop:6}}>{(images||[]).length}/10 張 · 點縮圖右上角 ✕ 可移除</div>
      )}
      {uploading&&<div style={{fontSize:11,color:TEXT_L,marginTop:4}}>上傳中…</div>}
      {uploadError&&<div style={{fontSize:11,color:"#B04A38",marginTop:4,display:"flex",alignItems:"center",gap:4}}><Icon name="x" size={11} color="#B04A38" sw={2}/>{uploadError}</div>}
    </div>
  );
}

function SortableList({items,onReorder,renderItem}){
  const [draggingIdx,setDraggingIdx]=useState(null),[overIdx,setOverIdx]=useState(null);
  const isDrag=useRef(false),startY=useRef(0),itemRefs=useRef([]);
  const gripRefs=useRef([]);
  const blockSel=useCallback(e=>{e.preventDefault();},[]);
  const containerRef=useRef(null);

  // 原生 touchmove passive:false — 在拖曳中阻止頁面滾動
  useEffect(()=>{
    const el=containerRef.current;
    if(!el) return;
    const onTM=e=>{ if(isDrag.current) e.preventDefault(); };
    el.addEventListener("touchmove",onTM,{passive:false});
    return()=>el.removeEventListener("touchmove",onTM);
  },[]);

  const startDrag=useCallback((e,idx)=>{
    e.stopPropagation();
    document.addEventListener("selectstart",blockSel);
    window.getSelection?.()?.removeAllRanges();
    isDrag.current=true;
    startY.current=e.clientY??e.touches?.[0]?.clientY;
    setDraggingIdx(idx);
    setOverIdx(idx);
    try{e.currentTarget.setPointerCapture(e.pointerId);}catch(_){}
  },[blockSel]);

  const onPM=useCallback(e=>{
    if(!isDrag.current) return;
    e.preventDefault();
    const clientY=e.clientY??e.touches?.[0]?.clientY;
    let ti=draggingIdx??0;
    itemRefs.current.forEach((el,i)=>{
      if(!el) return;
      const r=el.getBoundingClientRect(),mid=r.top+r.height/2;
      if(clientY>mid) ti=i;
    });
    setOverIdx(Math.max(0,Math.min(ti,items.length-1)));
  },[draggingIdx,items.length]);

  const onPU=useCallback(()=>{
    document.removeEventListener("selectstart",blockSel);
    if(isDrag.current&&draggingIdx!==null&&overIdx!==null&&draggingIdx!==overIdx){
      const next=[...items],[moved]=next.splice(draggingIdx,1);next.splice(overIdx,0,moved);onReorder(next);
    }
    isDrag.current=false;setDraggingIdx(null);setOverIdx(null);
  },[draggingIdx,overIdx,items,onReorder,blockSel]);

  const drag=draggingIdx!==null;
  return(
    <div ref={containerRef} style={{userSelect:"none",WebkitUserSelect:"none"}}>
      {items.map((item,i)=>{
        const isAct=draggingIdx===i;
        const isOver=overIdx===i&&drag&&draggingIdx!==i;
        return(
          <div key={item.id} ref={el=>{itemRefs.current[i]=el;}}
            onPointerMove={drag?onPM:undefined}
            onPointerUp={drag?onPU:undefined}
            onPointerCancel={drag?onPU:undefined}
            style={{
              opacity:isAct?.4:1,
              borderTop:isOver?`2.5px solid #7A8286`:"2.5px solid transparent",
              transition:"opacity .12s,border-top .08s",
              userSelect:"none",WebkitUserSelect:"none",
              touchAction: drag?"none":"auto",
            }}>
            {renderItem(item,i,isAct,
              // 傳入 gripProps 給 renderItem 綁在 grip handle 上
              {
                onPointerDown:(e)=>startDrag(e,i),
                style:{cursor:isAct?"grabbing":"grab",touchAction:"none"},
              }
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── 迷你時間選擇器（36px，與日期欄等高）用於航班表單 ───
function MiniTimePicker({value, onChange}){
  const [open,   setOpen]   = useState(false);
  const [manual, setManual] = useState(false);
  const [draft,  setDraft]  = useState(value||"08:00");
  const inputRef = useRef();

  const parts = (value||"08:00").split(":");
  const h = parts[0]||"08", m = parts[1]||"00";

  const commitManual = () => {
    const match = draft.match(/^([01]?\d|2[0-3]):?([0-5]\d)$/);
    if(match) onChange(`${match[1].padStart(2,"0")}:${match[2].padStart(2,"0")}`);
    setManual(false); setOpen(false);
  };

  // 關閉後重置 manual
  const close = () => { setOpen(false); setManual(false); };

  if(!open){
    return(
      <div style={{display:"flex",gap:4,alignItems:"center"}}>
        <div onClick={()=>setOpen(true)}
          style={{flex:1,height:36,border:`1.5px solid ${BORDER}`,borderRadius:10,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:2,userSelect:"none"}}>
          <span style={{fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,color:TEXT_D}}>{h}</span>
          <span style={{fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,color:TEXT_L}}>:</span>
          <span style={{fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,color:TEXT_D}}>{m}</span>
          <span style={{fontSize:9,color:TEXT_L,marginLeft:3}}>▾</span>
        </div>
      </div>
    );
  }

  if(manual){
    return(
      <div style={{border:`1.5px solid #7A8286`,borderRadius:10,background:"#fff",overflow:"hidden"}}>
        <input ref={inputRef} value={draft} onChange={e=>setDraft(e.target.value)}
          onBlur={commitManual} onKeyDown={e=>{if(e.key==="Enter")commitManual();if(e.key==="Escape")close();}}
          autoFocus placeholder="08:30"
          style={{width:"100%",padding:"7px 10px",border:"none",outline:"none",fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,color:TEXT_D,textAlign:"center",background:"transparent",height:36}}/>
        <button onClick={close} style={{width:"100%",padding:"3px 0",background:BORDER,border:"none",cursor:"pointer",fontSize:10,color:TEXT_M,fontFamily:"inherit"}}>取消</button>
      </div>
    );
  }

  return(
    <div style={{border:`1.5px solid #7A8286`,borderRadius:10,background:"#fff",overflow:"hidden",position:"relative",zIndex:10}}>
      <div style={{display:"flex",alignItems:"center"}}>
        <WheelColumnSm items={HOURS}   value={h} onChange={v=>onChange(`${v}:${m}`)}/>
        <div style={{fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,color:TEXT_D,flexShrink:0,width:12,textAlign:"center",userSelect:"none"}}>:</div>
        <WheelColumnSm items={MINUTES} value={m} onChange={v=>onChange(`${h}:${v}`)}/>
      </div>
      <div style={{display:"flex",borderTop:`1px solid ${BORDER}`}}>
        <button onClick={()=>{setDraft(value||"08:00");setManual(true);setTimeout(()=>inputRef.current?.focus(),30);}}
          style={{flex:1,padding:"4px 0",background:"none",border:"none",borderRight:`1px solid ${BORDER}`,cursor:"pointer",fontSize:10,color:TEXT_M,fontFamily:"inherit"}}>
          ✎ 手動輸入
        </button>
        <button onClick={close}
          style={{flex:1,padding:"4px 0",background:BORDER,border:"none",cursor:"pointer",fontSize:10,color:TEXT_M,fontFamily:"inherit",fontWeight:600}}>
          完成
        </button>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────
const FLIGHT_TYPES = [
  { id:"depart",  label:"去程", icon:"arrow-right"  },
  { id:"return",  label:"回程", icon:"arrow-left"   },
  { id:"transit", label:"轉機", icon:"plane"        },
];

function FlightPanel({ trip, onUpdate, pal, show, onClose }){
  const flights   = trip.flights || [];
  const [showForm,setShowForm]= useState(false);
  const [editItem,setEditItem]= useState(null);
  const [delTarget,setDelTarget]=useState(null);

  // 表單
  const [fType,    setFType]    = useState("depart");
  const [fCode,    setFCode]    = useState("");   // CI838
  const [fFrom,    setFFrom]    = useState("");   // TPE
  const [fTo,      setFTo]      = useState("");   // FCO
  const [fDepDate, setFDepDate] = useState("");
  const [fDepTime, setFDepTime] = useState("");
  const [fArrDate, setFArrDate] = useState("");
  const [fArrTime, setFArrTime] = useState("");
  const [fTerminal,setFTerminal]= useState("");
  const [fSeat,    setFSeat]    = useState("");
  const [fNote,    setFNote]    = useState("");

  const updateTrip = patch => onUpdate({...trip,...patch});

  const openAdd = () => {
    setEditItem(null);
    setFType("depart"); setFCode(""); setFFrom(""); setFTo("");
    setFDepDate(trip.startDate||""); setFDepTime(""); setFArrDate(""); setFArrTime("");
    setFTerminal(""); setFSeat(""); setFNote("");
    setShowForm(true);
  };
  const openEdit = f => {
    setEditItem(f);
    setFType(f.type); setFCode(f.code); setFFrom(f.from); setFTo(f.to);
    setFDepDate(f.depDate); setFDepTime(f.depTime); setFArrDate(f.arrDate); setFArrTime(f.arrTime);
    setFTerminal(f.terminal||""); setFSeat(f.seat||""); setFNote(f.note||"");
    setShowForm(true);
  };
  const saveFlight = () => {
    if(!fCode.trim()||!fFrom.trim()||!fTo.trim()) return;
    const fl = { id:editItem?.id||genId(), type:fType, code:fCode.toUpperCase().trim(), from:fFrom.toUpperCase().trim(), to:fTo.toUpperCase().trim(), depDate:fDepDate, depTime:fDepTime, arrDate:fArrDate, arrTime:fArrTime, terminal:fTerminal.trim(), seat:fSeat.trim(), note:fNote.trim() };
    updateTrip({ flights: editItem ? flights.map(f=>f.id===editItem.id?fl:f) : [...flights,fl] });
    setShowForm(false);
  };
  const delFlight = id => { updateTrip({ flights: flights.filter(f=>f.id!==id) }); setDelTarget(null); };

  const openTrack = f => {
    window.open(`https://www.flightaware.com/live/flight/${encodeURIComponent(f.code)}/${f.from||""}/${f.to||""}`,"_blank");
  };

  // 排序：去程 → 轉機 → 回程
  const ORDER = { depart:0, transit:1, return:2 };
  const sorted = [...flights].sort((a,b)=>(ORDER[a.type]??9)-(ORDER[b.type]??9));

  return (
    <>
      {/* 航班列表 BottomSheet */}
      <BottomSheet show={show&&!showForm} onClose={onClose} title="航班資訊" maxH="90vh">
        <div>
          <button onClick={openAdd}
            style={{width:"100%",marginBottom:14,padding:"12px 0",borderRadius:16,background:pal.bg,color:"#fff",fontSize:13,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
            <Icon name="plus" size={15} color="#fff" sw={2}/> 新增航班
          </button>
          {flights.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:TEXT_L,fontSize:13,fontStyle:"italic"}}>尚無航班，點上方按鈕新增</div>}
          {sorted.map((f,i)=>{
            const ti=FLIGHT_TYPES.find(t=>t.id===f.type)||FLIGHT_TYPES[0];
            return(
              <div key={f.id} style={{borderBottom:i<sorted.length-1?`1px solid ${BORDER}`:"none",paddingBottom:14,marginBottom:i<sorted.length-1?14:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,background:APP_BG,borderRadius:20,padding:"4px 10px",border:`1px solid ${BORDER}`}}>
                    <Icon name={ti.icon} size={13} color={pal.bg} sw={2}/>
                    <span style={{fontSize:11,color:pal.bg,fontWeight:700}}>{ti.label}</span>
                  </div>
                  <span style={{fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,color:TEXT_D}}>{f.code}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",marginBottom:8}}>
                  <div style={{textAlign:"center",flex:"0 0 64px"}}>
                    <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,color:TEXT_D}}>{f.from}</div>
                    <div style={{fontSize:11,color:TEXT_L}}>{f.depDate}</div>
                    <div style={{fontSize:13,fontWeight:700,color:pal.bg}}>{f.depTime}</div>
                  </div>
                  <div style={{flex:1,display:"flex",alignItems:"center",padding:"0 8px"}}>
                    <div style={{height:1,flex:1,background:BORDER}}/>
                    <Icon name="plane" size={16} color={pal.bg} sw={1.5}/>
                    <div style={{height:1,flex:1,background:BORDER}}/>
                  </div>
                  <div style={{textAlign:"center",flex:"0 0 64px"}}>
                    <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,color:TEXT_D}}>{f.to}</div>
                    <div style={{fontSize:11,color:TEXT_L}}>{f.arrDate}</div>
                    <div style={{fontSize:13,fontWeight:700,color:pal.bg}}>{f.arrTime}</div>
                  </div>
                </div>
                {(f.terminal||f.seat||f.note)&&(
                  <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:8}}>
                    {f.terminal&&<span style={{fontSize:11,background:APP_BG,color:TEXT_M,padding:"3px 9px",borderRadius:10,border:`1px solid ${BORDER}`}}>航廈 {f.terminal}</span>}
                    {f.seat&&<span style={{fontSize:11,background:APP_BG,color:TEXT_M,padding:"3px 9px",borderRadius:10,border:`1px solid ${BORDER}`}}>{f.seat}</span>}
                    {f.note&&<span style={{fontSize:11,color:TEXT_M,fontStyle:"italic"}}>{f.note}</span>}
                  </div>
                )}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>window.open(`https://www.flightaware.com/live/flight/${encodeURIComponent(f.code)}/${f.from||""}/${f.to||""}`,"_blank")}
                    style={{flex:1,padding:"8px 0",borderRadius:12,background:pal.bg,color:"#fff",fontSize:11,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                    <Icon name="external-link" size={12} color="#fff" sw={2}/> 即時動態
                  </button>
                  <button onClick={()=>openEdit(f)} style={{width:34,height:34,borderRadius:10,background:APP_BG,border:`1px solid ${BORDER}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Icon name="pencil-sm" size={13} color={TEXT_M} sw={1.8}/>
                  </button>
                  <button onClick={()=>setDelTarget(f.id)} style={{width:34,height:34,borderRadius:10,background:"#F4EDEC",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Icon name="trash" size={13} color="#B04A38"/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </BottomSheet>

      {/* 新增/編輯 Sheet */}
      <BottomSheet show={showForm} onClose={()=>setShowForm(false)} title={editItem?"編輯航班":"新增航班"} maxH="95vh">
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <div style={{display:"flex",gap:6}}>
            {FLIGHT_TYPES.map(t=>{const sel=fType===t.id;return(
              <button key={t.id} onClick={()=>setFType(t.id)}
                style={{flex:1,padding:"7px 4px",borderRadius:20,background:sel?pal.bg:APP_BG,border:`1.5px solid ${sel?pal.bg:BORDER}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all .15s"}}>
                <Icon name={t.icon} size={14} color={sel?"#fff":TEXT_M} sw={1.6}/>
                <span style={{fontSize:11,color:sel?"#fff":TEXT_M,fontFamily:"inherit",fontWeight:sel?600:400}}>{t.label}</span>
              </button>
            );})}
          </div>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:"0 0 30%"}}><label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:4,textTransform:"uppercase"}}>航班號 *</label><input value={fCode} onChange={e=>setFCode(e.target.value)} placeholder="CI838" style={{width:"100%",padding:"9px 10px",border:`1.5px solid ${BORDER}`,borderRadius:12,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none"}}/></div>
            <div style={{flex:1}}><label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:4,textTransform:"uppercase"}}>出發 *</label><input value={fFrom} onChange={e=>setFFrom(e.target.value)} placeholder="TPE" style={{width:"100%",padding:"9px 10px",border:`1.5px solid ${BORDER}`,borderRadius:12,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none",textTransform:"uppercase"}}/></div>
            <div style={{flex:1}}><label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:4,textTransform:"uppercase"}}>抵達 *</label><input value={fTo} onChange={e=>setFTo(e.target.value)} placeholder="FCO" style={{width:"100%",padding:"9px 10px",border:`1.5px solid ${BORDER}`,borderRadius:12,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none",textTransform:"uppercase"}}/></div>
          </div>
          <div style={{background:APP_BG,borderRadius:14,padding:"10px 12px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px 12px"}}>
            <div><label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:3}}>✈ 出發日期</label><input type="date" value={fDepDate} onChange={e=>setFDepDate(e.target.value)} style={{width:"100%",padding:"7px 10px",border:`1.5px solid ${BORDER}`,borderRadius:10,background:"#fff",fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none",height:36}}/></div>
            <div><label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:3}}>出發時間</label><MiniTimePicker value={fDepTime||"08:00"} onChange={setFDepTime}/></div>
            <div><label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:3}}>🛬 抵達日期</label><input type="date" value={fArrDate} onChange={e=>setFArrDate(e.target.value)} style={{width:"100%",padding:"7px 10px",border:`1.5px solid ${BORDER}`,borderRadius:10,background:"#fff",fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none",height:36}}/></div>
            <div><label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:3}}>抵達時間</label><MiniTimePicker value={fArrTime||"14:00"} onChange={setFArrTime}/></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1}}><label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:4,textTransform:"uppercase"}}>航廈</label><input value={fTerminal} onChange={e=>setFTerminal(e.target.value)} placeholder="T2" style={{width:"100%",padding:"9px 10px",border:`1.5px solid ${BORDER}`,borderRadius:12,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none"}}/></div>
            <div style={{flex:2}}><label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:4,textTransform:"uppercase"}}>備註</label><input value={fSeat} onChange={e=>setFSeat(e.target.value)} placeholder="座位 32A、行李額度 23kg…" style={{width:"100%",padding:"9px 10px",border:`1.5px solid ${BORDER}`,borderRadius:12,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none"}}/></div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:2}}>
            <button onClick={()=>setShowForm(false)} style={{flex:1,padding:"12px 0",borderRadius:16,border:`1.5px solid ${BORDER}`,color:TEXT_M,fontSize:14,background:"none",cursor:"pointer",fontFamily:"inherit"}}>取消</button>
            <button onClick={saveFlight} style={{flex:1,padding:"12px 0",borderRadius:16,background:pal.bg,color:"#fff",fontSize:14,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit"}}>{editItem?"儲存修改":"加入航班"}</button>
          </div>
        </div>
      </BottomSheet>
      <Dialog show={!!delTarget} icon={<Icon name="plane" size={28}/>} title="刪除這筆航班？" desc="刪除後將無法復原。" onConfirm={()=>delFlight(delTarget)} onCancel={()=>setDelTarget(null)} confirmLabel="確認刪除" danger/>
    </>
  );

}

// ─────────────────────────────────────────────────────────────
// 景點收藏頁
// ─────────────────────────────────────────────────────────────
const SPOT_CATS = [
  { id:"restaurant", label:"餐廳"   },
  { id:"cafe",       label:"咖啡廳" },
  { id:"shop",       label:"購物"   },
  { id:"scenery",    label:"景點"   },
  { id:"convenience",label:"超商"    },
  { id:"souvenir",   label:"伴手禮" },
  { id:"beauty",     label:"美容"   },
  { id:"drugstore",  label:"藥妝"   },
];

const SPOT_ICON_MAP = {
  restaurant:"food", cafe:"snack", shop:"shop", scenery:"scenery",
  convenience:"convenience", souvenir:"souvenir", beauty:"beauty", drugstore:"drugstore"
};

function SpotCatIcon({ id, size=22, color="currentColor" }){
  const s={width:size,height:size};
  const sw=1.6, sc="round";
  if(id==="convenience") return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap={sc} strokeLinejoin={sc}><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2M3 11h18"/><path d="M8 15h2M14 15h2"/></svg>;
  if(id==="souvenir")    return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap={sc} strokeLinejoin={sc}><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>;
  if(id==="beauty")      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap={sc} strokeLinejoin={sc}><path d="M9 2h6l1 5H8L9 2z"/><rect x="6" y="7" width="12" height="14" rx="2"/><path d="M10 11h4M10 14h4"/></svg>;
  if(id==="drugstore")   return <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap={sc} strokeLinejoin={sc}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/></svg>;
  return <CatIcon id={SPOT_ICON_MAP[id]||"other"} size={size} color={color}/>;
}

function BookmarkTab({ trip, onUpdate, bookmarks=[], onUpdateBookmarks }){
  const pal        = PALETTE[trip.paletteIdx??0];
  const [selCat,   setSelCat]   = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [delTarget,setDelTarget]= useState(null);
  const [fName,   setFName]   = useState("");
  const [fCat,    setFCat]    = useState("restaurant");
  const [fAddr,   setFAddr]   = useState("");
  const [fNote,   setFNote]   = useState("");
  const [fImages, setFImages] = useState([]);
  const imgRef = useRef();

  const openAdd = () => { setEditItem(null); setFName(""); setFCat("restaurant"); setFAddr(""); setFNote(""); setFImages([]); setShowForm(true); };
  const openEdit = item => { setEditItem(item); setFName(item.name); setFCat(item.cat); setFAddr(item.addr||""); setFNote(item.note||""); setFImages(item.images||[]); setShowForm(true); };
  const saveSpot = () => {
    if(!fName.trim()) return;
    const spot = { id:editItem?.id||genId(), name:fName.trim(), cat:fCat, addr:fAddr.trim(), note:fNote.trim(), images:fImages };
    onUpdateBookmarks(editItem ? bookmarks.map(b=>b.id===editItem.id?spot:b) : [...bookmarks,spot]);
    setShowForm(false);
  };
  const delSpot = id => { onUpdateBookmarks(bookmarks.filter(b=>b.id!==id)); setDelTarget(null); };
  const [imgUploadError, setImgUploadError] = useState(null);
  const handleImgFiles = async e => {
    const files=Array.from(e.target.files), rem=10-fImages.length, toUpload=files.slice(0,rem);
    setImgUploadError(null);
    // 立即顯示本地預覽
    const localUrls = await Promise.all(toUpload.map(f=>new Promise(res=>{
      const r=new FileReader(); r.onload=ev=>res(ev.target.result); r.readAsDataURL(f);
    })));
    setFImages(p=>[...p,...localUrls]);
    // 背景上傳後替換
    try{
      const uid = fbAuth.currentUser?.uid;
      const cloudUrls = await Promise.all(toUpload.map(f=>uploadToCloudinary(f, uid)));
      setFImages(p=>{
        const n=[...p];
        const start=n.length-localUrls.length;
        cloudUrls.forEach((url,i)=>{ n[start+i]=url; });
        return n;
      });
    } catch(err){
      const msg=err?.message||"";
      if(msg.includes("10MB")) setImgUploadError("檔案超過 10MB");
      else if(msg.includes("格式")) setImgUploadError("不支援此檔案格式");
      else setImgUploadError("上傳失敗，請稍後再試");
    }
    e.target.value="";
  };
  const openMaps = item => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.addr||item.name)}`,"_blank");
  };
  const filtered  = selCat==="all" ? bookmarks : bookmarks.filter(b=>b.cat===selCat);
  const catCount  = id => bookmarks.filter(b=>b.cat===id).length;

  const [detailItem,   setDetailItem]   = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  // 依地址關鍵字分區
  const getRegion = addr => {
    if(!addr) return "未分類";
    const m = addr.match(/[\u4e00-\u9fff]{2,4}[區市町村]/);
    if(m) return m[0];
    const m2 = addr.match(/[A-Z][a-z]+ ?[A-Z]?[a-z]*/);
    if(m2) return m2[0];
    return addr.slice(0,6)||"未分類";
  };
  const byRegion = (() => {
    const map = {};
    filtered.forEach(item=>{
      const r = getRegion(item.addr);
      if(!map[r]) map[r]=[];
      map[r].push(item);
    });
    return Object.entries(map).sort(([a],[b])=>a.localeCompare(b,"zh"));
  })();

  return(
    <div style={{padding:"16px 0 24px"}}>
      {/* 分類 Tab — 兩排橫向捲動 */}
      {(()=>{
        const allCats=[{id:"all",label:"全部 ("+bookmarks.length+")"},...SPOT_CATS.map(c=>({...c,label:c.label+" ("+catCount(c.id)+")"}))];
        return(
          <div style={{paddingLeft:16,paddingRight:16,marginBottom:10}}>
            {[0,1].map(row=>(
              <div key={row} style={{display:"flex",gap:5,overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",paddingBottom:5}}>
                {allCats.filter((_,i)=>row===0?i%2===0:i%2===1).map(c=>(
                  <button key={c.id} onClick={()=>setSelCat(c.id)}
                    style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:20,border:"1.5px solid "+(selCat===c.id?pal.bg:BORDER),background:selCat===c.id?pal.bg:CARD_BG,color:selCat===c.id?pal.fg:TEXT_M,fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",flexShrink:0,whiteSpace:"nowrap"}}>
                    {c.id!=="all"&&<SpotCatIcon id={c.id} size={11} color={selCat===c.id?pal.fg:TEXT_M}/>}
                    {c.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        );
      })()}

      {/* 新增按鈕 */}
      <div style={{padding:"0 16px",marginBottom:14}}>
        <button onClick={openAdd}
          style={{width:"100%",padding:"12px 0",borderRadius:16,background:pal.bg,color:pal.fg,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:7,boxShadow:`0 4px 14px ${pal.bg}40`}}>
          <Icon name="plus" size={15} color={pal.fg} sw={2}/> 新增口袋名單
        </button>
      </div>

      {/* 格狀 / 地區 切換 */}
      <div style={{padding:"0 16px",marginBottom:12}}>
        <div style={{display:"inline-flex",background:APP_BG,borderRadius:12,padding:3,border:`1px solid ${BORDER}`,gap:2}}>
          {[{id:"grid",label:"格狀"},{id:"region",label:"地區"}].map(m=>{
            const sel=viewMode===m.id;
            return <button key={m.id} onClick={()=>setViewMode(m.id)}
              style={{padding:"5px 14px",borderRadius:9,background:sel?pal.bg:"transparent",color:sel?pal.fg:TEXT_M,fontSize:11,border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:sel?600:400,transition:"all .15s"}}>
              {m.label}
            </button>;
          })}
        </div>
      </div>

      {/* 地區模式 */}
      {viewMode==="region"&&filtered.length>0&&(
        <div style={{padding:"0 16px"}}>
          {byRegion.map(([region,items])=>(
            <div key={region} style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
                <div style={{width:4,height:16,background:pal.bg,borderRadius:2}}/>
                <span style={{fontSize:12,fontWeight:700,color:TEXT_D}}>{region}</span>
                <span style={{fontSize:10,color:TEXT_L}}>({items.length})</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {items.map(item=>{
                  const catInfo=SPOT_CATS.find(c=>c.id===item.cat)||SPOT_CATS[0];
                  const thumb=item.images&&item.images.length>0?item.images[0]:null;
                  return(
                    <div key={item.id} onClick={()=>setDetailItem(item)}
                      style={{display:"flex",alignItems:"center",gap:10,background:CARD_BG,borderRadius:14,padding:"10px 12px",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
                      <div style={{width:44,height:44,borderRadius:10,overflow:"hidden",flexShrink:0,background:`${pal.bg}20`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {thumb?<img src={thumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<SpotCatIcon id={item.cat} size={20} color={pal.bg}/>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:TEXT_D,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                        <div style={{fontSize:10,color:TEXT_L,marginTop:2,display:"flex",alignItems:"center",gap:4}}>
                          <SpotCatIcon id={item.cat} size={10} color={TEXT_L}/>{catInfo.label}
                          {item.addr&&<span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>· {item.addr}</span>}
                        </div>
                      </div>
                      <Icon name="chevron-right" size={14} color={BORDER}/>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 空狀態 — 只在 grid 模式且無景點時顯示 */}
      {viewMode==="grid"&&filtered.length===0&&(
        <div style={{textAlign:"center",padding:"48px 0"}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Icon name="bookmark" size={36} color={BORDER} sw={1}/></div>
          <div style={{fontSize:13,color:TEXT_L,fontStyle:"italic"}}>{selCat==="all"?"尚無收藏景點":`尚無${SPOT_CATS.find(c=>c.id===selCat)?.label}景點`}</div>
          <div style={{fontSize:11,color:TEXT_L,marginTop:5,opacity:.7}}>點擊上方按鈕加入口袋名單</div>
        </div>
      )}

      {/* 4×N 格狀（僅格狀模式）*/}
      {viewMode==="grid"&&filtered.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:2}}>
          {filtered.map(item=>(
            <div key={item.id} onClick={()=>setDetailItem(item)}
              style={{position:"relative",aspectRatio:"1",overflow:"hidden",cursor:"pointer",background:APP_BG}}>
              {(item.images&&item.images.length>0)
                ? <img src={item.images[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <div style={{width:"100%",height:"100%",background:pal.bg+"20",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
                    <SpotCatIcon id={item.cat} size={18} color={pal.bg}/>
                    <div style={{fontSize:8,color:pal.bg,opacity:.7,letterSpacing:"0.04em"}}>
                      {(SPOT_CATS.find(c=>c.id===item.cat)||SPOT_CATS[0]).label.toUpperCase()}
                    </div>
                  </div>
              }
              <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(to top,rgba(0,0,0,.65) 0%,transparent 100%)",padding:"14px 4px 4px"}}>
                <div style={{fontSize:9,color:"#fff",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.3}}>{item.name}</div>
                <div style={{fontSize:8,color:"rgba(255,255,255,.75)"}}>{(SPOT_CATS.find(c=>c.id===item.cat)||SPOT_CATS[0]).label}</div>
              </div>
              {item.images&&item.images.length>1&&(
                <div style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,.5)",borderRadius:6,padding:"2px 5px",display:"flex",alignItems:"center",gap:3}}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="2" y="7" width="15" height="15" rx="2"/><path d="M22 2H7a2 2 0 00-2 2v1"/></svg>
                  <span style={{fontSize:9,color:"#fff"}}>{item.images.length}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 詳細頁 — 點格子後從底部滑入 */}
      <BottomSheet show={!!detailItem} onClose={()=>setDetailItem(null)} title="" maxH="92vh">
        {detailItem&&(()=>{
          const item=detailItem;
          const catInfo=SPOT_CATS.find(c=>c.id===item.cat)||SPOT_CATS[0];
          return(
            <div>
              {/* 滑動照片 */}
              {item.images&&item.images.length>0&&(
                <div style={{position:"relative",borderRadius:16,overflow:"hidden",height:220,marginBottom:14}}>
                  <HorizontalScroll height="100%">
                    {item.images.map((src,i)=>(
                      <div key={i} style={{flexShrink:0,width:"100%",height:"100%",scrollSnapAlign:"start"}}>
                        <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      </div>
                    ))}
                  </HorizontalScroll>
                  {item.images.length>1&&(
                    <div style={{position:"absolute",bottom:8,left:0,right:0,display:"flex",justifyContent:"center",gap:4}}>
                      {item.images.map((_,i)=>(
                        <div key={i} style={{width:5,height:5,borderRadius:"50%",background:"rgba(255,255,255,.8)"}}/>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* 分類標籤 + 名稱 */}
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
                <div style={{display:"flex",alignItems:"center",gap:4,background:APP_BG,border:`1px solid ${BORDER}`,borderRadius:20,padding:"3px 9px"}}>
                  <SpotCatIcon id={item.cat} size={12} color={pal.bg}/>
                  <span style={{fontSize:10,color:pal.bg,fontWeight:600}}>{catInfo.label}</span>
                </div>
              </div>
              <div style={{fontFamily:"Georgia,serif",fontSize:17,fontWeight:700,color:TEXT_D,marginBottom:8}}>{item.name}</div>
              {/* 地址 */}
              {item.addr&&(
                <div onClick={()=>openMaps(item)} style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:10,cursor:"pointer"}}>
                  <Icon name="location" size={13} color={pal.bg} sw={1.5}/>
                  <span style={{fontSize:13,color:pal.bg,textDecoration:"underline",textDecorationStyle:"dotted",textUnderlineOffset:"2px",lineHeight:1.5}}>{item.addr}</span>
                </div>
              )}
              {/* 介紹 */}
              {item.note&&(
                <div style={{fontSize:13,color:TEXT_M,lineHeight:1.8,marginBottom:14,padding:"10px 12px",background:APP_BG,borderRadius:12,borderLeft:`3px solid ${pal.bg}50`,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{item.note}</div>
              )}
              {/* 操作 */}
              <div style={{display:"flex",gap:10,marginTop:6}}>
                <button onClick={()=>openMaps(item)}
                  style={{flex:1,padding:"11px 0",borderRadius:14,background:pal.bg,color:pal.fg,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <Icon name="map" size={14} color={pal.fg} sw={1.8}/> 查看地圖
                </button>
                <button onClick={()=>{setDetailItem(null);openEdit(item);}}
                  style={{width:42,height:42,borderRadius:12,background:APP_BG,border:`1px solid ${BORDER}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Icon name="pencil-sm" size={15} color={TEXT_M} sw={1.8}/>
                </button>
                <button onClick={()=>{setDetailItem(null);setDelTarget(item.id);}}
                  style={{width:42,height:42,borderRadius:12,background:"#F4EDEC",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Icon name="trash" size={15} color="#B04A38"/>
                </button>
              </div>
            </div>
          );
        })()}
      </BottomSheet>

      {/* 新增 / 編輯 Sheet */}
      <BottomSheet show={showForm} onClose={()=>setShowForm(false)} title={editItem?"編輯景點":"新增口袋名單"} maxH="95vh">
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Field label="景點名稱 *" value={fName} onChange={setFName} placeholder="例如：聖水洞咖啡街"/>
          {/* 分類 */}
          <div>
            <label style={{fontSize:11,color:TEXT_L,display:"block",marginBottom:6,letterSpacing:"0.07em",textTransform:"uppercase"}}>分類</label>
            {[0,1].map(row=>(
              <div key={row} style={{display:"flex",gap:5,marginBottom:row===0?5:0}}>
                {SPOT_CATS.filter((_,i)=>row===0?i<4:i>=4).map(c=>{
                  const sel=fCat===c.id;
                  return(
                    <button key={c.id} onClick={()=>setFCat(c.id)}
                      style={{flex:1,padding:"7px 2px",borderRadius:12,background:sel?pal.bg:APP_BG,border:"1.5px solid "+(sel?pal.bg:BORDER),cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .15s"}}>
                      <SpotCatIcon id={c.id} size={16} color={sel?pal.fg:TEXT_M}/>
                      <span style={{fontSize:9,color:sel?pal.fg:TEXT_M,fontFamily:"inherit",whiteSpace:"nowrap"}}>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          {/* 地址 — fontSize:16 防 iOS 縮放 */}
          <div>
            <label style={{fontSize:11,color:TEXT_L,display:"block",marginBottom:5,letterSpacing:"0.07em",textTransform:"uppercase"}}>地址</label>
            <div style={{position:"relative"}}>
              <input value={fAddr} onChange={e=>setFAddr(e.target.value)} placeholder="首爾市城東區聖水洞2街 44"
                style={{width:"100%",padding:`11px ${fAddr?"40px":"14px"} 11px 14px`,border:`1.5px solid ${BORDER}`,borderRadius:14,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none"}}/>
              {fAddr&&(
                <button onClick={()=>window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fAddr)}`,"_blank")}
                  style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",width:26,height:26,borderRadius:8,background:pal.bg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Icon name="external-link" size={12} color="#fff"/>
                </button>
              )}
            </div>
          </div>
          {/* 介紹 */}
          <div>
            <label style={{fontSize:11,color:TEXT_L,display:"block",marginBottom:5,letterSpacing:"0.07em",textTransform:"uppercase"}}>景點介紹（選填）</label>
            <textarea value={fNote} onChange={e=>setFNote(e.target.value)} placeholder="推薦原因、特色料理、開放時間、注意事項…"
              rows={3} style={{width:"100%",padding:"11px 14px",border:`1.5px solid ${BORDER}`,borderRadius:14,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none",resize:"none",lineHeight:1.6}}/>
          </div>
          {/* 照片 + 預設插畫 */}
          <div>
            <label style={{fontSize:11,color:TEXT_L,display:"block",marginBottom:8,letterSpacing:"0.07em",textTransform:"uppercase"}}>照片（最多 6 張）</label>
            <input ref={imgRef} type="file" accept="image/*" multiple onChange={handleImgFiles} style={{display:"none"}}/>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {/* 上傳按鈕永遠在第一位 */}
              {fImages.length<6&&(
                <button onClick={()=>imgRef.current.click()}
                  style={{width:58,height:58,borderRadius:12,border:`2px dashed ${BORDER}`,background:APP_BG,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,color:TEXT_L,flexShrink:0}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=pal.bg;e.currentTarget.style.color=pal.bg;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.color=TEXT_L;}}>
                  <Icon name="camera" size={16} color="currentColor" sw={1.4}/>
                  <span style={{fontSize:8,fontFamily:"inherit"}}>新增</span>
                </button>
              )}
              {/* 已上傳照片 */}
              {fImages.map((src,i)=>(
                <div key={i} style={{position:"relative",width:58,height:58,borderRadius:12,overflow:"hidden",flexShrink:0}}>
                  <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  <button onClick={()=>setFImages(p=>p.filter((_,j)=>j!==i))} style={{position:"absolute",top:2,right:2,width:18,height:18,borderRadius:"50%",background:"rgba(0,0,0,.55)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Icon name="x" size={9} color="#fff" sw={2.5}/>
                  </button>
                </div>
              ))}
              {/* 預設插畫（無照片時才顯示）*/}
              {fImages.length===0&&[
                `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="116" height="116" viewBox="0 0 116 116"><rect width="116" height="116" fill="#F2D4C8"/><circle cx="58" cy="50" r="22" fill="none" stroke="#C4886A" stroke-width="2.5"/><path d="M42 50 Q58 36 74 50" fill="none" stroke="#C4886A" stroke-width="2" stroke-linecap="round"/><rect x="48" y="72" width="20" height="3" rx="1.5" fill="#C4886A"/><path d="M76 44 Q83 44 83 51 Q83 58 76 58" fill="none" stroke="#C4886A" stroke-width="2"/><text x="58" y="100" text-anchor="middle" font-size="9" fill="#C4886A" font-family="Georgia,serif" letter-spacing="1">CAFÉ</text></svg>`)}`,
                `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="116" height="116" viewBox="0 0 116 116"><rect width="116" height="116" fill="#C8DDD4"/><path d="M16 82 L42 42 L68 82Z" fill="none" stroke="#5A8A76" stroke-width="2.5" stroke-linejoin="round"/><path d="M48 82 L72 38 L96 82Z" fill="none" stroke="#5A8A76" stroke-width="2.5" stroke-linejoin="round"/><circle cx="77" cy="30" r="7" fill="none" stroke="#5A8A76" stroke-width="2"/><text x="58" y="100" text-anchor="middle" font-size="9" fill="#5A8A76" font-family="Georgia,serif" letter-spacing="1">TRAVEL</text></svg>`)}`,
                `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="116" height="116" viewBox="0 0 116 116"><rect width="116" height="116" fill="#C8D4E0"/><rect x="34" y="44" width="48" height="38" fill="none" stroke="#5A6E8A" stroke-width="2.5"/><rect x="46" y="30" width="24" height="14" fill="none" stroke="#5A6E8A" stroke-width="2"/><rect x="50" y="56" width="8" height="10" fill="none" stroke="#5A6E8A" stroke-width="1.5"/><rect x="64" y="56" width="8" height="10" fill="none" stroke="#5A6E8A" stroke-width="1.5"/><text x="58" y="100" text-anchor="middle" font-size="9" fill="#5A6E8A" font-family="Georgia,serif" letter-spacing="1">PLACE</text></svg>`)}`,
                `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="116" height="116" viewBox="0 0 116 116"><rect width="116" height="116" fill="#E8DDD0"/><path d="M38 54 L43 38 L73 38 L78 54 L78 80 Q78 84 74 84 L42 84 Q38 84 38 80Z" fill="none" stroke="#8A6A4A" stroke-width="2.5" stroke-linejoin="round"/><path d="M50 44 Q50 34 58 34 Q66 34 66 44" fill="none" stroke="#8A6A4A" stroke-width="2.5"/><text x="58" y="100" text-anchor="middle" font-size="9" fill="#8A6A4A" font-family="Georgia,serif" letter-spacing="1">SHOP</text></svg>`)}`,
              ].map((src,i)=>(
                <div key={`preset-${i}`} onClick={()=>setFImages([src])}
                  style={{width:58,height:58,borderRadius:12,overflow:"hidden",cursor:"pointer",flexShrink:0,border:`2px solid transparent`,transition:"border-color .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=pal.bg}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}>
                  <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                </div>
              ))}
            </div>
            {fImages.length>0&&<div style={{fontSize:10,color:TEXT_L,marginTop:5}}>{fImages.length}/10 張</div>}
            {imgUploadError&&<div style={{fontSize:11,color:"#B04A38",marginTop:4,display:"flex",alignItems:"center",gap:4}}><Icon name="x" size={11} color="#B04A38" sw={2}/>{imgUploadError}</div>}
          </div>
          <div style={{display:"flex",gap:12,marginTop:6}}>
            <button onClick={()=>setShowForm(false)} style={{flex:1,padding:"13px 0",borderRadius:16,border:`1.5px solid ${BORDER}`,color:TEXT_M,fontSize:14,background:"none",cursor:"pointer",fontFamily:"inherit"}}>取消</button>
            <button onClick={saveSpot} style={{flex:1,padding:"13px 0",borderRadius:16,background:pal.bg,color:pal.fg,fontSize:14,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit"}}>
              {editItem?"儲存修改":"加入收藏"}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* 刪除確認 */}
      <Dialog show={!!delTarget} icon={<Icon name="trash" size={28}/>} title="移除這個景點？"
        desc="從口袋名單移除後將無法復原。"
        onConfirm={()=>delSpot(delTarget)} onCancel={()=>setDelTarget(null)} confirmLabel="確認移除" danger/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// 清單分頁 — 航班 / 打包清單 / 緊急資訊 / 翻譯
// ─────────────────────────────────────────────────────────────

const CHECKLIST_CATS = [
  { id:"docs",        label:"證件",   items:["外幣","護照","機票","簽證","國際駕照","旅平險","住宿訂單"] },
  { id:"clothes",     label:"衣物",   items:["外套","換洗衣物","內衣褲","睡衣","鞋子","帽子","飾品"] },
  { id:"beauty",      label:"美容",   items:["洗沐用品","保養品","化妝品","美髮用品"] },
  { id:"electronics", label:"電子",   items:["手機","充電器/插頭轉換","行動電源","相機","耳機"] },
  { id:"medical",     label:"醫藥",   items:["常備藥","止痛藥","腸胃藥","OK繃","防蚊液"] },
];

// ─── 左滑刪除 / 右滑取消（無內建 Dialog，由外部處理確認）───
function SwipeDelete({children, onDelete}){
  const wrapRef    = useRef(null);
  const contentRef = useRef(null);
  const [open, setOpen] = useState(false);
  const BW = 72;

  useEffect(()=>{
    const el = contentRef.current;
    if(!el) return;
    let sx=0, sy=0, dx=0, decided=false, active=false;
    const move = e=>{
      if(!active) return;
      const cx=e.touches[0].clientX, cy=e.touches[0].clientY;
      if(!decided){
        if(Math.abs(cx-sx)<4&&Math.abs(cy-sy)<4) return;
        decided=true;
        if(Math.abs(cx-sx)<Math.abs(cy-sy)){active=false;return;}
      }
      e.preventDefault();
      dx=cx-sx;
      const cur=open?Math.min(0,Math.max(-BW,-BW+dx)):Math.min(0,Math.max(-BW,dx));
      el.style.transform=`translateX(${cur}px)`;
    };
    const start=e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;dx=0;decided=false;active=true;};
    const end=()=>{
      if(!active){active=false;return;}
      active=false;
      const cur=open?-BW+dx:dx;
      if(cur<-BW/2){el.style.transform=`translateX(-${BW}px)`;el.style.transition="transform .2s";setOpen(true);}
      else{el.style.transform="translateX(0px)";el.style.transition="transform .2s";setOpen(false);}
      setTimeout(()=>{if(el)el.style.transition="";},210);
    };
    el.addEventListener("touchstart",start,{passive:true});
    el.addEventListener("touchmove",move,{passive:false});
    el.addEventListener("touchend",end,{passive:true});
    return()=>{el.removeEventListener("touchstart",start);el.removeEventListener("touchmove",move);el.removeEventListener("touchend",end);};
  },[open]);

  const handleDelClick=e=>{
    e.stopPropagation();
    setOpen(false);
    if(contentRef.current){contentRef.current.style.transform="translateX(0px)";}
    onDelete();
  };

  return(
    <div ref={wrapRef} style={{position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:BW,background:"#B04A38",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}
        onClick={handleDelClick}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
          <Icon name="trash" size={16} color="#fff"/>
          <span style={{fontSize:9,color:"rgba(255,255,255,.85)",fontFamily:"inherit"}}>刪除</span>
        </div>
      </div>
      <div ref={contentRef} style={{position:"relative",zIndex:1,background:CARD_BG}}>
        {children}
      </div>
    </div>
  );
}

// ─── 即時天氣 ───
function WeatherCard({trip, pal}){
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState(null);

  const CITY_COORDS = {
    "Tokyo":{"lat":35.6762,"lon":139.6503},
    "東京":{"lat":35.6762,"lon":139.6503},
    "Seoul":{"lat":37.5665,"lon":126.9780},
    "首爾":{"lat":37.5665,"lon":126.9780},
    "Osaka":{"lat":34.6937,"lon":135.5023},
    "大阪":{"lat":34.6937,"lon":135.5023},
    "Taipei":{"lat":25.0330,"lon":121.5654},
    "台北":{"lat":25.0330,"lon":121.5654},
    "Bangkok":{"lat":13.7563,"lon":100.5018},
    "曼谷":{"lat":13.7563,"lon":100.5018},
    "Singapore":{"lat":1.3521,"lon":103.8198},
    "新加坡":{"lat":1.3521,"lon":103.8198},
    "Paris":{"lat":48.8566,"lon":2.3522},
    "London":{"lat":51.5074,"lon":-0.1278},
    "Italia":{"lat":41.9028,"lon":12.4964},
    "Rome":{"lat":41.9028,"lon":12.4964},
    "New York":{"lat":40.7128,"lon":-74.0060},
  };

  const WMO = {0:"晴天",1:"晴時多雲",2:"多雲",3:"陰天",45:"霧",48:"霧",51:"細雨",53:"小雨",55:"中雨",61:"小雨",63:"中雨",65:"大雨",71:"小雪",73:"中雪",75:"大雪",80:"短暫陣雨",81:"陣雨",82:"強陣雨",95:"雷雨",96:"雷雨",99:"強雷雨"};
  const WMO_ICON = {0:"☀️",1:"🌤",2:"⛅️",3:"☁️",45:"🌫",48:"🌫",51:"🌦",53:"🌧",55:"🌧",61:"🌦",63:"🌧",65:"🌧",71:"🌨",73:"❄️",75:"❄️",80:"🌦",81:"🌧",82:"⛈",95:"⛈",96:"⛈",99:"⛈"};

  useEffect(()=>{
    const name = trip.name;
    const coords = CITY_COORDS[name];
    if(!coords){setErr("查無此城市天氣");return;}
    setLoading(true);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m&timezone=auto&forecast_days=1`)
      .then(r=>r.json())
      .then(d=>{
        const c=d.current;
        setWeather({
          temp:Math.round(c.temperature_2m),
          feels:Math.round(c.apparent_temperature),
          code:c.weathercode,
          humidity:c.relativehumidity_2m,
          wind:Math.round(c.windspeed_10m),
        });
      })
      .catch(()=>setErr("無法取得天氣"))
      .finally(()=>setLoading(false));
  },[trip.name]);

  if(!weather&&!loading&&!err) return null;

  return(
    <div style={{background:CARD_BG,borderRadius:20,padding:"14px 18px",marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:pal.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </div>
          <span style={{fontSize:13,fontWeight:600,color:TEXT_D}}>即時天氣</span>
          <span style={{fontSize:11,color:TEXT_L}}>{trip.name}</span>
        </div>
      </div>
      {loading&&<div style={{fontSize:12,color:TEXT_L,marginTop:10}}>取得天氣中…</div>}
      {err&&<div style={{fontSize:12,color:"#B04A38",marginTop:10}}>{err}</div>}
      {weather&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:12}}>
          <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
            <span style={{fontSize:32}}>{WMO_ICON[weather.code]||"🌡"}</span>
            <div>
              <div style={{fontFamily:"Georgia,serif",fontSize:28,fontWeight:700,color:TEXT_D,lineHeight:1}}>{weather.temp}°</div>
              <div style={{fontSize:11,color:TEXT_L}}>體感 {weather.feels}°</div>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:13,fontWeight:600,color:TEXT_M}}>{WMO[weather.code]||"—"}</div>
            <div style={{fontSize:11,color:TEXT_L,marginTop:2}}>濕度 {weather.humidity}%・風速 {weather.wind} km/h</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 打包清單項目（勾選 + 點文字編輯）───
function ChecklistItem({item, done, onToggle, onRename, pal}){
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(item);
  const inputRef              = useRef(null);
  const committedRef          = useRef(false);

  // 同步外部 item 變化（但編輯中不覆蓋）
  useEffect(()=>{ if(!editing) setVal(item); },[item, editing]);

  useEffect(()=>{
    if(editing){
      committedRef.current = false;
      // 用 setTimeout 避免 focus 觸發 scroll
      setTimeout(()=>inputRef.current?.focus({preventScroll:true}), 0);
    }
  },[editing]);

  const commit = () => {
    if(committedRef.current) return;
    committedRef.current = true;
    setEditing(false);
    if(val.trim() && val.trim()!==item) onRename(val.trim());
    else setVal(item);
  };

  return(
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${BORDER}`,minHeight:34}}>
      <div onClick={e=>{e.stopPropagation();onToggle(e);}}
        style={{width:20,height:20,borderRadius:6,border:`1.5px solid ${done?pal.bg:BORDER}`,background:done?pal.bg:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,WebkitTapHighlightColor:"transparent"}}>
        {done&&<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2"><path d="M2 6l3 3 5-5"/></svg>}
      </div>
      {editing
        ? <input ref={inputRef} value={val}
            onChange={e=>setVal(e.target.value)}
            onBlur={commit}
            onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); commit(); } }}
            style={{flex:1,fontSize:16,lineHeight:"20px",height:20,color:TEXT_D,background:"transparent",border:"none",borderBottom:`1px solid ${pal.bg}`,outline:"none",fontFamily:"inherit",padding:0}}/>
        : <span
            onClick={e=>{ if(done) return; e.stopPropagation(); setVal(item); setEditing(true); }}
            style={{flex:1,fontSize:12,lineHeight:"20px",color:done?TEXT_L:TEXT_D,textDecoration:done?"line-through":"none",cursor:done?"default":"text",userSelect:"none",WebkitTapHighlightColor:"transparent"}}>
            {item}
          </span>
      }
    </div>
  );
}

// ─── 鎖定橫向滑動（阻止垂直捲動穿透）───
function HorizontalScroll({children, height}){
  const ref = useRef(null);
  useEffect(()=>{
    const el = ref.current;
    if(!el) return;
    let startX=0, startY=0, isHoriz=null;
    const onStart = e=>{
      startX=e.touches[0].clientX;
      startY=e.touches[0].clientY;
      isHoriz=null;
    };
    const onMove = e=>{
      if(isHoriz===null){
        const dx=Math.abs(e.touches[0].clientX-startX);
        const dy=Math.abs(e.touches[0].clientY-startY);
        if(dx<4&&dy<4) return;
        isHoriz = dx >= dy;
      }
      // 只在確認是垂直滑動時阻止（讓水平滑動通過）
      if(!isHoriz) e.preventDefault();
    };
    el.addEventListener("touchstart", onStart, {passive:true});
    el.addEventListener("touchmove",  onMove,  {passive:false});
    return()=>{
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove",  onMove);
    };
  },[]);
  return(
    <div ref={ref} style={{display:"flex",height,overflowX:"scroll",overflowY:"hidden",scrollSnapType:"x mandatory",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",touchAction:"pan-x"}}>
      {children}
    </div>
  );
}

function TripListTab({trip, onUpdate, pal, listData={}, onUpdateListData}){
  const saveLD = (key, val) => onUpdateListData({...listData, [key]: val});

  const [openCat,      setOpenCat]      = useState("docs");
  const [openChecklist,setOpenChecklist]= useState(false);
  const [openEmerg,    setOpenEmerg]    = useState(false);
  const [openTrans,    setOpenTrans]    = useState(false);
  const [openMemo,     setOpenMemo]     = useState(false);
  const [openFlight,   setOpenFlight]   = useState(false);
  const [openCards,    setOpenCards]    = useState(false);
  const [cardForm,     setCardForm]     = useState(null);
  const [confirmCard,  setConfirmCard]  = useState(null);
  const [newItemText,  setNewItemText]  = useState({});
  const [newPhrase,    setNewPhrase]    = useState("");

  // 從 localStorage 初始化
  const [checked,      setChecked]      = useState(()=>listData.checked||{});
  const [customItems,  setCustomItems]  = useState(()=>listData.customItems||{});
  const [deletedItems, setDeletedItems] = useState(()=>{
    const d=listData.deletedItems||{};
    return Object.fromEntries(Object.entries(d).map(([k,v])=>[k,new Set(v)]));
  });
  const [renamedItems, setRenamedItems] = useState(()=>listData.renamedItems||{});
  const [emergInfo,    setEmergInfo]    = useState(()=>listData.emergInfo||{});
  const [deletedEmerg, setDeletedEmerg] = useState(()=>new Set(listData.deletedEmerg||[]));
  const [cards,        setCards]        = useState(()=>listData.cards||[]);
  const [memoText,     setMemoText]     = useState(()=>listData.memoText||"");
  const [customPhrases,setCustomPhrases]= useState(()=>listData.customPhrases||[]);

  // 持久化 — 用 ref 存最新值，debounce 存儲避免過頻繁寫入
  const ldRef = useRef({});
  const saveTimer = useRef(null);
  const scheduleSave = () => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(()=>onUpdateListData({...ldRef.current}), 500);
  };

  useEffect(()=>{ ldRef.current.checked=checked; scheduleSave(); },[checked]);
  useEffect(()=>{ ldRef.current.customItems=customItems; scheduleSave(); },[customItems]);
  useEffect(()=>{
    ldRef.current.deletedItems=Object.fromEntries(Object.entries(deletedItems).map(([k,v])=>[k,[...v]]));
    scheduleSave();
  },[deletedItems]);
  useEffect(()=>{ ldRef.current.renamedItems=renamedItems; scheduleSave(); },[renamedItems]);
  useEffect(()=>{ ldRef.current.emergInfo=emergInfo; scheduleSave(); },[emergInfo]);
  useEffect(()=>{ ldRef.current.deletedEmerg=[...deletedEmerg]; scheduleSave(); },[deletedEmerg]);
  useEffect(()=>{ ldRef.current.cards=cards; scheduleSave(); },[cards]);
  useEffect(()=>{ ldRef.current.memoText=memoText; scheduleSave(); },[memoText]);
  useEffect(()=>{ ldRef.current.customPhrases=customPhrases; scheduleSave(); },[customPhrases]);

  const checklistRows = (() => {
    const cat = CHECKLIST_CATS.find(c=>c.id===openCat);
    const activeDefault = (cat?.items||[])
      .filter(it=>!(deletedItems[openCat]||new Set()).has(it))
      .map(it=>(renamedItems[openCat]||{})[it]||it);
    const allItems = [...activeDefault,...(customItems[openCat]||[])];
    return allItems.map((item,idx)=>{
      const isCustom = idx>=activeDefault.length;
      const origName = isCustom ? item :
        Object.entries(renamedItems[openCat]||{}).find(([,v])=>v===item)?.[0] || item;
      return {
        key: origName+idx,
        item, isCustom, origName,
        done: !!(checked[openCat]?.[origName]||checked[openCat]?.[item]),
      };
    });
  })();
  const checklistTabData = CHECKLIST_CATS.map(c=>{
    const ad=(c.items||[]).filter(it=>!(deletedItems[c.id]||new Set()).has(it)).map(it=>(renamedItems[c.id]||{})[it]||it);
    const ai=[...ad,...(customItems[c.id]||[])];
    return {id:c.id, label:c.label, total:ai.length, done:ai.filter(it=>checked[c.id]?.[it]).length};
  });

  const [confirmDel,  setConfirmDel]  = useState(null);

  const deleteItem=(catId,item,isCustom)=>{
    setConfirmDel({catId,item,isCustom});
  };
  const confirmDelete=()=>{
    if(!confirmDel) return;
    if(confirmDel.action){
      confirmDel.action();
    } else {
      const {catId,item,isCustom}=confirmDel;
      if(isCustom){
        setCustomItems(p=>({...p,[catId]:(p[catId]||[]).filter(x=>x!==item)}));
      } else {
        setDeletedItems(p=>({...p,[catId]:new Set([...(p[catId]||[]),item])}));
      }
    }
    setConfirmDel(null);
  };
  const addItem=(catId)=>{
    const t=(newItemText[catId]||"").trim(); if(!t) return;
    setCustomItems(p=>({...p,[catId]:[...(p[catId]||[]),t]}));
    setNewItemText(p=>({...p,[catId]:""}));
  };

  const translatePhrase=async(phrase,idx)=>{
    setTranslating(p=>({...p,[idx]:true}));
    try{
      const dest=trip.currency==="JPY"?"Japanese":trip.currency==="KRW"?"Korean":trip.currency==="THB"?"Thai":"English";
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "anthropic-dangerous-direct-browser-access":"true",
        },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:200,
          messages:[{role:"user",content:`Translate this phrase to ${dest}. Reply with ONLY the translation text, no explanation: "${phrase}"`}]
        })
      });
      if(!res.ok) throw new Error("API error");
      const data=await res.json();
      const text=(data.content||[]).find(b=>b.type==="text")?.text||"";
      if(text.trim()) setTranslated(p=>({...p,[idx]:text.trim()}));
    }catch(err){
      setTranslated(p=>({...p,[idx]:"翻譯失敗，請稍後再試"}));
    }
    setTranslating(p=>({...p,[idx]:false}));
  };

  // 航班狀態（清單分頁內直接管理）
  const [showFlightForm, setShowFlightForm] = useState(false);
  const [editFlight,     setEditFlight]     = useState(null);
  const [fType,  setFType]  = useState("depart");
  const [fCode,  setFCode]  = useState("");
  const [fFrom,  setFFrom]  = useState("");
  const [fTo,    setFTo]    = useState("");
  const [fDepDate,setFDepDate]=useState("");
  const [fDepTime,setFDepTime]=useState("08:00");
  const [fArrDate,setFArrDate]=useState("");
  const [fArrTime,setFArrTime]=useState("14:00");
  const [fTerminal,setFTerminal]=useState("");
  const [fSeat,  setFSeat]  = useState("");
  const [fNote2, setFNote2] = useState("");

  const openAddFlight=()=>{setEditFlight(null);setFType("depart");setFCode("");setFFrom("");setFTo("");setFDepDate(trip.startDate||"");setFDepTime("08:00");setFArrDate("");setFArrTime("14:00");setFTerminal("");setFSeat("");setFNote2("");setShowFlightForm(true);};
  const openEditFlight=f=>{setEditFlight(f);setFType(f.type);setFCode(f.code);setFFrom(f.from);setFTo(f.to);setFDepDate(f.depDate);setFDepTime(f.depTime);setFArrDate(f.arrDate);setFArrTime(f.arrTime);setFTerminal(f.terminal||"");setFSeat(f.seat||"");setFNote2(f.note||"");setShowFlightForm(true);};
  const saveFlight2=()=>{
    if(!fCode.trim()||!fFrom.trim()||!fTo.trim()) return;
    const fl={id:editFlight?.id||genId(),type:fType,code:fCode.toUpperCase().trim(),from:fFrom.toUpperCase().trim(),to:fTo.toUpperCase().trim(),depDate:fDepDate,depTime:fDepTime,arrDate:fArrDate,arrTime:fArrTime,terminal:fTerminal.trim(),seat:fSeat.trim(),note:fNote2.trim()};
    const next=editFlight?(trip.flights||[]).map(f=>f.id===editFlight.id?fl:f):[...(trip.flights||[]),fl];
    onUpdate({...trip,flights:next});setShowFlightForm(false);
  };
  const deleteFlight2=id=>onUpdate({...trip,flights:(trip.flights||[]).filter(f=>f.id!==id)});

  const flights=trip.flights||[];
  const card={background:CARD_BG,borderRadius:20,marginBottom:12,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.06)"};
  const hd=(label,icon,open,toggle,badge,addBtn)=>(
    <div style={{display:"flex",alignItems:"center",padding:"13px 16px"}}>
      <button onClick={toggle} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:"inherit"}}>
        <div style={{width:28,height:28,borderRadius:8,background:pal.bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}>{icon}</div>
        <span style={{fontSize:13,fontWeight:600,color:TEXT_D}}>{label}</span>
        {badge&&<span style={{fontSize:10,background:APP_BG,color:TEXT_L,padding:"2px 7px",borderRadius:10,border:`1px solid ${BORDER}`}}>{badge}</span>}
      </button>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        {addBtn}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_L} strokeWidth="2" strokeLinecap="round" onClick={toggle} style={{cursor:"pointer"}}>
          {open?<path d="M18 15l-6-6-6 6"/>:<path d="M6 9l6 6 6-6"/>}
        </svg>
      </div>
    </div>
  );

  const EMERG=[
    {key:"embassy",  label:"台灣駐外辦事處", ph:"大使館/辦事處電話"},
    {key:"ambulance",label:"當地救護資訊",   ph:"急救電話（如 119）"},
    {key:"insurance",label:"保險公司",     ph:"24小時支援專線"},
    {key:"hotel",    label:"住宿資訊",     ph:"飯店名稱及地址"},
  ];
  const PHRASES=["請問廁所在哪裡？","身體非常不舒服，請幫我叫救護車","請問附近有藥局嗎？","請問這個多少錢？","請帶我去這個地址"];
  const allPhrases=[...PHRASES,...customPhrases];
  const destLang=trip.currency==="JPY"?"日文":trip.currency==="KRW"?"韓文":trip.currency==="THB"?"泰文":"英文";
  const FTYPES=[{id:"depart",label:"去程"},{id:"transit",label:"轉機"},{id:"return",label:"回程"}];

  const addEmergItem = e => { e.stopPropagation(); setEmergInfo(p => { const k = "custom_" + Date.now(); const n = {}; Object.assign(n, p); n[k] = {label:"",value:""}; return n; }); };

  return(
    <div style={{padding:"12px 14px 100px"}}>

      {/* 航班 */}
      <div style={card}>
        {hd("航班資訊",
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>,
          openFlight,()=>setOpenFlight(v=>!v),
          flights.length?`${flights.length} 筆`:null,
          <button onClick={e=>{e.stopPropagation();openAddFlight();}} style={{padding:"4px 10px",borderRadius:10,background:pal.bg,border:"none",cursor:"pointer",fontSize:11,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}>
            <Icon name="plus" size={11} color="#fff"/> 新增
          </button>
        )}
        {openFlight&&<div style={{borderTop:`1px solid ${BORDER}`}}>
          {!flights.length&&<div style={{padding:"14px 16px",fontSize:12,color:TEXT_L,fontStyle:"italic"}}>尚無航班，點上方「新增」加入。</div>}
          {[...flights].sort((a,b)=>({depart:0,transit:1,return:2}[a.type]??9)-({depart:0,transit:1,return:2}[b.type]??9)).map((f,i)=>(
            <SwipeDelete key={f.id} onDelete={()=>deleteFlight2(f.id)}>
              <div style={{padding:"11px 16px",borderBottom:i<flights.length-1?`1px solid ${BORDER}`:"none"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10,background:APP_BG,border:`1px solid ${BORDER}`,borderRadius:20,padding:"1px 7px",color:TEXT_M}}>{{depart:"去程",transit:"轉機",return:"回程"}[f.type]}</span>
                    <span style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,color:TEXT_D}}>{f.code}</span>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    <button onClick={e=>{e.stopPropagation();window.open(`https://www.flightaware.com/live/flight/${f.code}/${f.from||''}/${f.to||''}`,"_blank");}}
                      style={{fontSize:9,color:pal.bg,background:APP_BG,border:`1px solid ${BORDER}`,borderRadius:8,padding:"2px 7px",cursor:"pointer",fontFamily:"inherit"}}>追蹤</button>
                    <button onClick={e=>{e.stopPropagation();openEditFlight(f);}}
                      style={{width:24,height:24,borderRadius:7,background:APP_BG,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <Icon name="pencil-sm" size={11} color={TEXT_M} sw={1.8}/>
                    </button>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center"}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:700,color:TEXT_D}}>{f.from}</div>
                    <div style={{fontSize:10,color:pal.bg,fontWeight:600}}>{f.depTime}</div>
                    <div style={{fontSize:9,color:TEXT_L}}>{f.depDate}</div>
                  </div>
                  <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <div style={{height:1,flex:1,background:BORDER}}/><span style={{fontSize:14,color:pal.bg,margin:"0 4px"}}>✈</span><div style={{height:1,flex:1,background:BORDER}}/>
                  </div>
                  <div style={{flex:1,textAlign:"right"}}>
                    <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:700,color:TEXT_D}}>{f.to}</div>
                    <div style={{fontSize:10,color:pal.bg,fontWeight:600}}>{f.arrTime}</div>
                    <div style={{fontSize:9,color:TEXT_L}}>{f.arrDate}</div>
                  </div>
                </div>
                {(f.terminal||f.seat)&&<div style={{display:"flex",gap:5,marginTop:6}}>
                  {f.terminal&&<span style={{fontSize:9,background:APP_BG,color:TEXT_M,padding:"2px 6px",borderRadius:8,border:`1px solid ${BORDER}`}}>航廈 {f.terminal}</span>}
                  {f.seat&&<span style={{fontSize:9,background:APP_BG,color:TEXT_M,padding:"2px 6px",borderRadius:8,border:`1px solid ${BORDER}`}}>{f.seat}</span>}
                </div>}
              </div>
            </SwipeDelete>
          ))}
        </div>}
      </div>

      {/* 刷卡攻略 */}
      <div style={card}>
        {hd("刷卡攻略",
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="3"/><path d="M1 10h22"/></svg>,
          openCards,()=>setOpenCards(v=>!v),null,
          openCards&&<button onClick={e=>{e.stopPropagation();setCardForm({name:"",scene:"",perk:"",note:""});}}
            style={{padding:"4px 10px",borderRadius:10,background:pal.bg,border:"none",cursor:"pointer",fontSize:11,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}>
            <Icon name="plus" size={11} color="#fff"/> 新增
          </button>
        )}
        {openCards&&<div style={{borderTop:`1px solid ${BORDER}`,padding:"10px 14px",display:"flex",flexDirection:"column",gap:8}}>
          {cards.length===0&&<div style={{fontSize:12,color:TEXT_L,textAlign:"center",padding:"12px 0"}}>尚未新增卡片，點右上角「新增」開始記錄</div>}
          {cards.map(c=>(
            <SwipeDelete key={c.id} onDelete={()=>setConfirmCard(c)}>
              <div onClick={()=>setCardForm({...c})} style={{background:APP_BG,borderRadius:12,padding:"10px 12px",cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={pal.bg} strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="3"/><path d="M1 10h22"/><circle cx="6" cy="15" r="1.5" fill={pal.bg}/></svg>
                    <span style={{fontSize:13,fontWeight:600,color:TEXT_D}}>{c.name||"未命名卡片"}</span>
                  </div>
                  {c.scene&&<span style={{fontSize:10,color:TEXT_L,background:BORDER+"60",borderRadius:8,padding:"2px 7px"}}>{c.scene}</span>}
                </div>
                {c.perk&&<div style={{fontSize:12,color:pal.bg,fontWeight:500,marginBottom:c.note?3:0}}>{c.perk}</div>}
                {c.note&&<div style={{fontSize:11,color:TEXT_L,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{c.note}</div>}
              </div>
            </SwipeDelete>
          ))}
        </div>}
      </div>

      {/* 打包清單 */}
      <div style={card}>
        {hd("打包清單",
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
          openChecklist,()=>setOpenChecklist(v=>!v),null)}
        {openChecklist&&<div style={{borderTop:`1px solid ${BORDER}`}}>
          <div style={{display:"flex",borderBottom:`1px solid ${BORDER}`}}>
            {checklistTabData.map(t=>(
              <button key={t.id} onClick={()=>setOpenCat(t.id)}
                style={{flex:1,padding:"8px 2px",background:"none",border:"none",borderBottom:`2px solid ${openCat===t.id?pal.bg:"transparent"}`,cursor:"pointer",fontFamily:"inherit"}}>
                <div style={{fontSize:10,color:openCat===t.id?pal.bg:TEXT_L,fontWeight:openCat===t.id?600:400,textAlign:"center"}}>{t.label}</div>
                <div style={{fontSize:9,color:t.done===t.total&&t.done>0?"#5A8A5A":TEXT_L,textAlign:"center"}}>{t.done}/{t.total}</div>
              </button>
            ))}
          </div>
          <div style={{padding:"6px 14px 10px"}}>
            {checklistRows.map((row,idx)=>(
              <SwipeDelete key={row.key} onDelete={()=>deleteItem(openCat, row.origName, row.isCustom)}>
                <ChecklistItem
                  item={row.item}
                  done={row.done}
                  onToggle={e=>{e.stopPropagation();setChecked(p=>({...p,[openCat]:{...(p[openCat]||{}),[row.origName]:!p[openCat]?.[row.origName]}}));}}
                  onRename={newName=>{
                    if(!newName.trim()||newName===row.item) return;
                    if(row.isCustom) setCustomItems(p=>({...p,[openCat]:(p[openCat]||[]).map(x=>x===row.item?newName.trim():x)}));
                    else setRenamedItems(p=>({...p,[openCat]:{...(p[openCat]||{}),[row.origName]:newName.trim()}}));
                  }}
                  pal={pal}
                />
              </SwipeDelete>
            ))}
            <div style={{display:"flex",gap:6,marginTop:8}}>
              <input value={newItemText[openCat]||""} onChange={e=>setNewItemText(p=>({...p,[openCat]:e.target.value}))}
                onKeyDown={e=>e.key==="Enter"&&addItem(openCat)} placeholder="新增項目…"
                style={{flex:1,padding:"7px 10px",border:`1.5px solid ${BORDER}`,borderRadius:10,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none"}}/>
              <button onClick={()=>addItem(openCat)} style={{padding:"7px 12px",borderRadius:10,background:pal.bg,border:"none",cursor:"pointer",color:"#fff",fontSize:14,fontFamily:"inherit"}}>＋</button>
            </div>
          </div>
        </div>}
      </div>

      {/* 刪除確認（僅在這裡，SwipeDelete 不再有自己的 Dialog）*/}
      <Dialog show={!!confirmDel} icon={<Icon name="trash" size={28}/>}
        title={`刪除「${confirmDel?.item}」？`}
        desc="刪除後將無法復原。"
        onConfirm={confirmDelete} onCancel={()=>setConfirmDel(null)} confirmLabel="確認刪除" danger/>

      {/* 緊急資訊 */}
      <div style={card}>
        {hd("緊急資訊 & 重要備忘",
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>,
          openEmerg,()=>setOpenEmerg(v=>!v),null,
          openEmerg&&<button onClick={addEmergItem}
            style={{padding:"4px 10px",borderRadius:10,background:pal.bg,border:"none",cursor:"pointer",fontSize:11,color:"#fff",fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}>
            <Icon name="plus" size={11} color="#fff"/> 新增
          </button>
        )}
        {openEmerg&&<div style={{borderTop:`1px solid ${BORDER}`,padding:"10px 14px",display:"flex",flexDirection:"column",gap:8}}>
          {/* 預設固定欄位 */}
          {EMERG.filter(ef=>!deletedEmerg.has(ef.key)).map(ef=>(
            <SwipeDelete key={ef.key} onDelete={()=>setConfirmDel({item:ef.label, action:()=>setDeletedEmerg(p=>new Set([...p,ef.key]))})}>
              <div style={{background:APP_BG,borderRadius:12,padding:"9px 12px"}}>
                <div style={{fontSize:10,color:TEXT_L,marginBottom:4,letterSpacing:"0.05em",textTransform:"uppercase"}}>{ef.label}</div>
                <input value={(emergInfo[ef.key]?.value!==undefined?emergInfo[ef.key].value:emergInfo[ef.key])||""}
                  onChange={e=>setEmergInfo(p=>({...p,[ef.key]:e.target.value}))}
                  placeholder={ef.ph}
                  style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${BORDER}`,padding:"3px 0",fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none"}}/>
              </div>
            </SwipeDelete>
          ))}
          {/* 自訂項目（標題+內容都可改）*/}
          {Object.entries(emergInfo).filter(([k])=>k.startsWith("custom_")).map(([k,v])=>(
            <SwipeDelete key={k} onDelete={()=>setConfirmDel({item:typeof v==="object"?v.label||"備忘項目":"備忘項目", action:()=>setEmergInfo(p=>{const n={...p};delete n[k];return n;})})}>
              <div style={{background:APP_BG,borderRadius:12,padding:"9px 12px"}}>
                <input value={typeof v==="object"?v.label||"":""} onChange={e=>setEmergInfo(p=>({...p,[k]:{...(typeof p[k]==="object"?p[k]:{}),label:e.target.value}}))}
                  placeholder="項目名稱"
                  style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${BORDER}`,padding:"3px 0",fontFamily:"inherit",fontSize:10,color:TEXT_L,outline:"none",marginBottom:5,letterSpacing:"0.05em",textTransform:"uppercase"}}/>
                <input value={typeof v==="object"?v.value||"":v||""} onChange={e=>setEmergInfo(p=>({...p,[k]:{...(typeof p[k]==="object"?p[k]:{}),value:e.target.value}}))}
                  placeholder="內容"
                  style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${BORDER}`,padding:"3px 0",fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none"}}/>
              </div>
            </SwipeDelete>
          ))}
        </div>}
      </div>

      {/* 旅遊翻譯 */}
      <div style={card}>
        {hd("旅遊翻譯",
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><path d="M3 5h12M9 3v2m4.25 8.5c0 2.485-2.099 4.5-4.688 4.5C7.121 18 5 15.985 5 13.5S7.121 9 9.562 9c1.094 0 2.094.372 2.876.989"/><path d="M13 21l5-11 5 11M15.5 16h5"/></svg>,
          openTrans,()=>setOpenTrans(v=>!v),null)}
        {openTrans&&(
          <div style={{borderTop:`1px solid ${BORDER}`}}>
            {/* 開啟 Google 翻譯按鈕 */}
            <div style={{padding:"12px 14px",borderBottom:`1px solid ${BORDER}`}}>
              <div style={{fontSize:11,color:TEXT_L,marginBottom:10}}>目的地語言：{destLang}</div>
              <button onClick={()=>window.open(`https://translate.google.com/?sl=zh-TW&tl=${
                trip.currency==="JPY"?"ja":
                trip.currency==="KRW"?"ko":
                trip.currency==="THB"?"th":"en"
              }&op=translate`,"_blank")}
                style={{width:"100%",padding:"11px 0",borderRadius:14,background:pal.bg,color:"#fff",fontSize:13,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M3 5h12M9 3v2m4.25 8.5c0 2.485-2.099 4.5-4.688 4.5C7.121 18 5 15.985 5 13.5S7.121 9 9.562 9c1.094 0 2.094.372 2.876.989"/><path d="M13 21l5-11 5 11M15.5 16h5"/></svg>
                開啟 Google 翻譯
              </button>
              <div style={{fontSize:10,color:TEXT_L,textAlign:"center",marginTop:6}}>點擊後在瀏覽器輸入任何文字即可翻譯</div>
            </div>
            {/* 常用句速查 */}
            <div style={{padding:"10px 14px 12px"}}>
              <div style={{fontSize:10,color:TEXT_L,marginBottom:8}}>常用句 — 點「翻譯」直接跳 Google 翻譯，或「複製」後貼上</div>
              {allPhrases.map((phrase,i)=>(
                <SwipeDelete key={i} onDelete={()=>{
                  if(i>=PHRASES.length) setCustomPhrases(p=>p.filter((_,j)=>j!==i-PHRASES.length));
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:7,padding:"9px 0",borderTop:`1px solid ${BORDER}`}}>
                    <span style={{flex:1,fontSize:12,color:TEXT_D}}>{phrase}</span>
                    <button onClick={()=>window.open(`https://translate.google.com/?sl=zh-TW&tl=${
                      trip.currency==="JPY"?"ja":trip.currency==="KRW"?"ko":trip.currency==="THB"?"th":"en"
                    }&text=${encodeURIComponent(phrase)}&op=translate`,"_blank")}
                      style={{padding:"4px 9px",borderRadius:8,background:pal.bg,border:"none",cursor:"pointer",fontSize:10,color:"#fff",fontFamily:"inherit",flexShrink:0}}>翻譯</button>
                  </div>
                </SwipeDelete>
              ))}
              <div style={{display:"flex",gap:6,marginTop:10}}>
                <input value={newPhrase} onChange={e=>setNewPhrase(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&newPhrase.trim()){setCustomPhrases(p=>[...p,newPhrase.trim()]);setNewPhrase("");}}}
                  placeholder="新增常用句…"
                  style={{flex:1,padding:"7px 10px",border:`1.5px solid ${BORDER}`,borderRadius:10,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none"}}/>
                <button onClick={()=>{if(newPhrase.trim()){setCustomPhrases(p=>[...p,newPhrase.trim()]);setNewPhrase("");}}}
                  style={{padding:"7px 12px",borderRadius:10,background:pal.bg,border:"none",cursor:"pointer",color:"#fff",fontSize:14,fontFamily:"inherit"}}>＋</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 旅遊備忘錄 */}
      <div style={card}>
        {hd("旅遊備忘錄",
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
          openMemo,()=>setOpenMemo(v=>!v),null)}
        {openMemo&&(
          <div style={{borderTop:`1px solid ${BORDER}`,padding:"12px 14px"}}>
            <textarea
              value={memoText}
              onChange={e=>setMemoText(e.target.value)}
              placeholder={"自由記錄旅遊備忘...\n例如：訂房確認碼、換錢地點、購物清單、注意事項"}
              style={{width:"100%",minHeight:160,padding:"12px 14px",border:`1.5px solid ${BORDER}`,borderRadius:14,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none",resize:"none",lineHeight:1.8,boxSizing:"border-box",whiteSpace:"pre-wrap"}}
            />
            <div style={{fontSize:10,color:TEXT_L,marginTop:6,textAlign:"right"}}>{memoText.length} 字</div>
          </div>
        )}
      </div>

      {/* 刪除確認（僅在這裡，SwipeDelete 不再有自己的 Dialog）*/}
      <Dialog show={!!confirmDel} icon={<Icon name="trash" size={28}/>}
        title={`刪除「${confirmDel?.item}」？`}
        desc="刪除後將無法復原。"
        onConfirm={confirmDelete} onCancel={()=>setConfirmDel(null)} confirmLabel="確認刪除" danger/>

      <BottomSheet show={!!cardForm} onClose={()=>setCardForm(null)} title={cardForm?.id?"編輯卡片":"新增卡片"}>
        <div style={{display:"flex",flexDirection:"column",gap:12,paddingBottom:8}}>
          {[
            {key:"name",  label:"卡片名稱", placeholder:"例如：台新@GoGo卡",   isTA:false},
            {key:"scene", label:"適用場景", placeholder:"例如：日本餐廳、海外消費", isTA:false},
            {key:"perk",  label:"優惠內容", placeholder:"例如：3% 現金回饋",    isTA:false},
            {key:"note",  label:"備註",     placeholder:"例如：單筆需滿 NT$1,000", isTA:true},
          ].map(f=>(
            <div key={f.key}>
              <label style={{fontSize:11,color:TEXT_L,display:"block",marginBottom:5,letterSpacing:"0.07em",textTransform:"uppercase"}}>{f.label}</label>
              {f.isTA
                ? <textarea value={cardForm?.[f.key]||""} onChange={e=>setCardForm(p=>({...p,[f.key]:e.target.value}))}
                    placeholder={f.placeholder} rows={3}
                    style={{width:"100%",padding:"10px 14px",border:`1.5px solid ${BORDER}`,borderRadius:12,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none",boxSizing:"border-box",resize:"none",lineHeight:1.6}}/>
                : <input value={cardForm?.[f.key]||""} onChange={e=>setCardForm(p=>({...p,[f.key]:e.target.value}))}
                    placeholder={f.placeholder}
                    style={{width:"100%",padding:"10px 14px",border:`1.5px solid ${BORDER}`,borderRadius:12,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none",boxSizing:"border-box"}}/>
              }
            </div>
          ))}
          <button onClick={()=>{
            if(!cardForm?.name?.trim()) return;
            if(cardForm.id){setCards(p=>p.map(c=>c.id===cardForm.id?{...cardForm}:c));}
            else{setCards(p=>[...p,{...cardForm,id:Date.now().toString(36)}]);}
            setCardForm(null);
          }} style={{width:"100%",padding:"13px 0",borderRadius:16,background:pal.bg,color:"#fff",fontSize:14,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit"}}>
            {cardForm?.id?"儲存修改":"新增卡片"}
          </button>
        </div>
      </BottomSheet>

      {/* 刷卡攻略刪除確認 */}
      <Dialog show={!!confirmCard} icon={<Icon name="trash" size={28}/>}
        title={"刪除「"+(confirmCard?.name||"此卡片")+"」？"}
        desc="刪除後將無法復原。"
        onConfirm={()=>{setCards(p=>p.filter(c=>c.id!==confirmCard?.id));setConfirmCard(null);}}
        onCancel={()=>setConfirmCard(null)} confirmLabel="確認刪除" danger/>

      <BottomSheet show={showFlightForm} onClose={()=>setShowFlightForm(false)} title={editFlight?"編輯航班":"新增航班"} maxH="95vh">
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {/* 去程/轉機/回程 */}
          <div style={{display:"flex",gap:6}}>
            {FTYPES.map(t=>{const sel=fType===t.id;return(
              <button key={t.id} onClick={()=>setFType(t.id)}
                style={{flex:1,padding:"6px 4px",borderRadius:20,background:sel?pal.bg:APP_BG,border:`1.5px solid ${sel?pal.bg:BORDER}`,cursor:"pointer",fontSize:11,color:sel?"#fff":TEXT_M,fontFamily:"inherit",fontWeight:sel?600:400}}>
                {t.label}
              </button>
            );})}
          </div>
          {/* 航班代號 + 出發地 + 目的地 */}
          <div style={{display:"flex",gap:6}}>
            {[{label:"航班",val:fCode,set:setFCode,ph:"JL123"},{label:"出發",val:fFrom,set:setFFrom,ph:"TPE"},{label:"目的",val:fTo,set:setFTo,ph:"NRT"}].map(f=>(
              <div key={f.label} style={{flex:1}}>
                <label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:3,textTransform:"uppercase"}}>{f.label}</label>
                <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                  style={{width:"100%",padding:"8px 10px",border:`1.5px solid ${BORDER}`,borderRadius:12,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none",boxSizing:"border-box"}}/>
              </div>
            ))}
          </div>
          {/* 出發日期 + 時間 */}
          <div style={{display:"flex",gap:6}}>
            <div style={{flex:2}}>
              <label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:3,textTransform:"uppercase"}}>出發日期</label>
              <input type="date" value={fDepDate} onChange={e=>setFDepDate(e.target.value)}
                style={{width:"100%",padding:"8px 10px",border:`1.5px solid ${BORDER}`,borderRadius:12,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{flex:1}}>
              <label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:3,textTransform:"uppercase"}}>出發時間</label>
              <MiniTimePicker value={fDepTime} onChange={setFDepTime}/>
            </div>
          </div>
          {/* 抵達日期 + 時間 */}
          <div style={{display:"flex",gap:6}}>
            <div style={{flex:2}}>
              <label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:3,textTransform:"uppercase"}}>抵達日期</label>
              <input type="date" value={fArrDate} onChange={e=>setFArrDate(e.target.value)}
                style={{width:"100%",padding:"8px 10px",border:`1.5px solid ${BORDER}`,borderRadius:12,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{flex:1}}>
              <label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:3,textTransform:"uppercase"}}>抵達時間</label>
              <MiniTimePicker value={fArrTime} onChange={setFArrTime}/>
            </div>
          </div>
          {/* 航廈 + 備註 並排 */}
          <div style={{display:"flex",gap:6}}>
            <div style={{flex:"0 0 30%"}}>
              <label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:3,textTransform:"uppercase"}}>航廈</label>
              <input value={fTerminal} onChange={e=>setFTerminal(e.target.value)} placeholder="T2"
                style={{width:"100%",padding:"8px 10px",border:`1.5px solid ${BORDER}`,borderRadius:12,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{flex:1}}>
              <label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:3,textTransform:"uppercase"}}>備註</label>
              <input value={fSeat} onChange={e=>setFSeat(e.target.value)} placeholder="座位 12A、行李 23kg…"
                style={{width:"100%",padding:"8px 10px",border:`1.5px solid ${BORDER}`,borderRadius:12,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none",boxSizing:"border-box"}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <button onClick={()=>setShowFlightForm(false)} style={{flex:1,padding:"11px 0",borderRadius:16,border:`1.5px solid ${BORDER}`,color:TEXT_M,fontSize:14,background:"none",cursor:"pointer",fontFamily:"inherit"}}>取消</button>
            <button onClick={saveFlight2} style={{flex:1,padding:"11px 0",borderRadius:16,background:pal.bg,color:"#fff",fontSize:14,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit"}}>{editFlight?"儲存修改":"加入航班"}</button>
          </div>
        </div>
      </BottomSheet>

    </div>
  );
}
function MapTab({trip}){
  const pal = PALETTE[trip.paletteIdx??0];
  const [selDay, setSelDay] = useState(null); // null = 全部

  // 依天分組
  const byDay = trip.days.map(d=>({
    ...d,
    places: d.schedule.filter(ev=>ev.location&&ev.location!=="未定地點"),
  })).filter(d=>d.places.length>0);

  const allPlaces = byDay.flatMap(d=>d.places.map(p=>({...p,dayDate:d.fullDate,dateNum:d.dateNumber,month:d.month,weekDay:d.weekDay})));
  const filtered  = selDay===null ? allPlaces : allPlaces.filter(p=>p.dayDate===selDay);
  const totalPlaces = allPlaces.length;

  // 開啟各類連結
  const openMaps     = (p) => {
    const url = p.locationUrl?.trim();
    if(url) window.open(url,"_blank");
    else    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.location)}`,"_blank");
  };
  const openNavigate = (p) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.location)}&travelmode=transit`,"_blank");
  };
  const openStreet   = (p) => {
    window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=&query=${encodeURIComponent(p.location)}`,"_blank");
  };
  // 一鍵規劃當天路線（Google Maps waypoints）
  const openDayRoute = (day) => {
    const places = day.places;
    if(places.length<2) { openMaps({location:places[0]?.location}); return; }
    const origin      = encodeURIComponent(places[0].location);
    const destination = encodeURIComponent(places[places.length-1].location);
    const waypoints   = places.slice(1,-1).map(p=>encodeURIComponent(p.location)).join("|");
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints?`&waypoints=${waypoints}`:""}&travelmode=transit`;
    window.open(url,"_blank");
  };
  // 搜尋附近
  const openNearby   = (keyword) => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(keyword)}`,"_blank");
  };

  const NEARBY = [
    {label:"附近餐廳",  q:"restaurant nearby",  icon:"food"},
    {label:"便利商店",  q:"convenience store",  icon:"shop"},
    {label:"地鐵站",    q:"metro station nearby",icon:"transport"},
    {label:"藥局",      q:"pharmacy nearby",    icon:"health"},
    {label:"咖啡廳",    q:"cafe nearby",        icon:"snack"},
    {label:"超市",      q:"supermarket nearby", icon:"shop"},
  ];

  return(
    <div style={{padding:"16px 16px 24px"}}>

      {/* ── 統計列 ── */}
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        {[
          {label:"旅程天數", val:`${trip.days.length} 天`},
          {label:"地點總數", val:`${totalPlaces} 個`},
          {label:"行程數",   val:`${allPlaces.length} 筆`},
        ].map(({label,val})=>(
          <div key={label} style={{flex:1,background:CARD_BG,borderRadius:16,padding:"12px 10px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:18,fontWeight:700,color:pal.bg}}>{val}</div>
            <div style={{fontSize:10,color:TEXT_L,marginTop:3}}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── 快速搜尋附近 ── */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,color:TEXT_L,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>快速搜尋附近</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {NEARBY.map(n=>(
            <button key={n.label} onClick={()=>openNearby(n.q)}
              style={{display:"flex",alignItems:"center",gap:6,background:CARD_BG,border:`1px solid ${BORDER}`,borderRadius:20,padding:"7px 13px",fontSize:12,color:TEXT_M,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 6px rgba(0,0,0,.04)",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background=pal.bg;e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor=pal.bg;}}
              onMouseLeave={e=>{e.currentTarget.style.background=CARD_BG;e.currentTarget.style.color=TEXT_M;e.currentTarget.style.borderColor=BORDER;}}>
              <CatIcon id={n.icon} size={14} color="currentColor"/>
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 天數篩選 ── */}
      {byDay.length>1&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:TEXT_L,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8}}>篩選天數</div>
          <div style={{display:"flex",gap:7,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
            <button onClick={()=>setSelDay(null)}
              style={{flexShrink:0,padding:"6px 14px",borderRadius:20,border:`1.5px solid ${selDay===null?pal.bg:BORDER}`,background:selDay===null?pal.bg:CARD_BG,color:selDay===null?"#fff":TEXT_M,fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}>
              全部
            </button>
            {byDay.map(d=>(
              <button key={d.fullDate} onClick={()=>setSelDay(d.fullDate)}
                style={{flexShrink:0,padding:"6px 14px",borderRadius:20,border:`1.5px solid ${selDay===d.fullDate?pal.bg:BORDER}`,background:selDay===d.fullDate?pal.bg:CARD_BG,color:selDay===d.fullDate?"#fff":TEXT_M,fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}>
                {d.month}/{d.dateNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 當天一鍵路線規劃（選擇單日才顯示）── */}
      {selDay&&(()=>{
        const day=byDay.find(d=>d.fullDate===selDay);
        if(!day||day.places.length<1) return null;
        return(
          <button onClick={()=>openDayRoute(day)}
            style={{width:"100%",marginBottom:14,padding:"13px 0",borderRadius:16,background:pal.bg,color:"#fff",fontSize:13,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:7,boxShadow:`0 4px 16px ${pal.bg}50`}}>
            <Icon name="map" size={16} color="#fff" sw={2}/>
            一鍵規劃 {day.dateNumber}/{day.month} 全日路線
          </button>
        );
      })()}

      {/* ── 地點列表 ── */}
      {filtered.length===0&&(
        <div style={{textAlign:"center",padding:"40px 0",color:TEXT_L,fontSize:13,fontStyle:"italic"}}>
          {selDay?"此日尚無地點":"尚未新增任何地點"}
        </div>
      )}

      {filtered.map((pl,i)=>(
        <div key={i} style={{background:CARD_BG,borderRadius:18,marginBottom:10,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
          {/* 主資訊列 */}
          <div style={{padding:"12px 14px 10px",display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{width:36,height:36,borderRadius:11,background:pal.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Icon name="location" size={17} color="#fff" sw={1.5}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                <span style={{fontSize:10,background:APP_BG,color:TEXT_L,padding:"2px 7px",borderRadius:10,border:`1px solid ${BORDER}`}}>
                  {pl.month}/{pl.dateNumber} {pl.weekDay}
                </span>
                <span style={{fontFamily:"Georgia,serif",fontSize:11,color:pal.bg,fontWeight:600}}>{pl.time}</span>
              </div>
              <div style={{fontSize:13,fontWeight:600,color:TEXT_D,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pl.title}</div>
              <div style={{fontSize:11,color:TEXT_M,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📍 {pl.location}</div>
            </div>
          </div>
          {/* 操作按鈕列 */}
          <div style={{display:"flex",borderTop:`1px solid ${BORDER}`}}>
            {[
              {label:"查看地圖", icon:"map",          action:()=>openMaps(pl),     tip:"搜尋地點"},
              {label:"導航前往", icon:"arrow-right",  action:()=>openNavigate(pl), tip:"大眾運輸導航"},
              {label:"街景預覽", icon:"camera",       action:()=>openStreet(pl),   tip:"Google 街景"},
            ].map(({label,icon,action},bi)=>(
              <button key={label} onClick={action}
                style={{flex:1,padding:"10px 0",background:"none",border:"none",borderRight:bi<2?`1px solid ${BORDER}`:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,fontFamily:"inherit",color:TEXT_M,fontSize:10,transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=APP_BG;e.currentTarget.style.color=pal.bg;}}
                onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=TEXT_M;}}>
                <Icon name={icon} size={16} color="currentColor" sw={1.5}/>
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ─── 匯率換算小工具（雙向選單式，參考附圖）───
const RATE_CURRENCIES = [
  {code:"TWD",symbol:"NT$",name:"台幣"},
  {code:"USD",symbol:"$",  name:"美金"},
  {code:"JPY",symbol:"¥",  name:"日圓"},
  {code:"KRW",symbol:"₩",  name:"韓元"},
  {code:"EUR",symbol:"€",  name:"歐元"},
  {code:"GBP",symbol:"£",  name:"英鎊"},
  {code:"THB",symbol:"฿",  name:"泰銖"},
  {code:"SGD",symbol:"S$", name:"新幣"},
];

function ExchangeRateWidget({defaultCurrency="JPY"}){
  const [fromCode, setFromCode] = useState(defaultCurrency);
  const [toCode,   setToCode]   = useState("TWD");
  const [fromAmt,  setFromAmt]  = useState("1000");
  const [rates,    setRates]    = useState(null); // 以TWD為基準的原始率
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [updated,  setUpdated]  = useState(null);

  // 從 frankfurter 取得以 TWD 計的匯率
  const fetchRates = async () => {
    setLoading(true); setError(null);
    try {
      // 使用 exchangerate-api 免費版，以 TWD 為基準
      const res = await fetch("https://open.er-api.com/v6/latest/TWD");
      if(!res.ok) throw new Error();
      const data = await res.json();
      if(data.result !== "success") throw new Error();
      const r = data.rates;
      const clean = {
        TWD: 1,
        USD: r.USD, JPY: r.JPY, KRW: r.KRW,
        EUR: r.EUR, GBP: r.GBP, THB: r.THB, SGD: r.SGD
      };
      setRates(clean);
      setUpdated(new Date().toLocaleDateString("zh-TW"));
    } catch {
      // 備援固定匯率
      setRates({TWD:1,USD:0.031,JPY:5.03,KRW:42.5,EUR:0.029,GBP:0.025,THB:1.08,SGD:0.042});
      setUpdated("離線匯率");
    }
    setLoading(false);
  };

  useEffect(()=>{ fetchRates(); },[]);

  // rates = { TWD:1, USD:0.031, JPY:4.5, ... }（1 TWD = ? 各幣）
  const convert = (from, to, amt) => {
    if(!rates) return null;
    const n = parseFloat(amt)||0;
    // 先轉成 TWD，再轉到目標幣
    const inTWD  = from==="TWD" ? n : n / (rates[from]||1);
    const result = to==="TWD"   ? inTWD : inTWD * (rates[to]||1);
    return result;
  };

  const fmt = (val, code) => {
    if(val==null||isNaN(val)) return "—";
    if(code==="JPY"||code==="KRW") return Math.round(val).toLocaleString("zh-TW");
    return val.toLocaleString("zh-TW",{minimumFractionDigits:2,maximumFractionDigits:2});
  };

  const toAmt = convert(fromCode, toCode, fromAmt);
  const fromInfo = RATE_CURRENCIES.find(c=>c.code===fromCode);
  const toInfo   = RATE_CURRENCIES.find(c=>c.code===toCode);

  // 1 fromCode = ? toCode
  const rate1 = convert(fromCode, toCode, 1);

  // 交換方向
  const swap = () => { setFromCode(toCode); setToCode(fromCode); };

  const selStyle = {
    border:"none", background:"transparent", fontFamily:"inherit",
    fontSize:13, fontWeight:700, color:TEXT_D, outline:"none",
    cursor:"pointer", maxWidth:72,
  };

  return(
    <div style={{background:CARD_BG,borderRadius:16,padding:"12px 16px",marginBottom:14,boxShadow:"0 1px 6px rgba(0,0,0,.05)"}}>
      {/* 標題 */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:11,color:TEXT_M,display:"flex",alignItems:"center",gap:5}}>
          <Icon name="credit-card" size={13} color={TEXT_L} sw={1.5}/>
          <span style={{fontFamily:"Georgia,serif",fontStyle:"italic",letterSpacing:"0.04em"}}>Exchange Rate</span>
        </div>
        <button onClick={fetchRates} disabled={loading}
          style={{fontSize:10,color:loading?TEXT_L:TEXT_M,background:"none",border:"none",cursor:loading?"default":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:3,padding:0}}>
          <Icon name="refresh" size={11} color={loading?TEXT_L:TEXT_M} sw={1.5}/>
          {loading?"…":"更新"}
        </button>
      </div>

      {/* 雙向換算 */}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {/* 來源 */}
        <div style={{flex:1,background:APP_BG,borderRadius:12,padding:"10px 12px",border:`1px solid ${BORDER}`}}>
          <div style={{display:"flex",alignItems:"baseline",gap:3,marginBottom:4}}>
            <span style={{fontSize:11,color:TEXT_L}}>{fromInfo?.symbol}</span>
            <select value={fromCode} onChange={e=>setFromCode(e.target.value)}
              style={{border:"none",background:"transparent",fontFamily:"inherit",fontSize:11,fontWeight:700,color:TEXT_D,outline:"none",cursor:"pointer",padding:0}}>
              {RATE_CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
          <input type="number" value={fromAmt} onChange={e=>setFromAmt(e.target.value)} placeholder="0"
            style={{width:"100%",border:"none",background:"transparent",fontFamily:"Georgia,serif",fontSize:17,fontWeight:700,color:TEXT_D,outline:"none",padding:0}}/>
        </div>

        {/* 交換按鈕 */}
        <button onClick={swap}
          style={{flexShrink:0,width:26,height:26,borderRadius:"50%",background:APP_BG,border:`1px solid ${BORDER}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon name="arrow-right" size={12} color={TEXT_M} sw={2}/>
        </button>

        {/* 目標 */}
        <div style={{flex:1,background:APP_BG,borderRadius:12,padding:"10px 12px",border:`1px solid ${BORDER}`}}>
          <div style={{display:"flex",alignItems:"baseline",gap:3,marginBottom:4}}>
            <span style={{fontSize:11,color:TEXT_L}}>{toInfo?.symbol}</span>
            <select value={toCode} onChange={e=>setToCode(e.target.value)}
              style={{border:"none",background:"transparent",fontFamily:"inherit",fontSize:11,fontWeight:700,color:TEXT_D,outline:"none",cursor:"pointer",padding:0}}>
              {RATE_CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
          <div style={{fontFamily:"Georgia,serif",fontSize:17,fontWeight:700,color:loading?TEXT_L:TEXT_D,minHeight:22}}>
            {loading?"…":(error?"—":fmt(toAmt,toCode))}
          </div>
        </div>
      </div>

      {/* 匯率參考 */}
      <div style={{marginTop:8,fontSize:10,color:TEXT_L,fontFamily:"Georgia,serif",fontStyle:"italic",textAlign:"center"}}>
        {error&&!loading&&<span style={{color:"#B04A38"}}>{error}</span>}
        {rates&&!loading&&!error&&<span>1 {fromCode} ≈ {fmt(rate1,toCode)} {toCode}{updated&&` · ${updated}`}</span>}
        {loading&&<span>取得匯率中…</span>}
      </div>
    </div>
  );
}

// ─── 支出圖片（長按調整位置）───
function ExpensePhoto({photo, pos, onPosChange}){
  const [dragging, setDragging] = useState(false);
  const timerRef  = useRef(null);
  const startRef  = useRef(null);
  const activeRef = useRef(false);
  const divRef    = useRef(null);

  const p = pos||{x:50,y:50};

  // 用 useEffect 掛載 passive:false 的 touchmove，才能 preventDefault 阻止頁面滾動
  useEffect(()=>{
    const el = divRef.current;
    if(!el) return;
    const onTouchMove = e => {
      if(!activeRef.current) return;
      e.preventDefault();
      const t = e.touches[0];
      if(!startRef.current) return;
      const nx = Math.max(0,Math.min(100, startRef.current.posX - (t.clientX-startRef.current.clientX)/2));
      const ny = Math.max(0,Math.min(100, startRef.current.posY - (t.clientY-startRef.current.clientY)/2));
      onPosChange({x:nx, y:ny});
    };
    el.addEventListener("touchmove", onTouchMove, {passive:false});
    return ()=>el.removeEventListener("touchmove", onTouchMove);
  },[onPosChange]);

  const onPressStart = e => {
    const clientX = e.touches?e.touches[0].clientX:e.clientX;
    const clientY = e.touches?e.touches[0].clientY:e.clientY;
    startRef.current = {clientX, clientY, posX:p.x, posY:p.y};
    timerRef.current = setTimeout(()=>{
      activeRef.current = true;
      setDragging(true);
    }, 400);
  };

  const onMouseMove = e => {
    if(!activeRef.current||!startRef.current) return;
    const nx = Math.max(0,Math.min(100, startRef.current.posX - (e.clientX-startRef.current.clientX)/2));
    const ny = Math.max(0,Math.min(100, startRef.current.posY - (e.clientY-startRef.current.clientY)/2));
    onPosChange({x:nx, y:ny});
  };

  const onEnd = () => {
    clearTimeout(timerRef.current);
    activeRef.current = false;
    setDragging(false);
    startRef.current = null;
  };

  return(
    <div ref={divRef}
      style={{position:"relative",borderRadius:12,overflow:"hidden",height:120,marginBottom:10,userSelect:"none",WebkitUserSelect:"none",cursor:dragging?"grabbing":"default"}}
      onMouseDown={onPressStart} onMouseMove={onMouseMove} onMouseUp={onEnd} onMouseLeave={onEnd}
      onTouchStart={onPressStart} onTouchEnd={onEnd}>
      <img src={photo} alt="" draggable={false}
        style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:`${p.x}% ${p.y}%`,pointerEvents:"none"}}/>
      {dragging&&(
        <div style={{position:"absolute",inset:0,border:"2px solid rgba(255,255,255,.7)",borderRadius:12,pointerEvents:"none"}}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(0,0,0,.5)",borderRadius:10,padding:"5px 12px"}}>
            <span style={{fontSize:11,color:"#fff",fontFamily:"inherit"}}>拖曳調整位置</span>
          </div>
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────
function WalletTab({trip,onUpdate}){
  const expenses = trip.expenses||[];
  const companions= trip.companions||[];
  const currency = CURRENCIES.find(c=>c.code===trip.currency)||CURRENCIES[0];
  const pal = PALETTE[trip.paletteIdx??0];

  const [showForm,setShowForm]=useState(false);
  const [showSplit,setShowSplit]=useState(null); // expense obj
  const [showCompanion,setShowCompanion]=useState(false);
  const [editingExp,setEditingExp]=useState(null);

  // 記帳表單
  const [fAmount,setFAmount]=useState("");
  const [fCat,setFCat]=useState("food");
  const [fNote,setFNote]=useState("");
  const [fSplitWith,setFSplitWith]=useState([]);
  const [fPaidBy,setFPaidBy]=useState("");
  const [fCurr,setFCurr]=useState(trip.currency||"TWD");
  const [fPhoto,setFPhoto]=useState(null);
  const [fDate,setFDate]=useState("");
  const [fPayMethod,setFPayMethod]=useState("cash");
  const [fSplitMode,setFSplitMode]=useState("equal"); // equal | custom
  const [fCustomAmounts,setFCustomAmounts]=useState({}); // companionId → amount
  const photoRef=useRef();

  // 旅伴管理
  const [newName,setNewName]=useState("");

  const updateTrip=patch=>{const u={...trip,...patch};onUpdate(u);};

  const today=new Date().toISOString().slice(0,10);
  const openAdd=()=>{setEditingExp(null);setFAmount("");setFCat("food");setFNote("");setFSplitWith(companions.map(c=>c.id));setFPaidBy(companions[0]?.id||"");setFCurr(trip.currency||"TWD");setFPhoto(null);setFDate(today);setFPayMethod("cash");setFSplitMode("equal");setFCustomAmounts({});setShowForm(true);};
  const openEdit=ex=>{setEditingExp(ex);setFAmount(String(ex.amount));setFCat(ex.cat);setFNote(ex.note||"");setFSplitWith(ex.splitWith||[]);setFPaidBy(ex.paidBy||companions[0]?.id||"");setFCurr(ex.currency||trip.currency||"TWD");setFPhoto(ex.photo||null);setFDate(ex.date||today);setFPayMethod(ex.payMethod||"cash");setFSplitMode(ex.splitMode||"equal");setFCustomAmounts(ex.customAmounts||{});setShowForm(true);};

  const saveExp=()=>{
    if(!fAmount||isNaN(Number(fAmount))) return;
    const ex={id:editingExp?.id||genId(),amount:Number(fAmount),cat:fCat,note:fNote,currency:fCurr,splitWith:fSplitWith,paidBy:fPaidBy,payMethod:fPayMethod,splitMode:fSplitMode,customAmounts:fCustomAmounts,photo:fPhoto,date:fDate||today};
    let next;
    if(editingExp) next=expenses.map(e=>e.id===editingExp.id?ex:e);
    else next=[...expenses,ex];
    updateTrip({expenses:next});setShowForm(false);
  };
  const delExp=id=>updateTrip({expenses:expenses.filter(e=>e.id!==id)});

  const addCompanion=()=>{if(!newName.trim()||companions.length>=5)return;updateTrip({companions:[...companions,{id:genId(),name:newName.trim()}]});setNewName("");};
  const delCompanion=id=>updateTrip({companions:companions.filter(c=>c.id!==id)});
  const renameCompanion=(id,name)=>updateTrip({companions:companions.map(c=>c.id===id?{...c,name}:c)});

  const total=expenses.reduce((s,e)=>{
    if(e.currency===trip.currency) return s+e.amount;
    return s+e.amount;
  },0);

  const catLabel=id=>EXPENSE_CATS.find(c=>c.id===id)||{id:"other",label:"其他"};

  // ── 結算演算法（LightSplit 邏輯）──
  // paidBy: 付款人 companionId
  // splitWith: 所有分攤者（含付款人自己）
  // splitMode: "equal" | "custom"
  // customAmounts: { companionId: number } 每人應付金額
  const settlements = (() => {
    if(!companions.length) return [];
    const balance = {};
    companions.forEach(c=>{ balance[c.id]=0; });

    expenses.forEach(ex=>{
      if(!ex.paidBy||!ex.splitWith?.length) return;
      const paidBy=ex.paidBy;
      if(!balance.hasOwnProperty(paidBy)) return;

      if(ex.splitMode==="custom"&&ex.customAmounts){
        // 自訂：每人應付各自的金額，付款人收回
        ex.splitWith.forEach(cid=>{
          if(!balance.hasOwnProperty(cid)||cid===paidBy) return;
          const amt=ex.customAmounts[cid]||0;
          balance[paidBy]+=amt;   // 付款人收回
          balance[cid]-=amt;      // 分攤人欠款
        });
      } else {
        // 均攤：總金額 ÷ 所有分攤人員（含付款人）= 每人份額
        // 非付款人各欠付款人一份
        const allParticipants=ex.splitWith.filter(id=>balance.hasOwnProperty(id));
        if(!allParticipants.length) return;
        const perPerson=ex.amount/allParticipants.length;
        const nonPayers=allParticipants.filter(id=>id!==paidBy);
        nonPayers.forEach(cid=>{
          balance[paidBy]+=perPerson;  // 付款人收回
          balance[cid]-=perPerson;     // 非付款人欠款
        });
      }
    });

    const getName=id=>companions.find(c=>c.id===id)?.name||"未知";
    const C=[...companions.filter(c=>balance[c.id]>0.01).map(c=>({id:c.id,amt:balance[c.id]}))];
    const D=[...companions.filter(c=>balance[c.id]<-0.01).map(c=>({id:c.id,amt:-balance[c.id]}))];
    const txns=[];
    let ci=0,di=0;
    while(ci<C.length&&di<D.length){
      const pay=Math.min(C[ci].amt,D[di].amt);
      txns.push({from:getName(D[di].id),to:getName(C[ci].id),amount:pay});
      C[ci].amt-=pay; D[di].amt-=pay;
      if(C[ci].amt<0.01)ci++;
      if(D[di].amt<0.01)di++;
    }
    return txns;
  })();

  // 旅伴各自總花費（付款人的支出）
  // 各旅伴實際花費（攤提後每人真正支付的金額）
  const companionSpend = companions.map(c=>{
    let actual = 0;
    expenses.forEach(ex=>{
      // 沒有分攤人員：若付款人是此旅伴，全額算入
      if(!ex.splitWith?.length){
        if(ex.paidBy===c.id) actual+=ex.amount;
        return;
      }
      const participants = ex.splitWith.filter(id=>companions.find(comp=>comp.id===id));
      if(!participants.includes(c.id)) return;
      if(ex.splitMode==="custom"&&ex.customAmounts){
        if(ex.paidBy===c.id){
          const othersTotal=Object.entries(ex.customAmounts).filter(([id])=>id!==c.id).reduce((s,[,v])=>s+v,0);
          actual+=ex.amount-othersTotal;
        } else {
          actual+=ex.customAmounts[c.id]||0;
        }
      } else {
        const allParticipants=ex.splitWith.filter(id=>companions.find(comp=>comp.id===id));
        if(!allParticipants.includes(c.id)) return;
        actual+=ex.amount/allParticipants.length;
      }
    });
    return {...c, actual:Math.round(actual)};
  });

  // 依日期分組
  const byDate = (() => {
    const map = {};
    expenses.forEach(e=>{ const d=e.date||"未知日期"; if(!map[d])map[d]=[]; map[d].push(e); });
    return Object.entries(map).sort(([a],[b])=>b.localeCompare(a));
  })();

  const [collapsedDates, setCollapsedDates] = useState({});
  const toggleDate = d => setCollapsedDates(p=>({...p,[d]:!p[d]}));

  const hasSplitExpenses = expenses.some(e=>e.splitWith&&e.splitWith.length>0);
  const [showSettlement, setShowSettlement] = useState(false);
  const [showSpending,   setShowSpending]   = useState(false);

  // SVG 支付方式 icon（插畫風格）
  const PAY_SVG = {
    cash:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_M} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>,
    card:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_M} strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>,
    digital: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_M} strokeWidth="1.6" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="3"/><path d="M12 17h.01"/></svg>,
    transit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_M} strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="5" width="18" height="13" rx="2"/><path d="M3 10h18M8 17v2M16 17v2M7 8h10"/><circle cx="8" cy="14" r="1.2" fill={TEXT_M}/><circle cx="16" cy="14" r="1.2" fill={TEXT_M}/></svg>,
  };

  return(
    <div style={{padding:"16px 16px 0"}}>
      {/* 頂部總覽 */}
      <div style={{background:CARD_BG,borderRadius:20,padding:"18px 20px",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
        <div style={{fontSize:11,color:TEXT_L,letterSpacing:"0.08em",marginBottom:4}}>總支出</div>
        <div style={{fontFamily:"Georgia,serif",fontSize:28,fontWeight:700,color:TEXT_D}}>
          {currency.symbol}{total.toLocaleString()}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
          <button onClick={()=>setShowCompanion(true)}
            style={{display:"flex",alignItems:"center",gap:4,background:APP_BG,border:`1px solid ${BORDER}`,borderRadius:20,padding:"5px 10px",fontSize:10,color:TEXT_M,cursor:"pointer",fontFamily:"inherit"}}>
            <Icon name="users" size={11} color={TEXT_M}/> 旅伴 ({companions.length}/5)
          </button>
          <div style={{display:"flex",alignItems:"center",gap:4,background:APP_BG,border:`1px solid ${BORDER}`,borderRadius:20,padding:"5px 10px",fontSize:10,color:TEXT_M}}>
            <Icon name="credit-card" size={11} color={TEXT_M}/> {currency.name}
          </div>
          {companions.length>0&&(
            <button onClick={()=>setShowSpending(true)}
              style={{display:"flex",alignItems:"center",gap:4,background:APP_BG,border:`1px solid ${BORDER}`,borderRadius:20,padding:"5px 10px",fontSize:10,color:TEXT_M,cursor:"pointer",fontFamily:"inherit"}}>
              <Icon name="users" size={11} color={TEXT_M}/> 各自花費
            </button>
          )}
          {hasSplitExpenses&&companions.length>0&&(
            <button onClick={()=>setShowSettlement(true)}
              style={{display:"flex",alignItems:"center",gap:4,background:TEXT_D,border:"none",borderRadius:20,padding:"5px 10px",fontSize:10,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
              <Icon name="users" size={11} color="#fff"/> 查看結算
            </button>
          )}
        </div>
      </div>

      {/* 匯率換算 */}
      <ExchangeRateWidget defaultCurrency={trip.currency||"JPY"}/>

      {/* 記帳列表 */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,color:TEXT_D}}>明細</div>
        <button onClick={openAdd}
          style={{display:"flex",alignItems:"center",gap:4,background:pal.bg,color:"#fff",border:"none",borderRadius:20,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
          <Icon name="plus" size={14} color="#fff"/> 新增
        </button>
      </div>

      {expenses.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:TEXT_L,fontSize:13,fontStyle:"italic"}}>尚無記帳資料<br/><span style={{fontSize:11}}>點擊「新增」開始記帳</span></div>}

      {/* 依日期折疊分組 */}
      {byDate.map(([date, exList])=>{
        const collapsed = collapsedDates[date];
        const dayTotal = exList.reduce((s,e)=>s+e.amount,0);
        return(
          <div key={date} style={{marginBottom:12}}>
            {/* 日期標頭（可折疊）*/}
            <button onClick={()=>toggleDate(date)}
              style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:"6px 0",marginBottom:collapsed?0:6}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:pal.bg}}/>
                <span style={{fontSize:12,fontWeight:600,color:TEXT_M}}>{date}</span>
                <span style={{fontSize:11,color:TEXT_L}}>({exList.length} 筆)</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontFamily:"Georgia,serif",fontSize:12,fontWeight:700,color:TEXT_D}}>{currency.symbol}{dayTotal.toLocaleString()}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_L} strokeWidth="2" strokeLinecap="round">
                  {collapsed?<path d="M6 9l6 6 6-6"/>:<path d="M18 15l-6-6-6 6"/>}
                </svg>
              </div>
            </button>

            {/* 明細卡片（折疊時隱藏）*/}
            {!collapsed&&exList.map(ex=>{
              const cat=catLabel(ex.cat);
              const sym=CURRENCIES.find(c=>c.code===ex.currency)?.symbol||currency.symbol;
              const allParticipants=(ex.splitWith||[]).filter(id=>id); // splitWith 含付款人
              const hasSplit=allParticipants.length>0&&ex.paidBy;
              const nonPayers=allParticipants.filter(id=>id!==ex.paidBy);
              const eachAmt=hasSplit&&allParticipants.length>0
                ? Math.ceil(ex.amount/allParticipants.length).toLocaleString()
                : null;
              return(
                <div key={ex.id} style={{background:CARD_BG,borderRadius:16,padding:"12px 14px",marginBottom:8,boxShadow:"0 2px 6px rgba(0,0,0,.05)"}}>
                  {ex.photo&&(
                    <ExpensePhoto
                      photo={ex.photo}
                      pos={ex.photoPos}
                      onPosChange={newPos=>{
                        const updated=expenses.map(e=>e.id===ex.id?{...e,photoPos:newPos}:e);
                        updateTrip({expenses:updated});
                      }}
                    />
                  )}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
                      <div style={{width:40,height:40,borderRadius:12,background:APP_BG,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <CatIcon id={cat.id} size={22} color={TEXT_M}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:TEXT_D}}>{cat.label}{ex.note?` · ${ex.note}`:""}</div>
                        <div style={{fontSize:11,color:TEXT_L,marginTop:2,display:"flex",alignItems:"center",gap:5}}>
                          {PAY_SVG[ex.payMethod]&&<span style={{display:"flex",alignItems:"center"}}>{PAY_SVG[ex.payMethod]}</span>}
                          {ex.paidBy&&companions.find(c=>c.id===ex.paidBy)&&<span>{companions.find(c=>c.id===ex.paidBy).name}付款</span>}
                          {hasSplit&&nonPayers.length>0&&<span>· {nonPayers.length}人分攤</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                      {/* 無分帳時：編輯/刪除在金額左側 */}
                      {!hasSplit&&(
                        <div style={{display:"flex",gap:5}}>
                          <button onClick={()=>openEdit(ex)} style={{width:30,height:30,borderRadius:9,background:APP_BG,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <Icon name="pencil-sm" size={12} color={TEXT_M} sw={1.8}/>
                          </button>
                          <button onClick={()=>delExp(ex.id)} style={{width:30,height:30,borderRadius:9,background:"#F4EDEC",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <Icon name="trash" size={12} color="#B04A38"/>
                          </button>
                        </div>
                      )}
                      <div style={{textAlign:"right"}}>
                        <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:700,color:TEXT_D}}>{sym}{ex.amount.toLocaleString()}</div>
                        {hasSplit&&nonPayers.length>0&&<div style={{fontSize:11,color:TEXT_L}}>各 {sym}{eachAmt}</div>}
                      </div>
                    </div>
                  </div>
                  {/* 有分帳時：底部查看分帳 + 編輯/刪除 */}
                  {hasSplit&&(
                    <div style={{display:"flex",gap:8,marginTop:10}}>
                      <button onClick={()=>setShowSplit(ex)}
                        style={{flex:1,padding:"7px 0",borderRadius:10,background:APP_BG,border:`1px solid ${BORDER}`,fontSize:11,color:TEXT_M,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                        <Icon name="users" size={12} color={TEXT_M}/> 查看分帳
                      </button>
                      <button onClick={()=>openEdit(ex)} style={{width:34,height:34,borderRadius:10,background:APP_BG,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <Icon name="pencil-sm" size={13} color={TEXT_M} sw={1.8}/>
                      </button>
                      <button onClick={()=>delExp(ex.id)} style={{width:34,height:34,borderRadius:10,background:"#F4EDEC",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <Icon name="trash" size={13} color="#B04A38"/>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* 新增/編輯記帳 Sheet */}
      <BottomSheet show={showForm} onClose={()=>setShowForm(false)} title={editingExp?"編輯支出":"新增支出"} maxH="95vh">
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* 金額 */}
          <div>
            <label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:4,letterSpacing:"0.07em",textTransform:"uppercase"}}>金額</label>
            <div style={{display:"flex",gap:8}}>
              <select value={fCurr} onChange={e=>setFCurr(e.target.value)}
                style={{padding:"9px 10px",border:`1.5px solid ${BORDER}`,borderRadius:12,background:APP_BG,fontFamily:"inherit",fontSize:13,color:TEXT_D,outline:"none",cursor:"pointer"}}>
                {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
              </select>
              <input type="number" value={fAmount} onChange={e=>setFAmount(e.target.value)} placeholder="0"
                style={{flex:1,padding:"9px 12px",border:`1.5px solid ${BORDER}`,borderRadius:12,background:APP_BG,fontFamily:"Georgia,serif",fontSize:18,color:TEXT_D,outline:"none"}}/>
            </div>
          </div>
          {/* 類別（4×2 緊湊格）*/}
          <div>
            <label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:6,letterSpacing:"0.07em",textTransform:"uppercase"}}>類別</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
              {EXPENSE_CATS.map(c=>{
                const sel=fCat===c.id;
                return(
                  <button key={c.id} onClick={()=>setFCat(c.id)}
                    style={{padding:"8px 2px",borderRadius:12,background:sel?pal.bg:APP_BG,border:`1.5px solid ${sel?pal.bg:BORDER}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all .15s"}}>
                    <CatIcon id={c.id} size={18} color={sel?"#fff":TEXT_M}/>
                    <span style={{fontSize:9,color:sel?"#fff":TEXT_M,fontFamily:"inherit"}}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* 日期 + 支付方式 */}
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:"0 0 38%"}}>
              <label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:4,letterSpacing:"0.07em",textTransform:"uppercase"}}>日期</label>
              <div style={{position:"relative",height:40}}>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",border:`1.5px solid ${BORDER}`,borderRadius:12,background:APP_BG,fontSize:12,color:TEXT_D,pointerEvents:"none",zIndex:1}}>
                  {fDate?fDate.replace(/(\d{4})-(\d{2})-(\d{2})/,"$2/$3"):"選擇"}
                </div>
                <input type="date" value={fDate} onChange={e=>setFDate(e.target.value)}
                  style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0,cursor:"pointer",zIndex:2,fontSize:16}}/>
              </div>
            </div>
            <div style={{flex:1}}>
              <label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:4,letterSpacing:"0.07em",textTransform:"uppercase"}}>支付方式</label>
              <div style={{display:"flex",gap:5}}>
                {[
                  {id:"cash",   label:"現金",  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="3"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>},
                  {id:"card",   label:"信用卡", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>},
                  {id:"digital",label:"電子",  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="3"/><path d="M12 17h.01"/></svg>},
                  {id:"transit",label:"交通卡", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="5" width="18" height="13" rx="2"/><path d="M3 10h18M8 17v2M16 17v2"/><circle cx="8.5" cy="14" r="1" fill="currentColor"/><circle cx="15.5" cy="14" r="1" fill="currentColor"/></svg>},
                ].map(m=>{
                  const sel=fPayMethod===m.id;
                  return(
                    <button key={m.id} onClick={()=>setFPayMethod(m.id)}
                      style={{flex:1,height:40,borderRadius:12,background:sel?pal.bg:APP_BG,border:`1.5px solid ${sel?pal.bg:BORDER}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,color:sel?"#fff":TEXT_M,transition:"all .15s"}}>
                      {m.icon}
                      <span style={{fontSize:8,fontFamily:"inherit"}}>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {/* 備註 + 照片 並排 */}
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            <div style={{flex:1}}>
              <label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:4,letterSpacing:"0.07em",textTransform:"uppercase"}}>備註（選填）</label>
              <input value={fNote} onChange={e=>setFNote(e.target.value)} placeholder="咖啡廳、紀念品…"
                style={{width:"100%",padding:"9px 12px",border:`1.5px solid ${BORDER}`,borderRadius:12,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none"}}/>
            </div>
            <div>
              <input ref={photoRef} type="file" accept="image/*" onChange={async e=>{
                const f=e.target.files[0]; if(!f) return;
                // 立即預覽
                const r=new FileReader();
                r.onload=async ev=>{
                  setFPhoto(ev.target.result);
                  // 背景上傳替換
                  try{ setFPhoto(await uploadToCloudinary(f,fbAuth.currentUser?.uid)); }
                  catch{ /* 保留本地預覽 */ }
                };
                r.readAsDataURL(f);
              }} style={{display:"none"}}/>
              {fPhoto
                ? <div style={{position:"relative",width:40,height:40,borderRadius:12,overflow:"hidden"}}>
                    <img src={fPhoto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    <button onClick={()=>setFPhoto(null)} style={{position:"absolute",top:2,right:2,width:16,height:16,borderRadius:"50%",background:"rgba(0,0,0,.55)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <Icon name="x" size={8} color="#fff" sw={2.5}/>
                    </button>
                  </div>
                : <button onClick={()=>photoRef.current.click()}
                    style={{width:40,height:40,borderRadius:12,border:`1.5px dashed ${BORDER}`,background:APP_BG,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:TEXT_L}}>
                    <Icon name="camera" size={16} color={TEXT_L} sw={1.3}/>
                  </button>
              }
            </div>
          </div>
          {/* Paid By + 分攤人員 並排 */}
          {companions.length>0&&(
            <div style={{display:"flex",gap:10}}>
              <div style={{flex:1,minWidth:0}}>
                <label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:5,letterSpacing:"0.07em",textTransform:"uppercase"}}>付款人</label>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {companions.map(c=>(
                    <button key={c.id} onClick={()=>{setFPaidBy(c.id);if(!fSplitWith.includes(c.id))setFSplitWith(companions.map(x=>x.id));}}
                      style={{padding:"5px 10px",borderRadius:20,background:fPaidBy===c.id?pal.bg:APP_BG,border:`1.5px solid ${fPaidBy===c.id?pal.bg:BORDER}`,color:fPaidBy===c.id?"#fff":TEXT_M,fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <label style={{fontSize:10,color:TEXT_L,display:"block",marginBottom:5,letterSpacing:"0.07em",textTransform:"uppercase"}}>分攤人員</label>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {companions.map(c=>{
                    const checked=fSplitWith.includes(c.id);
                    return(
                      <button key={c.id} onClick={()=>setFSplitWith(checked?fSplitWith.filter(id=>id!==c.id):[...fSplitWith,c.id])}
                        style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:20,background:checked?pal.bg:APP_BG,border:`1.5px solid ${checked?pal.bg:BORDER}`,color:checked?"#fff":TEXT_M,fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                        {checked&&<svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2"><path d="M2 6l3 3 5-5"/></svg>}
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {/* Split 方式（2人以上才顯示）*/}
          {companions.length>0&&fSplitWith.length>1&&fAmount&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:6}}>
                {[{id:"equal",label:"均攤"},{id:"custom",label:"自訂金額"}].map(m=>{
                  const sel=fSplitMode===m.id;
                  return(
                    <button key={m.id} onClick={()=>setFSplitMode(m.id)}
                      style={{flex:1,padding:"6px 0",borderRadius:10,background:sel?pal.bg:APP_BG,border:`1.5px solid ${sel?pal.bg:BORDER}`,color:sel?"#fff":TEXT_M,fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                      {m.label}
                    </button>
                  );
                })}
              </div>
              {fSplitMode==="equal"&&(()=>{
                const allP=fSplitWith.filter(id=>companions.find(c=>c.id===id));
                const n=allP.length;
                const per=n?Math.ceil(Number(fAmount)/n):0;
                const sym=CURRENCIES.find(c=>c.code===fCurr)?.symbol||"";
                const nonPayers=allP.filter(id=>id!==fPaidBy);
                return <div style={{fontSize:11,color:TEXT_M,background:APP_BG,borderRadius:9,padding:"6px 10px"}}>
                  {sym}{per.toLocaleString()} × {n} 人均攤，{nonPayers.map(id=>companions.find(c=>c.id===id)?.name).join("、")}各付 {sym}{per.toLocaleString()}
                </div>;
              })()}
              {fSplitMode==="custom"&&(
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {fSplitWith.filter(cid=>cid!==fPaidBy).map(cid=>{
                    const comp=companions.find(c=>c.id===cid);
                    if(!comp) return null;
                    return(
                      <div key={cid} style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:11,color:TEXT_M,flex:1}}>{comp.name}</span>
                        <input type="number" value={fCustomAmounts[cid]||""} onChange={e=>setFCustomAmounts(p=>({...p,[cid]:Number(e.target.value)}))}
                          placeholder="0" style={{width:80,padding:"5px 8px",border:`1.5px solid ${BORDER}`,borderRadius:9,background:APP_BG,fontFamily:"Georgia,serif",fontSize:13,color:TEXT_D,outline:"none",textAlign:"right"}}/>
                        <span style={{fontSize:11,color:TEXT_L}}>{CURRENCIES.find(c=>c.code===fCurr)?.symbol}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <div style={{display:"flex",gap:12,marginTop:6}}>
            <button onClick={()=>setShowForm(false)} style={{flex:1,padding:"13px 0",borderRadius:16,border:`1.5px solid ${BORDER}`,color:TEXT_M,fontSize:14,background:"none",cursor:"pointer",fontFamily:"inherit"}}>取消</button>
            <button onClick={saveExp} style={{flex:1,padding:"13px 0",borderRadius:16,background:pal.bg,color:"#fff",fontSize:14,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit"}}>
              {editingExp?"儲存":"記帳"}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* 分帳詳情 */}
      <BottomSheet show={!!showSplit} onClose={()=>setShowSplit(null)} title="分帳明細">
        {showSplit&&(()=>{
          const sym=CURRENCIES.find(c=>c.code===showSplit.currency)?.symbol||currency.symbol;
          const payer=companions.find(c=>c.id===showSplit.paidBy)||{name:"付款人"};
          const allParticipants=(showSplit.splitWith||[]).map(id=>companions.find(c=>c.id===id)).filter(Boolean);
          const nonPayers=allParticipants.filter(c=>c.id!==showSplit.paidBy);
          const each=allParticipants.length>0?Math.ceil(showSplit.amount/allParticipants.length):showSplit.amount;
          return(
            <div>
              <div style={{background:APP_BG,borderRadius:14,padding:"12px 16px",marginBottom:14,textAlign:"center"}}>
                <div style={{fontSize:11,color:TEXT_L,marginBottom:4}}>總金額（共 {allParticipants.length} 人，每人 {sym}{each.toLocaleString()}）</div>
                <div style={{fontFamily:"Georgia,serif",fontSize:24,fontWeight:700,color:TEXT_D}}>{sym}{showSplit.amount.toLocaleString()}</div>
                <div style={{fontSize:12,color:TEXT_M,marginTop:4}}>{payer.name} 付款</div>
              </div>
              {/* 付款人自己的份 */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${BORDER}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:14,color:TEXT_D}}>{payer.name}</span>
                  <span style={{fontSize:10,background:TEXT_D,color:"#fff",borderRadius:10,padding:"2px 7px"}}>付款人</span>
                </div>
                <div style={{fontSize:13,color:TEXT_L,fontStyle:"italic"}}>自付 {sym}{each.toLocaleString()}</div>
              </div>
              {/* 非付款人各欠多少 */}
              {nonPayers.map(p=>(
                <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${BORDER}`}}>
                  <div style={{fontSize:14,color:TEXT_D}}>{p.name}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{fontFamily:"Georgia,serif",fontSize:16,fontWeight:600,color:TEXT_D}}>{sym}{each.toLocaleString()}</div>
                    <span style={{fontSize:10,color:TEXT_L}}>→ {payer.name}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </BottomSheet>

      {/* 分帳結算 */}
      <BottomSheet show={showSettlement} onClose={()=>setShowSettlement(false)} title="分帳結算">
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          {/* 說明 */}
          <div style={{fontSize:12,color:TEXT_M,marginBottom:16,lineHeight:1.7,background:APP_BG,borderRadius:12,padding:"10px 14px"}}>
            根據所有已分帳記錄自動計算，每位旅伴應付給你的總金額。
          </div>

          {settlements.length===0&&(
            <div style={{textAlign:"center",padding:"32px 0"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:10}}>
                <Icon name="check" size={32} color="#A8B8A8" sw={1.5}/>
              </div>
              <div style={{fontSize:13,color:TEXT_M,fontWeight:600}}>大家都結清了！</div>
              <div style={{fontSize:11,color:TEXT_L,marginTop:6}}>目前沒有未結清的分帳項目</div>
            </div>
          )}

          {settlements.map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderBottom:i<settlements.length-1?`1px solid ${BORDER}`:"none"}}>
              {/* 付款方 */}
              <div style={{width:36,height:36,borderRadius:11,background:APP_BG,border:`1px solid ${BORDER}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,color:TEXT_D,flexShrink:0}}>
                {s.from.slice(0,1)}
              </div>
              <div style={{flex:1}}>
                <span style={{fontSize:13,fontWeight:600,color:TEXT_D}}>{s.from}</span>
                <span style={{fontSize:12,color:TEXT_L,margin:"0 6px"}}>→</span>
                <span style={{fontSize:13,fontWeight:600,color:TEXT_D}}>{s.to}</span>
              </div>
              <div style={{fontFamily:"Georgia,serif",fontSize:17,fontWeight:700,color:TEXT_D,flexShrink:0}}>
                {currency.symbol}{Math.round(s.amount).toLocaleString()}
              </div>
            </div>
          ))}

          {/* 總計 */}
          {settlements.length>0&&(
            <div style={{marginTop:16,padding:"14px 16px",background:APP_BG,borderRadius:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:11,color:TEXT_L}}>所有旅伴應付總計</div>
                <div style={{fontSize:11,color:TEXT_L,marginTop:2}}>{settlements.length} 位旅伴</div>
              </div>
              <div style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,color:TEXT_D}}>
                {currency.symbol}{settlements.reduce((s,x)=>s+x.amount,0).toFixed(0).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </BottomSheet>
      <BottomSheet show={showSpending} onClose={()=>setShowSpending(false)} title="各自花費">
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          <div style={{fontSize:12,color:TEXT_M,marginBottom:16,lineHeight:1.7,background:APP_BG,borderRadius:12,padding:"10px 14px"}}>
            攤提後每人實際應負擔的金額（含自己付款的部分）。
          </div>
          {companionSpend.map((c,i)=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderBottom:i<companionSpend.length-1?`1px solid ${BORDER}`:"none"}}>
              <div style={{width:36,height:36,borderRadius:11,background:APP_BG,border:`1px solid ${BORDER}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,color:TEXT_D,flexShrink:0}}>
                {c.name.slice(0,1)}
              </div>
              <div style={{flex:1,fontSize:13,fontWeight:600,color:TEXT_D}}>{c.name}</div>
              <div style={{fontFamily:"Georgia,serif",fontSize:17,fontWeight:700,color:c.actual>0?TEXT_D:TEXT_L}}>
                {currency.symbol}{c.actual.toLocaleString()}
              </div>
            </div>
          ))}
          <div style={{marginTop:16,padding:"14px 16px",background:APP_BG,borderRadius:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:11,color:TEXT_L}}>合計</div>
            <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,color:TEXT_D}}>
              {currency.symbol}{companionSpend.reduce((s,c)=>s+c.actual,0).toLocaleString()}
            </div>
          </div>
        </div>
      </BottomSheet>
      <BottomSheet show={showCompanion} onClose={()=>setShowCompanion(false)} title="旅伴管理">
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{fontSize:11,color:TEXT_L}}>最多 5 位旅伴，名稱可點選修改</div>
          {companions.map(c=>(
            <CompanionRow key={c.id} companion={c}
              onRename={n=>renameCompanion(c.id,n)}
              onDelete={()=>delCompanion(c.id)}/>
          ))}
          {companions.length<5&&(
            <div style={{display:"flex",gap:8}}>
              <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="輸入旅伴名稱"
                onKeyDown={e=>e.key==="Enter"&&addCompanion()}
                style={{flex:1,padding:"11px 14px",border:`1.5px solid ${BORDER}`,borderRadius:14,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none"}}/>
              <button onClick={addCompanion}
                style={{width:48,borderRadius:14,background:pal.bg,color:"#fff",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon name="plus" size={18} color="#fff"/>
              </button>
            </div>
          )}
          <div style={{fontSize:11,color:TEXT_L,textAlign:"center"}}>{companions.length}/5 位旅伴</div>
        </div>
      </BottomSheet>
    </div>
  );
}

function CompanionRow({companion,onRename,onDelete}){
  const [ed,setEd]=useState(false),[nm,setNm]=useState(companion.name),ref=useRef();
  const ok=()=>{setEd(false);if(nm.trim())onRename(nm.trim());else setNm(companion.name);};
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,background:APP_BG,borderRadius:14,padding:"10px 14px"}}>
      <div style={{width:34,height:34,borderRadius:10,background:BORDER,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:TEXT_M,flexShrink:0}}>
        {companion.name.slice(0,1)}
      </div>
      {ed?<input ref={ref} value={nm} onChange={e=>setNm(e.target.value)} onBlur={ok} onKeyDown={e=>e.key==="Enter"&&ok()} autoFocus
        style={{flex:1,background:"transparent",border:"none",borderBottom:`1.5px solid #7A8286`,outline:"none",fontFamily:"inherit",fontSize:16,color:TEXT_D,padding:"2px 0"}}/>
        :<div onClick={()=>setEd(true)} style={{flex:1,fontSize:14,color:TEXT_D,cursor:"text"}}>{companion.name}</div>}
      <button onClick={onDelete} style={{width:30,height:30,borderRadius:8,background:"#F4EDEC",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon name="x" size={13} color="#B04A38"/>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TripFormSheet（新增 / 編輯旅程）
// ─────────────────────────────────────────────────────────────
function TripFormSheet({show,onClose,onSave,initialData}){
  const isEdit=!!initialData;
  const [name,setName]=useState(""),[subtitle,setSubtitle]=useState("");
  const [startDate,setStartDate]=useState(""),[endDate,setEndDate]=useState("");
  const [paletteIdx,setPaletteIdx]=useState(0),[coverImage,setCoverImage]=useState(null);
  const [currency,setCurrency]=useState("TWD"),[err,setErr]=useState("");
  const [tripType,setTripType]=useState("personal"); // "personal" | "shared"
  const [inviteCode]=useState(()=>Math.random().toString(36).substring(2,8).toUpperCase());

  useEffect(()=>{
    if(show){
      if(initialData){setName(initialData.name||"");setSubtitle(initialData.subtitle||"");setStartDate(initialData.startDate||"");setEndDate(initialData.endDate||"");setPaletteIdx(initialData.paletteIdx??0);setCoverImage(initialData.coverImage||null);setCurrency(initialData.currency||"TWD");setTripType(initialData.type||"personal");}
      else{setName("");setSubtitle("");setStartDate("");setEndDate("");setPaletteIdx(0);setCoverImage(null);setCurrency("TWD");setTripType("personal");}
      setErr("");
    }
  },[show,initialData]);

  const handleSave=()=>{
    if(!name.trim()){setErr("請輸入旅遊地點名稱");return;}
    if(!startDate){setErr("請選擇出發日期");return;}
    if(!endDate){setErr("請選擇回程日期");return;}
    if(parseLocalDate(startDate)>parseLocalDate(endDate)){setErr("回程日期必須晚於出發日期");return;}
    onSave({name:name.trim(),subtitle:subtitle.trim()||`${name.trim()} 之旅`,startDate,endDate,paletteIdx,coverImage,currency,type:tripType,inviteCode:tripType==="shared"?(initialData?.inviteCode||inviteCode):null});
  };
  if(!show) return null;
  return(
    <BottomSheet show={show} onClose={onClose} title={isEdit?"編輯旅程資訊":"新增旅遊地點"}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* 旅程類型 — 新增時可選；編輯時個人可升級為共享 */}
        {(!isEdit || initialData?.type==="personal") && (
          <div>
            <label style={{fontSize:11,color:TEXT_L,display:"block",marginBottom:8,letterSpacing:"0.07em",textTransform:"uppercase"}}>旅程類型</label>
            <div style={{display:"flex",gap:8}}>
              {[{id:"personal",label:"個人旅程",desc:"只有自己看得到"},{id:"shared",label:"共享旅程",desc:"可邀請朋友加入"}].map(t=>(
                <button key={t.id} onClick={()=>setTripType(t.id)}
                  style={{flex:1,padding:"10px 8px",borderRadius:14,background:tripType===t.id?APP_BG:"transparent",border:`1.5px solid ${tripType===t.id?"#5E6870":BORDER}`,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
                  <div style={{fontSize:12,fontWeight:600,color:tripType===t.id?TEXT_D:TEXT_L}}>{t.label}</div>
                  <div style={{fontSize:10,color:TEXT_L,marginTop:2}}>{t.desc}</div>
                </button>
              ))}
            </div>
            {tripType==="shared"&&(
              <div style={{marginTop:8,padding:"10px 14px",background:APP_BG,borderRadius:12,border:`1px solid ${BORDER}`}}>
                <div style={{fontSize:10,color:TEXT_L,marginBottom:4}}>邀請碼（建立後分享給朋友）</div>
                <div style={{fontSize:20,fontWeight:700,color:TEXT_D,letterSpacing:"0.15em"}}>{initialData?.inviteCode||inviteCode}</div>
              </div>
            )}
            {isEdit&&initialData?.type==="personal"&&tripType==="shared"&&(
              <div style={{marginTop:6,fontSize:11,color:"#B04A38",padding:"6px 10px",background:"#FDF0EE",borderRadius:8}}>
                轉換後無法改回個人旅程，朋友可透過邀請碼加入
              </div>
            )}
          </div>
        )}
        <Field label="旅遊地點名稱 *" value={name} onChange={setName} placeholder="例如：Tokyo、Paris、Bali"/>
        <Field label="副標題" value={subtitle} onChange={setSubtitle} placeholder="例如：日本東京 5 日遊"/>
        <div style={{display:"flex",gap:12}}>
          <div style={{flex:1}}>
            <label style={{fontSize:11,color:TEXT_L,display:"block",marginBottom:5,letterSpacing:"0.07em",textTransform:"uppercase"}}>出發日期 *</label>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}
              style={{width:"100%",padding:"11px 14px",border:`1.5px solid ${BORDER}`,borderRadius:14,background:APP_BG,fontFamily:"inherit",fontSize:14,color:startDate?TEXT_D:TEXT_L,outline:"none",boxSizing:"border-box",height:46,appearance:"none",WebkitAppearance:"none"}}/>
          </div>
          <div style={{flex:1}}>
            <label style={{fontSize:11,color:TEXT_L,display:"block",marginBottom:5,letterSpacing:"0.07em",textTransform:"uppercase"}}>回程日期 *</label>
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}
              style={{width:"100%",padding:"11px 14px",border:`1.5px solid ${BORDER}`,borderRadius:14,background:APP_BG,fontFamily:"inherit",fontSize:14,color:endDate?TEXT_D:TEXT_L,outline:"none",boxSizing:"border-box",height:46,appearance:"none",WebkitAppearance:"none"}}/>
          </div>
        </div>
        <div>
          <label style={{fontSize:11,color:TEXT_L,display:"block",marginBottom:8,letterSpacing:"0.07em",textTransform:"uppercase"}}>主要幣別</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {CURRENCIES.map(c=>(
              <button key={c.code} onClick={()=>setCurrency(c.code)}
                style={{padding:"7px 14px",borderRadius:20,background:currency===c.code?"#5E6870":APP_BG,border:`1.5px solid ${currency===c.code?"#5E6870":BORDER}`,color:currency===c.code?"#fff":TEXT_M,fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                {c.symbol} {c.name}
              </button>
            ))}
          </div>
        </div>
        <PalettePicker value={paletteIdx} onChange={setPaletteIdx}/>
        <CoverImagePicker value={coverImage} onChange={setCoverImage}/>
        {err&&<div style={{fontSize:12,color:"#B04A38",padding:"8px 12px",background:"#F8EEEC",borderRadius:10}}>{err}</div>}
        <div style={{display:"flex",gap:12,marginTop:6}}>
          <button onClick={onClose} style={{flex:1,padding:"13px 0",borderRadius:16,border:`1.5px solid ${BORDER}`,color:TEXT_M,fontSize:14,background:"none",cursor:"pointer",fontFamily:"inherit"}}>取消</button>
          <button onClick={handleSave} style={{flex:1,padding:"13px 0",borderRadius:16,background:PALETTE[paletteIdx]?.bg||"#5E6870",color:"#fff",fontSize:14,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit"}}>
            {isEdit?"儲存修改":"建立旅程"}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────
// TripListPage
// ─────────────────────────────────────────────────────────────
function TripListPage({trips,prefs,onSelect,onAdd,onDelete,onEditTrip,onUpdatePrefs,onReorder,user,onSignOut,onJoinTrip,onExport}){
  const [showInviteConfirm,setShowInviteConfirm]=useState(null);
  const [showJoin,setShowJoin]=useState(false);
  const [joinCode,setJoinCode]=useState("");
  const [joinError,setJoinError]=useState(null);
  const [joinLoading,setJoinLoading]=useState(false);
  const [delTarget,setDelTarget]=useState(null);
  const [editTarget,setEditTarget]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [leaveTarget,setLeaveTarget]=useState(null); // 要離開的共享旅程
  const today=new Date().toISOString().slice(0,10);
  const sorted=[...trips].sort((a,b)=>{
    if((a.sortOrder??999)!==(b.sortOrder??999)) return (a.sortOrder??999)-(b.sortOrder??999);
    const aExp=(a.endDate||"9999")<today, bExp=(b.endDate||"9999")<today;
    if(aExp!==bExp) return aExp?1:-1;
    return (a.startDate||"").localeCompare(b.startDate||"");
  });

  const handleJoin = async()=>{
    if(!joinCode.trim()) return;
    setJoinLoading(true); setJoinError(null);
    const err = await onJoinTrip(joinCode);
    setJoinLoading(false);
    if(err) setJoinError(err);
    else{ setShowJoin(false); setJoinCode(""); }
  };

  return(
    <div style={{minHeight:"100vh",background:APP_BG,fontFamily:`'Noto Serif TC','PingFang TC',serif`}}>
      <div style={{padding:"52px 24px 16px"}}>
        {/* 使用者資訊列 */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {user?.photoURL&&<img src={user.photoURL} alt="" style={{width:30,height:30,borderRadius:"50%",objectFit:"cover"}}/>}
            <div style={{fontSize:11,color:TEXT_L}}>{user?.displayName||user?.email||""}</div>
          </div>
          <button onClick={onSignOut} style={{fontSize:11,color:TEXT_L,background:"none",border:`1px solid ${BORDER}`,borderRadius:10,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit"}}>登出</button>
        </div>
        <EditableTitle value={prefs.journalLabel} onChange={v=>onUpdatePrefs({...prefs,journalLabel:v})}
          outerStyle={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,fontStyle:"italic",color:TEXT_M,marginBottom:2,letterSpacing:"0.01em"}}
          inputStyle={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,fontStyle:"italic",color:TEXT_M}} placeholder="My Travel Journal"/>
        <EditableTitle value={prefs.pageTitle} onChange={v=>onUpdatePrefs({...prefs,pageTitle:v})}
          outerStyle={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,fontStyle:"italic",color:TEXT_D}}
          inputStyle={{fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,fontStyle:"italic"}} placeholder="Have a nice trip"/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:5}}>
          <div style={{fontSize:13,color:TEXT_M}}>共 {trips.length} 段旅程</div>
          <button onClick={()=>setShowJoin(true)}
            style={{fontSize:11,color:TEXT_M,background:"none",border:`1px solid ${BORDER}`,borderRadius:10,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
            <Icon name="plus" size={11} color={TEXT_M}/> 加入共享旅程
          </button>
        </div>
      </div>

      {/* 加入共享旅程 Sheet */}
      <BottomSheet show={showJoin} onClose={()=>{setShowJoin(false);setJoinCode("");setJoinError(null);}} title="加入共享旅程">
        <div style={{display:"flex",flexDirection:"column",gap:12,paddingBottom:8}}>
          <div style={{fontSize:13,color:TEXT_M}}>輸入朋友提供的邀請碼，加入後即可共同編輯旅程。</div>
          <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
            placeholder="例如：ABC123"
            style={{padding:"12px 16px",border:`1.5px solid ${BORDER}`,borderRadius:14,background:APP_BG,fontFamily:"inherit",fontSize:20,color:TEXT_D,outline:"none",letterSpacing:"0.15em",textAlign:"center"}}/>
          {joinError&&<div style={{fontSize:12,color:"#B04A38",textAlign:"center"}}>{joinError}</div>}
          <button onClick={handleJoin} disabled={joinLoading||!joinCode.trim()}
            style={{width:"100%",padding:"13px 0",borderRadius:16,background:joinLoading||!joinCode.trim()?"#C0B4A8":"#2E2824",color:"#fff",fontSize:14,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit"}}>
            {joinLoading?"加入中…":"加入旅程"}
          </button>
        </div>
      </BottomSheet>

      <div style={{padding:"0 18px"}}>
        <SortableList items={sorted} onReorder={newOrder=>{
          const ids=newOrder.map(t=>t.id);
          onReorder([...trips].sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id)));
        }} renderItem={(trip,idx,isActive,gripProps)=>{
          const pal=PALETTE[trip.paletteIdx??0];
          const tot=trip.days.reduce((s,d)=>s+d.schedule.length,0);
          const expired=(trip.endDate||"9999")<today;
          const isShared=trip.type==="shared";
          return(
            <div style={{marginBottom:14,borderRadius:24,overflow:"hidden",boxShadow:isActive?"0 10px 36px rgba(0,0,0,.2)":"0 4px 22px rgba(40,32,28,.13)",opacity:isActive?.9:1,filter:expired?"grayscale(0.3)":"none",transition:"opacity .15s"}}>
              <div onClick={()=>onSelect(trip.id)} style={{position:"relative",background:pal.bg,padding:"22px 22px 18px",cursor:"pointer",overflow:"hidden",minHeight:130}}>
                {trip.coverImage&&<div style={{position:"absolute",inset:0}}><img src={typeof trip.coverImage==="object"?trip.coverImage.url:trip.coverImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:`${typeof trip.coverImage==="object"?(trip.coverImage.posX??50):50}% ${typeof trip.coverImage==="object"?(trip.coverImage.posY??50):50}%`}}/><div style={{position:"absolute",inset:0,background:`linear-gradient(135deg,${pal.bg}E8 0%,${pal.bg}70 100%)`}}/></div>}
                {expired&&<div style={{position:"absolute",top:12,left:14,background:"rgba(0,0,0,.32)",borderRadius:10,padding:"2px 8px",fontSize:9,color:"rgba(255,255,255,.8)",letterSpacing:"0.06em",zIndex:2}}>已結束</div>}
                {isShared&&<div style={{position:"absolute",top:12,left:expired?60:14,background:"rgba(255,255,255,.25)",borderRadius:10,padding:"2px 8px",fontSize:9,color:"rgba(255,255,255,.95)",letterSpacing:"0.06em",zIndex:2,display:"flex",alignItems:"center",gap:3}}>
                  <Icon name="users" size={9} color="rgba(255,255,255,.95)"/> 共享
                </div>}
                <button onClick={e=>{e.stopPropagation();setEditTarget(trip);}}
                  style={{position:"absolute",top:14,right:14,width:34,height:34,borderRadius:10,background:"rgba(255,255,255,.20)",border:"1.5px solid rgba(255,255,255,.35)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:2}}>
                  <Icon name="pencil-sm" size={15} color={pal.fg} sw={1.8}/>
                </button>
                <div style={{position:"relative"}}>
                  <div style={{fontSize:10,color:"rgba(255,255,255,.75)",letterSpacing:"0.12em",marginBottom:3}}>{trip.startDate} → {trip.endDate}</div>
                  <div style={{fontFamily:"Georgia,serif",fontSize:26,fontWeight:700,color:pal.fg,lineHeight:1.1}}>{trip.name}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,.80)",marginTop:3}}>{trip.subtitle}</div>
                  <div style={{display:"flex",gap:14,marginTop:14}}>
                    {[{icon:"calendar",val:`${trip.days.length} 天`},{icon:"clock",val:`${tot} 行程`}].map(({icon,val})=>(
                      <div key={icon} style={{display:"flex",alignItems:"center",gap:5,color:"rgba(255,255,255,.80)"}}>
                        <Icon name={icon} size={12} color="rgba(255,255,255,.80)" sw={1.8}/><span style={{fontSize:11}}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{background:CARD_BG,display:"flex",alignItems:"center",padding:"10px 14px"}}>
                <button onClick={()=>onSelect(trip.id)} style={{flex:1,display:"flex",alignItems:"center",gap:6,color:TEXT_D,fontSize:13,fontWeight:600,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>
                  <Icon name="arrow-right" size={15} color={pal.bg}/> 查看行程
                </button>
                {/* 匯出 PDF 按鈕 */}
                <button onClick={e=>{e.stopPropagation();onExport&&onExport(trip.id);}}
                  title="匯出旅遊日記"
                  style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:10,background:APP_BG,border:"none",cursor:"pointer",marginRight:4}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={TEXT_M} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"/>
                  </svg>
                </button>
                <div {...gripProps} onClick={e=>e.stopPropagation()} style={{...(gripProps?.style),width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",marginRight:4,borderRadius:10,background:isActive?`${pal.bg}20`:APP_BG}}>
                  <Icon name="grip" size={18} color={isActive?pal.bg:BORDER}/>
                </div>
                <button onClick={()=>{
                  const isSharedWithOthers = trip.type==="shared" && (trip.members||[]).length>1;
                  if(isSharedWithOthers) setLeaveTarget(trip);
                  else setDelTarget(trip.id);
                }} style={{width:34,height:34,borderRadius:10,background:"#F4EDEC",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {trip.type==="shared"&&(trip.members||[]).length>1
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B04A38" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    : <Icon name="trash" size={15} color="#B04A38" sw={1.5}/>
                  }
                </button>
              </div>
            </div>
          );
        }}/>
        <div style={{marginBottom:14,borderRadius:24,overflow:"hidden",boxShadow:`0 2px 10px rgba(40,32,28,.08)`}}>
          <button onClick={()=>setShowAdd(true)}
            style={{width:"100%",borderRadius:24,border:`2px dashed ${BORDER}`,background:"transparent",padding:"48px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:10,cursor:"pointer",transition:"all .2s",fontFamily:"inherit"}}
            onMouseEnter={e=>e.currentTarget.style.background=CARD_BG} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{width:44,height:44,borderRadius:"50%",background:BORDER,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="plus" size={22} color={TEXT_M}/></div>
            <span style={{fontSize:13,color:TEXT_M}}>新增旅遊地點</span>
          </button>
        </div>
      </div>
      <div style={{height:40}}/>
      <Dialog show={!!delTarget} icon={<Icon name="trash" size={28}/>} title="刪除這段旅程？" desc="刪除後將無法復原，所有行程資料也會一併清除。"
        onConfirm={()=>{onDelete(delTarget);setDelTarget(null);}} onCancel={()=>setDelTarget(null)} confirmLabel="確認刪除" danger/>
      <Dialog show={!!leaveTarget} icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B04A38" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>}
        title={"離開「"+(leaveTarget?.name||"")+"」？"}
        desc="離開後將無法看到此旅程，需要重新輸入邀請碼才能加入。"
        onConfirm={async()=>{
          if(!leaveTarget?._docId) return;
          const newMembers=(leaveTarget.members||[]).filter(uid=>uid!==user?.uid);
          await updateDoc(doc(fbDb,"trips",leaveTarget._docId),{members:newMembers}).catch(()=>{});
          setLeaveTarget(null);
        }}
        onCancel={()=>setLeaveTarget(null)} confirmLabel="確認離開" danger/>
      <TripFormSheet show={!!editTarget} onClose={()=>setEditTarget(null)} initialData={editTarget} onSave={data=>{onEditTrip(editTarget.id,data);setEditTarget(null);}}/>
      <TripFormSheet show={showAdd} onClose={()=>setShowAdd(false)} initialData={null} onSave={data=>{
        onAdd(data);
        setShowAdd(false);
        if(data.type==="shared"&&data.inviteCode) setShowInviteConfirm(data.inviteCode);
      }}/>

      {/* 共享旅程建立成功 — 邀請碼確認 */}
      <BottomSheet show={!!showInviteConfirm} onClose={()=>setShowInviteConfirm(null)} title="共享旅程已建立 🎉">
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,padding:"8px 0 16px"}}>
          <div style={{fontSize:13,color:TEXT_M,textAlign:"center"}}>把邀請碼分享給朋友，他們輸入後即可加入旅程</div>
          <div style={{background:APP_BG,borderRadius:20,padding:"20px 32px",textAlign:"center",border:`1.5px solid ${BORDER}`}}>
            <div style={{fontSize:11,color:TEXT_L,marginBottom:8,letterSpacing:"0.08em"}}>邀請碼</div>
            <div style={{fontFamily:"Georgia,serif",fontSize:32,fontWeight:700,color:TEXT_D,letterSpacing:"0.2em"}}>{showInviteConfirm}</div>
          </div>
          <button onClick={()=>{
            navigator.clipboard?.writeText(showInviteConfirm);
          }} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 20px",borderRadius:14,background:CARD_BG,border:`1.5px solid ${BORDER}`,cursor:"pointer",fontFamily:"inherit",fontSize:13,color:TEXT_M}}>
            <Icon name="copy" size={14} color={TEXT_M}/> 複製邀請碼
          </button>
          <button onClick={()=>setShowInviteConfirm(null)}
            style={{width:"100%",padding:"13px 0",borderRadius:16,background:"#2E2824",color:"#fff",fontSize:14,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit"}}>
            開始規劃行程
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TripDetailPage
// ─────────────────────────────────────────────────────────────
// ─── 行程間交通條 ───
const TRANSIT_COLORS = {walk:"#7A9A7A",metro:"#5E7A9A",bus:"#9A7A5E",taxi:"#9A8A5E",flight:"#7A5E9A"};

const TRANSIT_ART = {
  walk:   c=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="4.5" r="1.8" fill={c} stroke="none"/><path d="M10 8.5l-1.5 5h3l-1 5"/><path d="M14 8.5l1 4-2 1"/><path d="M8.5 13.5l-1.5 4.5"/></svg>,
  metro:  c=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeLinecap="round"><rect x="5" y="3" width="14" height="15" rx="3.5" fill={`${c}20`} stroke={c} strokeWidth="1.7"/><path d="M5 10h14" stroke={c} strokeWidth="1.5"/><circle cx="9" cy="14" r="1.4" fill={c}/><circle cx="15" cy="14" r="1.4" fill={c}/><path d="M8 18l-1 2.5M16 18l1 2.5" stroke={c} strokeWidth="1.5"/></svg>,
  bus:    c=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeLinecap="round"><rect x="3" y="4" width="18" height="14" rx="3" fill={`${c}20`} stroke={c} strokeWidth="1.7"/><path d="M3 10h18" stroke={c} strokeWidth="1.5"/><circle cx="8" cy="16" r="1.6" fill={c}/><circle cx="16" cy="16" r="1.6" fill={c}/></svg>,
  taxi:   c=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17H2a1 1 0 01-1-1v-4l3-6h16l3 6v4a1 1 0 01-1 1h-2" fill={`${c}20`} stroke={c} strokeWidth="1.7"/><circle cx="7" cy="17.5" r="1.8" fill={c}/><circle cx="17" cy="17.5" r="1.8" fill={c}/><path d="M10 6l1-3h2l1 3" stroke={c} strokeWidth="1.5"/></svg>,
  flight: c=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill={`${c}20`}/></svg>,
};

function TransitBar({from,fromUrl,to,toUrl,pal}){
  if(!from||!to||from==="未定地點"||to==="未定地點") return null;

  const isKorean = (str)=> /[\uAC00-\uD7AF\u1100-\u11FF]/.test(str||"");
  const useNaver = isKorean(from)||isKorean(to)||(toUrl&&toUrl.includes("naver"))||(fromUrl&&fromUrl.includes("naver"));

  const mapsUrl = useNaver
    ? `https://m.map.naver.com/transit/routes?sx=&sy=&ex=&ey=&sname=${encodeURIComponent(from)}&ename=${encodeURIComponent(to)}`
    : `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=transit`;

  const color = useNaver ? "#03C75A" : TRANSIT_COLORS["metro"];

  return(
    <button onClick={()=>window.open(mapsUrl,"_blank")}
      style={{display:"flex",alignItems:"center",gap:6,margin:"0 0 0 18px",padding:"4px 12px 4px 8px",background:"none",border:`1px solid ${color}40`,borderRadius:20,cursor:"pointer",fontFamily:"inherit"}}>
      <div style={{width:1,height:16,background:BORDER,flexShrink:0}}/>
      <span style={{display:"flex",alignItems:"center"}}>
        {useNaver
          ? <svg width="13" height="13" viewBox="0 0 24 24" fill={color}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          : TRANSIT_ART["metro"]?.(color)
        }
      </span>
      <span style={{fontSize:11,fontWeight:600,color,letterSpacing:"0.02em"}}>查看路線</span>
      <Icon name="external-link" size={9} color={TEXT_L} sw={1.5}/>
    </button>
  );
}

// ─── PDF 匯出頁面 ───
function TripExportView({trip, pal, onClose, bookmarks=[]}){
  const flights   = trip.flights||[];
  const expenses  = trip.expenses||[];
  const companions= trip.companions||[];

  const totalByCat = {};
  expenses.forEach(e=>{ totalByCat[e.cat]=(totalByCat[e.cat]||0)+parseFloat(e.amount||0); });
  const grandTotal = expenses.reduce((s,e)=>s+parseFloat(e.amount||0),0);

  // 各自應負擔金額（依分攤比例）
  const burdenList = (() => {
    if(!companions.length) return [];
    const burden={};
    companions.forEach(c=>{burden[c.id]={name:c.name||"?",total:0};});
    expenses.forEach(ex=>{
      const amt=parseFloat(ex.amount||0);
      if(!ex.splitWith?.length) return;
      const sw=(ex.splitWith||[]).filter(id=>burden[id]);
      if(!sw.length) return;
      if(ex.splitMode==="custom"&&ex.customAmounts){
        sw.forEach(cid=>{ if(burden[cid]) burden[cid].total+=parseFloat(ex.customAmounts?.[cid]||0); });
      } else {
        const per=amt/sw.length;
        sw.forEach(cid=>{ if(burden[cid]) burden[cid].total+=per; });
      }
    });
    return Object.values(burden).filter(p=>p.total>0.01).sort((a,b)=>b.total-a.total);
  })();

  // 結算計算（同 WalletTab 邏輯）
  const settlements = (()=>{
    if(!companions.length) return [];
    const balance={};
    companions.forEach(c=>{balance[c.id]=0;});
    expenses.forEach(ex=>{
      if(!ex.paidBy||!ex.splitWith?.length) return;
      if(!balance.hasOwnProperty(ex.paidBy)) return;
      if(ex.splitMode==="custom"&&ex.customAmounts){
        ex.splitWith.forEach(cid=>{
          if(!balance.hasOwnProperty(cid)||cid===ex.paidBy) return;
          const amt=ex.customAmounts[cid]||0;
          balance[ex.paidBy]+=amt; balance[cid]-=amt;
        });
      } else {
        const all=ex.splitWith.filter(id=>balance.hasOwnProperty(id));
        if(!all.length) return;
        const per=ex.amount/all.length;
        all.filter(id=>id!==ex.paidBy).forEach(cid=>{
          balance[ex.paidBy]+=per; balance[cid]-=per;
        });
      }
    });
    const getName=id=>companions.find(c=>c.id===id)?.name||"?";
    const C=companions.filter(c=>balance[c.id]>0.01).map(c=>({id:c.id,amt:balance[c.id]}));
    const D=companions.filter(c=>balance[c.id]<-0.01).map(c=>({id:c.id,amt:-balance[c.id]}));
    const txns=[]; let ci=0,di=0;
    while(ci<C.length&&di<D.length){
      const pay=Math.min(C[ci].amt,D[di].amt);
      txns.push({from:getName(D[di].id),to:getName(C[ci].id),amount:pay});
      C[ci].amt-=pay; D[di].amt-=pay;
      if(C[ci].amt<0.01)ci++; if(D[di].amt<0.01)di++;
    }
    return txns;
  })();

  const FTYPE_LABEL={depart:"去程",transit:"轉機",return:"回程"};
  const SPOT_CATS_MAP=Object.fromEntries(SPOT_CATS.map(c=>[c.id,c.label]));
  const EXPENSE_CAT_LABEL=Object.fromEntries(EXPENSE_CATS.map(c=>[c.id,c.label]));

  const handleSave=async()=>{
    const content=document.getElementById("export-content");
    if(!content) return;
    try{
      const html=`<!DOCTYPE html><html><head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <title>${trip.name} 旅遊日記</title>
        <style>
          *{box-sizing:border-box;margin:0;padding:0;}
          body{font-family:'Noto Serif TC',serif;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
          @media print{.no-print{display:none!important;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}}
          @page{margin:8mm;size:A4;}
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&display=swap" rel="stylesheet"/>
      </head><body>${content.innerHTML}</body></html>`;
      const blob=new Blob([html],{type:"text/html;charset=utf-8"});
      const url=URL.createObjectURL(blob);
      const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
      if(isIOS){
        window.open(url,"_blank");
      } else {
        const a=document.createElement("a");
        a.href=url; a.download=trip.name+"_旅遊日記.html";
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        setTimeout(()=>URL.revokeObjectURL(url),1000);
      }
    } catch(err){
      alert("匯出失敗："+err.message);
    }
  };

  const handlePrint=()=>{
    try{
      const isSafari=/^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if(isSafari){ handleSave(); }
      else{ setTimeout(()=>window.print(),100); }
    } catch(err){
      alert("列印失敗："+err.message);
    }
  };

  return(
    <div style={{fontFamily:`'Noto Serif TC','PingFang TC',serif`,background:"#fff",minHeight:"100vh"}}>
      <style>{`
        @media print{
          .no-print{display:none!important;}
          body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
          .page-break{page-break-before:always;}
          *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
          img{max-width:100%!important;}
        }
        @media screen{.export-wrap{max-width:960px;margin:0 auto;padding:0 0 80px;}} @media print{@page{margin:8mm;size:A4;}}
      `}</style>

      {/* 操作列 */}
      <div className="no-print" style={{position:"sticky",top:0,zIndex:99,background:"#fff",borderBottom:"1px solid #E8E4E0",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
        <button onClick={onClose} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#6A6058",fontFamily:"inherit",flexShrink:0}}>
          <Icon name="chevron-left" size={15} color="#6A6058"/> 返回
        </button>
        <div style={{fontSize:12,fontWeight:600,color:"#2E2824",textAlign:"center",flex:1}}>{trip.name}</div>
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          <button onClick={handlePrint}
            style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:12,background:APP_BG,border:`1.5px solid ${BORDER}`,cursor:"pointer",fontFamily:"inherit",fontSize:12,color:TEXT_M}}>
            {/* 列印插畫 icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="2" width="12" height="8" rx="1.5" stroke={TEXT_M} fill={BORDER+"60"}/>
              <rect x="4" y="8" width="16" height="10" rx="2" stroke={TEXT_M} fill={APP_BG}/>
              <rect x="7" y="15" width="10" height="7" rx="1" stroke={TEXT_M} fill={BORDER+"40"}/>
              <circle cx="17" cy="12" r="1.2" fill={TEXT_M}/>
            </svg>
            列印 / PDF
          </button>
          <button onClick={handleSave}
            style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:12,background:pal.bg,color:pal.fg,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>
            {/* 下載插畫 icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke={pal.fg}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="rgba(255,255,255,.25)" stroke={pal.fg}/>
              <path d="M14 2v6h6"/>
              <path d="M12 11v6M9 14l3 3 3-3"/>
            </svg>
            {/iPad|iPhone|iPod/.test(typeof navigator!=="undefined"?navigator.userAgent:"")?"開啟預覽":"下載"}
          </button>
        </div>
      </div>

      <div className="export-wrap" id="export-content">

        {/* ── 封面（獨立一頁）── */}
        <div style={{position:"relative",minHeight:"100vh",background:pal.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden",WebkitPrintColorAdjust:"exact",printColorAdjust:"exact",pageBreakAfter:"always",breakAfter:"page"}}>
          {trip.coverImage&&<img crossOrigin="anonymous" src={typeof trip.coverImage==="object"?trip.coverImage.url:trip.coverImage} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:`${typeof trip.coverImage==="object"?(trip.coverImage.posX??50):50}% ${typeof trip.coverImage==="object"?(trip.coverImage.posY??50):50}%`}}/>}
          <div style={{position:"absolute",inset:0,background:`linear-gradient(180deg,${pal.bg}88 0%,${pal.bg}EE 100%)`,WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"}}/>
          <div style={{position:"relative",textAlign:"center",padding:"0 40px"}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:52,fontWeight:700,color:pal.fg,lineHeight:1.2,marginBottom:12}}>{trip.name}</div>
            {trip.subtitle&&<div style={{fontSize:18,color:"rgba(255,255,255,.9)",marginBottom:16}}>{trip.subtitle}</div>}
            <div style={{width:60,height:2,background:"rgba(255,255,255,.4)",margin:"0 auto 16px",WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"}}/>
            <div style={{fontSize:14,color:"rgba(255,255,255,.85)",letterSpacing:"0.12em"}}>{trip.startDate} → {trip.endDate}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.65)",marginTop:8}}>{trip.days?.length||0} 天 · {trip.days?.reduce((s,d)=>s+d.schedule.length,0)||0} 個行程</div>
          </div>
        </div>

        {/* ── 航班 ── */}
        {flights.length>0&&(
          <div style={{padding:"36px 32px 0"}}>
            <SectionTitle color={pal.bg}>航班資訊</SectionTitle>
            {flights.map((f,i)=>(
              <div key={i} style={{background:"#F8F7F5",borderRadius:14,padding:"14px 18px",marginBottom:10,borderLeft:`4px solid ${pal.bg}`,WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{background:pal.bg,color:pal.fg,fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:8,WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"}}>{FTYPE_LABEL[f.type]||f.type}</span>
                    <span style={{fontFamily:"Georgia,serif",fontSize:18,fontWeight:700,color:"#2E2824"}}>{f.code}</span>
                  </div>
                  <span style={{fontSize:13,color:"#6A6058"}}>{f.from} → {f.to}</span>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"4px 16px",fontSize:12,color:"#6A6058"}}>
                  {f.depDate&&<span>出發：{f.depDate} {f.depTime}</span>}
                  {f.arrDate&&<span>抵達：{f.arrDate} {f.arrTime}</span>}
                  {f.terminal&&<span>航廈：{f.terminal}</span>}
                  {f.seat&&<span>{f.seat}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 每日行程（每天強制新頁）── */}
        {(trip.days||[]).map((day,di)=>(
          <div key={di} style={{padding:"36px 32px 24px",pageBreakBefore:"always",breakBefore:"page",minHeight:"50vh"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
              <div style={{width:5,height:32,background:pal.bg,borderRadius:3,WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"}}/>
              <div>
                <div style={{fontFamily:"Georgia,serif",fontSize:26,fontWeight:700,color:"#2E2824"}}>Day {day.dateNumber}</div>
                <div style={{fontSize:13,color:"#A09890"}}>{day.fullDate} {day.weekDay}</div>
              </div>
            </div>
            {day.schedule.length===0&&<div style={{fontSize:13,color:"#A09890",fontStyle:"italic"}}>無行程安排</div>}
            {day.schedule.map((ev,ei)=>(
              <div key={ei} style={{marginBottom:24,paddingBottom:24,borderBottom:ei<day.schedule.length-1?"1px solid #EEE":"none"}}>
                <div style={{display:"flex",gap:16}}>
                  <div style={{width:56,flexShrink:0,textAlign:"right",paddingTop:2}}>
                    <div style={{fontSize:13,fontWeight:700,color:pal.bg}}>{ev.time}</div>
                    {ev.duration&&<div style={{fontSize:10,color:"#A09890",marginTop:2}}>{ev.duration}</div>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:16,fontWeight:700,color:"#2E2824",marginBottom:5}}>{ev.title}</div>
                    {ev.location&&ev.location!=="未定地點"&&(
                      <div style={{fontSize:12,color:"#6A6058",marginBottom:8,display:"flex",alignItems:"center",gap:4}}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill={pal.bg}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        {ev.location}
                      </div>
                    )}
                    {ev.content&&<div style={{fontSize:13,color:"#6A6058",lineHeight:1.8,whiteSpace:"pre-wrap",marginBottom:ev.images?.length?12:0}}>{ev.content}</div>}
                    {ev.images&&ev.images.length>0&&(
                      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                        {ev.images.slice(0,5).map((src,ii)=>(
                          <img crossOrigin="anonymous" key={ii} src={src} alt="" style={{width:150,height:150,objectFit:"cover",borderRadius:12}}/>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* ── 口袋名單 ── */}
        {bookmarks.length>0&&(
          <div style={{padding:"36px 32px 0",pageBreakBefore:"always",breakBefore:"page"}}>
            <SectionTitle color={pal.bg}>口袋名單</SectionTitle>
            {bookmarks.map((b,bi)=>(
              <div key={bi} style={{marginBottom:18,paddingBottom:18,borderBottom:bi<bookmarks.length-1?"1px solid #EEE":"none"}}>
                <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                  {b.images&&b.images[0]&&(
                    <img crossOrigin="anonymous" src={b.images[0]} alt="" style={{width:110,height:110,objectFit:"cover",borderRadius:12,flexShrink:0}}/>
                  )}
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                      <span style={{fontSize:15,fontWeight:700,color:"#2E2824"}}>{b.name}</span>
                      <span style={{fontSize:10,color:pal.bg,background:pal.bg+"20",padding:"2px 8px",borderRadius:6,WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"}}>{SPOT_CATS_MAP[b.cat]||b.cat}</span>
                    </div>
                    {b.addr&&<div style={{fontSize:12,color:"#6A6058",marginBottom:5}}>{b.addr}</div>}
                    {b.note&&<div style={{fontSize:12,color:"#6A6058",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{b.note}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 記帳總結 ── */}
        {expenses.length>0&&(
          <div style={{padding:"36px 32px 0",pageBreakBefore:"always",breakBefore:"page"}}>
            <SectionTitle color={pal.bg}>記帳總結</SectionTitle>
            <div style={{background:"#F8F7F5",borderRadius:16,padding:"20px 24px",marginBottom:24,textAlign:"center",WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"}}>
              <div style={{fontSize:11,color:"#A09890",marginBottom:4}}>總花費</div>
              <div style={{fontFamily:"Georgia,serif",fontSize:36,fontWeight:700,color:pal.bg}}>{trip.currency} {grandTotal.toLocaleString()}</div>
              <div style={{fontSize:11,color:"#A09890",marginTop:4}}>{expenses.length} 筆消費</div>
            </div>
            <div style={{marginBottom:24}}>
              {Object.entries(totalByCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>{
                const pct=grandTotal>0?Math.round(amt/grandTotal*100):0;
                return(
                  <div key={cat} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:13,color:"#2E2824"}}>{EXPENSE_CAT_LABEL[cat]||cat}</span>
                      <span style={{fontSize:13,fontWeight:600,color:"#2E2824"}}>{trip.currency} {amt.toLocaleString()} <span style={{fontSize:11,color:"#A09890"}}>({pct}%)</span></span>
                    </div>
                    <div style={{height:6,background:"#EEE",borderRadius:3,overflow:"hidden",WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"}}>
                      <div style={{height:"100%",width:pct+"%",background:pal.bg,borderRadius:3,WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
            {burdenList.length>0&&(
              <div>
                <div style={{fontSize:12,color:"#A09890",marginBottom:12,letterSpacing:"0.06em",textTransform:"uppercase"}}>各自應負擔金額</div>
                {burdenList.map((p,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 18px",background:"#F8F7F5",borderRadius:14,marginBottom:10,WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:36,height:36,borderRadius:"50%",background:pal.bg,display:"flex",alignItems:"center",justifyContent:"center",color:pal.fg,fontWeight:700,fontSize:15,WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"}}>{(p.name||"?")[0]}</div>
                      <span style={{fontSize:15,fontWeight:600,color:"#2E2824"}}>{p.name}</span>
                    </div>
                    <span style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,color:pal.bg}}>{trip.currency} {Math.round(p.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{height:32}}/>
        <div style={{textAlign:"center",fontSize:10,color:"#C8C0B8",paddingBottom:24}}>Generated by My Travel Journal</div>
      </div>
    </div>
  );
}

function SectionTitle({children, color}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <div style={{width:4,height:24,background:color,borderRadius:2,WebkitPrintColorAdjust:"exact",printColorAdjust:"exact"}}/>
      <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,color:"#2E2824"}}>{children}</div>
    </div>
  );
}


function InviteCodeButton({code}){
  const [show,setShow]=useState(false);
  const [copied,setCopied]=useState(false);
  const reveal=()=>{
    setShow(v=>!v);
    if(!show){
      navigator.clipboard?.writeText(code);
      setCopied(true);
      setTimeout(()=>setCopied(false),2000);
    }
  };
  return(
    <div style={{position:"relative",flexShrink:0,marginLeft:8}}>
      <button
        onClick={reveal}
        onMouseEnter={()=>setShow(true)}
        onMouseLeave={()=>setShow(false)}
        style={{display:"flex",alignItems:"center",justifyContent:"center",width:36,height:36,background:"rgba(255,255,255,.18)",border:"none",borderRadius:12,cursor:"pointer"}}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,.9)" stroke="rgba(255,255,255,.6)" strokeWidth="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
      </button>
      {show&&(
        <div style={{position:"absolute",bottom:42,right:0,background:"rgba(0,0,0,.75)",borderRadius:12,padding:"8px 12px",whiteSpace:"nowrap",zIndex:100}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,.6)",marginBottom:3,textAlign:"center"}}>{copied?"已複製！":"點擊複製"}</div>
          <div style={{fontSize:16,fontWeight:700,color:"#fff",letterSpacing:"0.15em"}}>{code}</div>
        </div>
      )}
    </div>
  );
}

function TripDetailPage({trip,onBack,onUpdate,trips,prefs,onUpdatePrefs,onSelect,onAdd,onDelete,onEditTrip,listData,onUpdateListData,user,initialExport,onExportClose}){
  const pal=PALETTE[trip.paletteIdx??0];
  const [dayIdx,setDayIdx]=useState(0),[showAdd,setShowAdd]=useState(false);
  const [editIdx,setEditIdx]=useState(null),[form,setForm]=useState({title:"",time:"09:00",duration:"1 小時",location:"",locationUrl:"",content:"",images:[]});
  const [activeTab,setActiveTab]=useState("calendar");
  const [delTarget,setDelTarget]=useState(null);
  const [showFlightPanel,setShowFlightPanel]=useState(false);
  const [showExport,setShowExport]=useState(false);

  useEffect(()=>{
    if(initialExport) setShowExport(true);
  },[initialExport]);
  const [showLeaveConfirm,setShowLeaveConfirm]=useState(false);
  const [memberProfiles,setMemberProfiles]=useState([]); // [{uid,displayName,photoURL}]

  // 讀取成員資料
  useEffect(()=>{
    if(!trip.members||trip.members.length===0) return;
    const fetchMembers = async()=>{
      try{
        const profiles = await Promise.all(
          trip.members.map(uid=>
            getDoc(doc(fbDb,"users",uid)).then(d=>{
              const p=d.data()?.profile||{};
              return {uid, displayName:p.displayName||"", photoURL:p.photoURL||"", email:p.email||""};
            }).catch(()=>({uid, displayName:"", photoURL:"", email:""}))
          )
        );
        setMemberProfiles(profiles.filter(p=>p.uid));
      } catch(e){ console.warn("fetchMembers error",e); }
    };
    fetchMembers();
  },[JSON.stringify(trip.members)]);

  // 儲存個人 profile 到 Firestore
  useEffect(()=>{
    if(!user) return;
    setDoc(doc(fbDb,"users",user.uid),{
      profile:{displayName:user.displayName||"",photoURL:user.photoURL||"",email:user.email||""}
    },{merge:true}).catch(()=>{});
  },[user?.uid]);
  // ── headerGone 必須在所有條件式 return 之前宣告 ──
  const [headerGone,setHeaderGone]=useState(false);
  const headerRef=useRef();
  useEffect(()=>{
    const el=headerRef.current;
    if(!el) return;
    const obs=new IntersectionObserver(([e])=>setHeaderGone(!e.isIntersecting),{threshold:0});
    obs.observe(el);
    return ()=>obs.disconnect();
  },[]);

  const [expandedIdx,setExpandedIdx]=useState(null);
  const [lightbox,setLightbox]=useState(null);
  const [delTarget2,setDelTarget2]=useState(null);
  const [editTarget2,setEditTarget2]=useState(null);
  const [showAdd2,setShowAdd2]=useState(false);
  const schedule=trip.days[dayIdx]?.schedule||[];
  const sf=k=>v=>setForm(f=>({...f,[k]:v}));
  const updateSched=ns=>{const u=deepClone(trip);u.days[dayIdx].schedule=ns;onUpdate(u);};
  const openAdd=()=>{const now=new Date();const ct=String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()<30?"00":"30");setEditIdx(null);setForm({title:"",time:ct,duration:"1 小時",location:"",locationUrl:"",content:"",images:[]});setShowAdd(true);};
  const openEdit=i=>{setEditIdx(i);setForm({title:"",time:"09:00",duration:"1 小時",location:"",locationUrl:"",content:"",images:[],...schedule[i]});setShowAdd(true);};
  const saveEvent=()=>{
    if(!form.title.trim()) return;
    const next=[...schedule];
    if(editIdx!==null){next[editIdx]={...next[editIdx],...form};}
    else{next.push({id:genId(),title:form.title,time:form.time,duration:form.duration,location:form.location||"未定地點",locationUrl:form.locationUrl||"",content:form.content||"",images:form.images||[]});}
    updateSched(next);setShowAdd(false);
  };
  const delEvent=i=>{setDelTarget({idx:i,title:schedule[i]?.title||"此行程"});};
  const confirmDel=()=>{ if(delTarget!==null){ updateSched(schedule.filter((_,j)=>j!==delTarget.idx)); setDelTarget(null); } };
  const NAV=[
    {k:"map",      label:"清單"},
    {k:"calendar", label:"行程"},
    {k:"dollar",   label:"記帳"},
    {k:"mountain", label:"景點"},
  ];
  const navIcon=(k,active)=>{
    if(k==="map") return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2:1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>;
    if(k==="calendar") return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
    if(k==="dollar") return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2:1.5} strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
    if(k==="mountain") return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active?2:1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 20l6-10 4 6 3-4 5 8H3z"/><circle cx="17.5" cy="7.5" r="2"/></svg>;
    return <Icon name={k} size={20} color="currentColor" sw={active?2:1.5}/>;
  };
  const NAV_H=70, DATE_H=106;

  const renderCalendar=()=>{
    // 取得當日有地點的行程（location 或 locationUrl）
    const validEvents = schedule.filter(ev=>ev.location&&ev.location!=="未定地點");
    const validLocations = validEvents.map(ev=>ev.location);

    // 一鍵規劃：有 locationUrl 的用連結，否則用地點名稱
    const buildRouteUrl = () => {
      if(validEvents.length===0) return null;
      // 若所有地點都有 Google Maps 連結，嘗試串接
      const points = validEvents.map(ev=>ev.locationUrl||ev.location);
      // 若有非 google maps 連結，只開第一個連結
      const hasExternalUrl = validEvents.some(ev=>ev.locationUrl&&!ev.locationUrl.includes("google"));
      if(hasExternalUrl){
        const first = validEvents.find(ev=>ev.locationUrl);
        return first?.locationUrl||`https://www.google.com/maps/dir/${points.map(encodeURIComponent).join("/")}`;
      }
      // 全用地點名稱串 Google Maps 多點導航
      return `https://www.google.com/maps/dir/${validLocations.map(encodeURIComponent).join("/")}`;
    };

    return (
    <>
      {/* 今日動線 — 路線規劃區塊（韓國行程不顯示）*/}
      {trip.currency!=="KRW"&&<div style={{background:CARD_BG,borderRadius:"0 0 20px 20px",padding:"12px 16px 14px",boxShadow:"0 4px 12px rgba(0,0,0,.07)"}}>
        {validLocations.length>0 ? (
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{ const url=buildRouteUrl(); if(url) window.open(url,"_blank"); }}
              style={{flex:1,padding:"9px 0",borderRadius:12,background:pal.bg,color:pal.fg,fontSize:11,fontWeight:600,border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
              <Icon name="map" size={13} color={pal.fg} sw={1.8}/> 一鍵規劃路線
            </button>
          </div>
        ) : (
          <div style={{display:"flex",alignItems:"center",gap:7,color:TEXT_L,fontSize:11,padding:"4px 0"}}>
            <Icon name="map" size={14} color={BORDER}/> 新增地點後顯示今日動線
          </div>
        )}
      </div>}
      {/* 行程卡 */}
      <div style={{margin:"12px 15px 0",background:CARD_BG,borderRadius:26,boxShadow:"0 4px 20px rgba(40,32,28,.09)",overflow:"hidden",marginBottom:16}}>
        <div style={{height:4,background:`linear-gradient(90deg,${pal.bg},${pal.bg}80,${pal.bg})`}}/>
        <div style={{padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <div>
              <div style={{fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,color:TEXT_D}}>今日行程 <span style={{fontWeight:400,color:TEXT_L,fontSize:13}}>— {trip.days[dayIdx]?.weekDay}</span></div>
            </div>
            <div style={{fontSize:11,background:APP_BG,color:TEXT_M,padding:"4px 11px",borderRadius:20,border:`1px solid ${BORDER}`}}>{schedule.length} 個</div>
          </div>
          <SortableList items={schedule} onReorder={updateSched} renderItem={(ev,i,isActive,gripProps)=>{
            const expanded=expandedIdx===i;
            return(
            <div>
              <div
                onClick={()=>setExpandedIdx(expanded?null:i)}
                style={{position:"relative",paddingLeft:17,borderLeft:`2px dashed ${expanded?pal.bg:BORDER}`,paddingTop:8,paddingBottom:8,borderRadius:"0 12px 12px 0",background:isActive?`${pal.bg}10`:expanded?`${pal.bg}06`:"transparent",transition:"background .15s,border-color .2s",cursor:"pointer"}}>
                <div style={{position:"absolute",left:-5,top:16,width:8,height:8,borderRadius:"50%",background:pal.bg,border:`2px solid ${APP_BG}`}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,minWidth:0,paddingRight:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}>
                      <span style={{fontFamily:"Georgia,serif",fontSize:12,color:pal.bg,fontWeight:700}}>{ev.time}</span>
                      <span style={{fontSize:10,background:APP_BG,color:TEXT_L,padding:"2px 7px",borderRadius:20,border:`1px solid ${BORDER}`}}>{ev.duration}</span>
                    </div>
                    <div style={{fontSize:15,fontWeight:500,color:TEXT_D,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</div>
                    {ev.content&&<div style={{fontSize:13,color:TEXT_L,marginTop:2,lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{ev.content}</div>}
                    {ev.images&&ev.images.length>0&&(
                      <div style={{display:"flex",gap:5,marginTop:6,overflowX:"auto",scrollbarWidth:"none",WebkitOverflowScrolling:"touch",paddingBottom:2}}>
                        {ev.images.map((src,idx2)=>(
                          <div key={idx2} onClick={e=>{e.stopPropagation();setLightbox(src);}}
                            style={{width:52,height:52,borderRadius:9,overflow:"hidden",flexShrink:0,cursor:"zoom-in"}}>
                            <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{display:"flex",alignItems:"center",gap:4,marginTop:3,fontSize:11}}>
                      <Icon name="location" size={11} color={pal.bg} sw={1.5}/>
                      <span onClick={e=>{
                        e.stopPropagation();
                        const url=ev.locationUrl?.trim();
                        if(url) window.open(url,"_blank");
                        else if(ev.location&&ev.location!=="未定地點") window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}`,"_blank");
                      }} style={{color:(ev.locationUrl||ev.location!=="未定地點")?pal.bg:TEXT_L,cursor:"pointer",textDecoration:"underline",textDecorationStyle:"dotted",textUnderlineOffset:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {ev.location}
                      </span>
                    </div>
                    {/* 展開後顯示操作按鈕 */}
                    {expanded&&(
                      <div style={{display:"flex",gap:7,marginTop:10}} onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>{setExpandedIdx(null);openEdit(i);}}
                          style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:12,background:APP_BG,border:`1px solid ${BORDER}`,cursor:"pointer",fontSize:11,color:TEXT_M,fontFamily:"inherit"}}>
                          <Icon name="pencil-sm" size={12} color={TEXT_M} sw={1.8}/> 編輯
                        </button>
                        <button onClick={()=>{setExpandedIdx(null);delEvent(i);}}
                          style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:12,background:"#F4EDEC",border:"none",cursor:"pointer",fontSize:11,color:"#B04A38",fontFamily:"inherit"}}>
                          <Icon name="trash" size={12} color="#B04A38"/> 刪除
                        </button>
                      </div>
                    )}
                  </div>
                  {/* grip handle */}
                  <div {...gripProps} style={{...(gripProps?.style),width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:9,background:isActive?`${pal.bg}20`:"transparent",transition:"background .15s",flexShrink:0}} onClick={e=>e.stopPropagation()}>
                    <Icon name="grip" size={16} color={isActive?pal.bg:BORDER}/>
                  </div>
                </div>
              </div>
              {/* 行程間 TransitBar — 韓國行程（KRW）不顯示 */}
              {i<schedule.length-1&&trip.currency!=="KRW"&&(
                <TransitBar
                  from={ev.location} fromUrl={ev.locationUrl}
                  to={schedule[i+1].location} toUrl={schedule[i+1].locationUrl}
                  pal={pal}/>
              )}
            </div>
            );
          }}/>
          {schedule.length===0&&<div style={{textAlign:"center",padding:"36px 0"}}><div style={{display:"flex",justifyContent:"center",marginBottom:10}}><Icon name="sun" size={34} color={BORDER} sw={1}/></div><div style={{fontSize:13,color:TEXT_L,fontStyle:"italic"}}>今天尚無安排</div></div>}
          <button onClick={openAdd}
            style={{width:"100%",marginTop:16,padding:"13px 0",border:`2px dashed ${pal.bg}50`,borderRadius:17,fontSize:12,color:TEXT_M,background:"transparent",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=APP_BG;e.currentTarget.style.borderColor=pal.bg;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=`${pal.bg}50`;}}>
            <Icon name="plus" size={14} color={TEXT_M}/> 加入新旅程
          </button>
        </div>
      </div>
      {/* 刪除行程確認框 */}
      <Dialog
        show={!!delTarget}
        icon={<Icon name="trash" size={28}/>}
        title="刪除這個行程？"
        desc={`「${delTarget?.title}」刪除後將無法復原。`}
        onConfirm={confirmDel}
        onCancel={()=>setDelTarget(null)}
        confirmLabel="確認刪除"
        danger
      />
      {/* 照片放大 Lightbox */}
      {lightbox&&(
        <div onClick={()=>setLightbox(null)}
          style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,.92)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <img src={lightbox} alt="" style={{maxWidth:"95vw",maxHeight:"90vh",borderRadius:12,objectFit:"contain",boxShadow:"0 8px 40px rgba(0,0,0,.5)"}}/>
          <button onClick={()=>setLightbox(null)}
            style={{position:"absolute",top:20,right:20,width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,.2)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon name="x" size={18} color="#fff" sw={2}/>
          </button>
        </div>
      )}
    </>
  );
  }; // end renderCalendar

  // 全螢幕表單頁
  if(showAdd){
    const lbl={fontSize:11,color:TEXT_L,display:"block",marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase"};
    const inp={padding:"11px 14px",border:`1.5px solid ${BORDER}`,borderRadius:14,background:APP_BG,fontFamily:"inherit",fontSize:16,color:TEXT_D,outline:"none",width:"100%"};
    return(
      <div style={{height:"100vh",background:APP_BG,fontFamily:`'Noto Serif TC','PingFang TC',serif`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{background:pal.bg,padding:"48px 20px 14px",display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexShrink:0}}>
          <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,color:pal.fg}}>
            {editIdx!==null?"編輯行程":"新增旅程"}
          </div>
          <button onClick={()=>setShowAdd(false)}
            style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,.18)",border:"none",borderRadius:20,padding:"7px 13px",cursor:"pointer",color:pal.fg,fontSize:12,fontFamily:"inherit"}}>
            <Icon name="x" size={13} color={pal.fg}/> 取消
          </button>
        </div>

        {/* 表單區域：flex:1 內部滾動 */}
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"16px 18px 20px",display:"flex",flexDirection:"column",gap:13}}>

          {/* 行程名稱 */}
          <div>
            <label style={lbl}>行程名稱</label>
            <input value={form.title} onChange={e=>sf("title")(e.target.value)} placeholder="例如：現代美術館" style={inp}/>
          </div>

          {/* 時間 + 停留時長 */}
          <div style={{display:"flex",gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              <label style={lbl}>時間</label>
              <MiniTimePicker value={form.time} onChange={sf("time")}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <label style={lbl}>停留時長</label>
              <input value={form.duration} onChange={e=>sf("duration")(e.target.value)} placeholder="1 小時" style={{...inp,height:36,padding:"0 14px",boxSizing:"border-box"}}/>
            </div>
          </div>

          {/* 地點名稱 + 地圖連結 */}
          <div style={{display:"flex",gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              <label style={lbl}>地點名稱</label>
              <div style={{position:"relative"}}>
                <input value={form.location} onChange={e=>sf("location")(e.target.value)} placeholder="首爾鐘路區"
                  style={{...inp,paddingRight:form.location?"38px":"14px"}}/>
                {form.location&&(
                  <button onClick={()=>window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location)}`,"_blank")}
                    style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",width:25,height:25,borderRadius:8,background:pal.bg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Icon name="external-link" size={11} color="#fff"/>
                  </button>
                )}
              </div>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <label style={lbl}>地圖連結（選填）</label>
              <div style={{position:"relative"}}>
                <input value={form.locationUrl} onChange={e=>sf("locationUrl")(e.target.value)} placeholder="maps.app.goo.gl/… 或 map.naver.com/…"
                  style={{...inp,paddingRight:form.locationUrl?"38px":"14px",fontSize:16,borderColor:form.locationUrl?pal.bg:BORDER}}/>
                {form.locationUrl&&(
                  <button onClick={()=>window.open(form.locationUrl.startsWith("http")?form.locationUrl:`https://${form.locationUrl}`,"_blank")}
                    style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",width:25,height:25,borderRadius:8,background:pal.bg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Icon name="external-link" size={11} color={pal.fg}/>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 行程內容 */}
          <div>
            <label style={lbl}>行程內容（選填）</label>
            <textarea value={form.content} onChange={e=>sf("content")(e.target.value)}
              placeholder="細節、注意事項、預訂資訊…"
              rows={3}
              style={{...inp,resize:"none",lineHeight:1.6}}/>
          </div>

          {/* 照片 */}
          <div>
            <label style={lbl}>照片（選填）</label>
            <EventImageUploader images={form.images||[]} onChange={imgs=>sf("images")(imgs)}/>
          </div>

          {/* 按鈕 */}
          <button onClick={saveEvent}
            style={{width:"100%",padding:"14px 0",borderRadius:17,background:pal.bg,color:pal.fg,fontSize:14,fontWeight:700,border:"none",cursor:"pointer",fontFamily:"inherit",boxShadow:`0 5px 16px ${pal.bg}50`,marginTop:2}}>
            {editIdx!==null?"儲存修改":"加入行程"}
          </button>
        </div>

        <Dialog show={!!delTarget} icon={<Icon name="trash" size={28}/>} title="刪除這個行程？"
          desc={`「${delTarget?.title}」刪除後將無法復原。`}
          onConfirm={confirmDel} onCancel={()=>setDelTarget(null)} confirmLabel="確認刪除" danger/>
      </div>
    );
  }

  if(showExport) return <TripExportView trip={trip} pal={pal} onClose={()=>{ setShowExport(false); onExportClose&&onExportClose(); }} bookmarks={listData?.[`bookmarks_${trip.id}`]||[]}/>;

  return(
    <div style={{
      minHeight:"100vh",
      background:APP_BG,
      fontFamily:`'Noto Serif TC','PingFang TC',serif`,
      // 底部永遠留出導覽列空間
      paddingBottom: NAV_H,
    }}>
      {/* 封面 Header — 緊湊版 */}
      <div style={{background:pal.bg,padding:"36px 18px 14px",position:"relative",overflow:"hidden"}}>
        {trip.coverImage&&<div style={{position:"absolute",inset:0}}><img src={typeof trip.coverImage==="object"?trip.coverImage.url:trip.coverImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:`${typeof trip.coverImage==="object"?(trip.coverImage.posX??50):50}% ${typeof trip.coverImage==="object"?(trip.coverImage.posY??50):50}%`}}/><div style={{position:"absolute",inset:0,background:`linear-gradient(180deg,${pal.bg}CC 0%,${pal.bg}90 100%)`}}/></div>}
        
        <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
            <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:3,background:"rgba(255,255,255,.16)",border:"none",borderRadius:20,padding:"5px 10px",cursor:"pointer",color:pal.fg,fontSize:11,fontFamily:"inherit",flexShrink:0}}>
              <Icon name="chevron-left" size={13} color={pal.fg}/> 返回
            </button>
            <div style={{minWidth:0}}>
              <div style={{fontFamily:"Georgia,serif",fontSize:26,fontWeight:700,color:pal.fg,lineHeight:1.1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{trip.name}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.70)",marginTop:2}}>{trip.startDate} → {trip.endDate}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            {/* 成員頭像（共享旅程）*/}
            {trip.type==="shared"&&memberProfiles.length>0&&(
              <div style={{display:"flex",alignItems:"center"}}>
                {memberProfiles.slice(0,4).map((m,i)=>(
                  <div key={m.uid} title={m.displayName||m.email||m.uid}
                    style={{width:26,height:26,borderRadius:"50%",border:"2px solid rgba(255,255,255,.6)",marginLeft:i===0?0:-8,overflow:"hidden",background:pal.bg,flexShrink:0,zIndex:4-i}}>
                    {m.photoURL
                      ? <img src={m.photoURL} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:700}}>
                          {(m.displayName||m.email||"?")[0].toUpperCase()}
                        </div>
                    }
                  </div>
                ))}
                {memberProfiles.length>4&&(
                  <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid rgba(255,255,255,.6)",marginLeft:-8,background:"rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff"}}>
                    +{memberProfiles.length-4}
                  </div>
                )}
              </div>
            )}
            {trip.type==="shared"&&trip.inviteCode&&(
              <InviteCodeButton code={trip.inviteCode}/>
            )}
          </div>
        </div>
      </div>

      {/* 離開共享旅程確認 */}
      <Dialog show={showLeaveConfirm}
        icon={<Icon name="logout" size={28}/>}
        title="離開共享旅程？"
        desc="離開後將無法看到此旅程，需要重新輸入邀請碼才能加入。"
        onConfirm={async()=>{
          if(!trip._docId) return;
          const newMembers=(trip.members||[]).filter(uid=>uid!==user?.uid);
          await updateDoc(doc(fbDb,"trips",trip._docId),{members:newMembers}).catch(()=>{});
          setShowLeaveConfirm(false);
          onBack();
        }}
        onCancel={()=>setShowLeaveConfirm(false)}
        confirmLabel="確認離開" danger/>

      {/* 航班 Panel（透過 header 按鈕開啟）*/}
      <FlightPanel trip={trip} onUpdate={onUpdate} pal={pal} show={showFlightPanel} onClose={()=>setShowFlightPanel(false)}/>

      {/* ── 日期列：永遠顯示，sticky 固定在頂部 ── */}
      {activeTab==="calendar"&&(
        <div style={{
          position:"sticky",top:0,zIndex:80,
          background:APP_BG,
          borderBottom:`1px solid ${BORDER}`,
          padding:"12px 18px 10px",
          display:"flex",gap:8,
          overflowX:"auto",scrollbarWidth:"none",
          WebkitOverflowScrolling:"touch",
        }}>
          {trip.days.map((day,i)=>{
            const active=dayIdx===i;
            return(
              <div key={i} onClick={()=>setDayIdx(i)}
                style={{flexShrink:0,width:58,height:80,borderRadius:17,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,
                  background:active?pal.bg:CARD_BG,color:active?pal.fg:TEXT_D,
                  boxShadow:active?`0 8px 20px ${pal.bg}55`:"0 2px 8px rgba(0,0,0,.07)",
                  border:active?"none":`1px solid ${BORDER}`,
                  transform:active?"scale(1.07) translateY(-2px)":"scale(1)",
                  transition:"all .3s cubic-bezier(.34,1.56,.64,1)",userSelect:"none"}}>
                <div style={{fontSize:9,letterSpacing:"0.1em",color:active?"rgba(255,255,255,.75)":TEXT_L}}>D{i+1}</div>
                <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,lineHeight:1}}>{day.dateNumber}</div>
                <div style={{fontSize:9,color:active?"rgba(255,255,255,.75)":TEXT_L}}>{day.month}月</div>
                {day.schedule.length>0&&<div style={{width:4,height:4,borderRadius:"50%",background:active?"rgba(255,255,255,.8)":pal.bg,marginTop:2}}/>}
              </div>
            );
          })}
        </div>
      )}

      {/* 頁籤內容 */}
      {activeTab==="overview"&&(()=>{
        return(
          <div style={{minHeight:"100vh",background:APP_BG,fontFamily:`'Noto Serif TC','PingFang TC',serif`}}>
            <div style={{padding:"16px 24px 12px"}}>
              <EditableTitle value={prefs?.journalLabel||"My Travel Journal"} onChange={v=>onUpdatePrefs?.({...prefs,journalLabel:v})}
                outerStyle={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,fontStyle:"italic",color:TEXT_M,marginBottom:2}}
                inputStyle={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,fontStyle:"italic",color:TEXT_M}} placeholder="My Travel Journal"/>
              <EditableTitle value={prefs?.pageTitle||"Have a nice trip"} onChange={v=>onUpdatePrefs?.({...prefs,pageTitle:v})}
                outerStyle={{fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,fontStyle:"italic",color:TEXT_D}}
                inputStyle={{fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,fontStyle:"italic"}} placeholder="Have a nice trip"/>
              <div style={{fontSize:12,color:TEXT_M,marginTop:4}}>共 {trips?.length||0} 段旅程</div>
            </div>
            <div style={{padding:"0 18px",display:"flex",flexDirection:"column",gap:14}}>
              {(trips||[]).map((t,idx)=>{
                const p2=PALETTE[t.paletteIdx??0];
                const tot=t.days.reduce((s,d)=>s+d.schedule.length,0);
                return(
                  <div key={t.id} style={{borderRadius:24,overflow:"hidden",boxShadow:"0 4px 22px rgba(40,32,28,.13)"}}>
                    <div onClick={()=>onSelect?.(t.id)} style={{position:"relative",background:p2.bg,padding:"22px 22px 18px",cursor:"pointer",overflow:"hidden",minHeight:130}}>
                      {t.coverImage&&<div style={{position:"absolute",inset:0}}><img src={typeof t.coverImage==="object"?t.coverImage.url:t.coverImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:`${typeof t.coverImage==="object"?(t.coverImage.posX??50):50}% ${typeof t.coverImage==="object"?(t.coverImage.posY??50):50}%`}}/><div style={{position:"absolute",inset:0,background:`linear-gradient(135deg,${p2.bg}E8 0%,${p2.bg}70 100%)`}}/></div>}
                      <button onClick={e=>{e.stopPropagation();setEditTarget2(t);}}
                        style={{position:"absolute",top:14,right:14,width:34,height:34,borderRadius:10,background:"rgba(255,255,255,.20)",border:"1.5px solid rgba(255,255,255,.35)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:2}}>
                        <Icon name="pencil-sm" size={15} color={p2.fg} sw={1.8}/>
                      </button>
                      <div style={{position:"relative"}}>
                        <div style={{fontSize:10,color:"rgba(255,255,255,.75)",letterSpacing:"0.12em",marginBottom:3}}>{t.startDate} → {t.endDate}</div>
                        <div style={{fontFamily:"Georgia,serif",fontSize:26,fontWeight:700,color:p2.fg,lineHeight:1.1}}>{t.name}</div>
                        <div style={{fontSize:12,color:"rgba(255,255,255,.80)",marginTop:3}}>{t.subtitle}</div>
                        <div style={{display:"flex",gap:14,marginTop:14}}>
                          {[{icon:"calendar",val:`${t.days.length} 天`},{icon:"clock",val:`${tot} 行程`}].map(({icon,val})=>(
                            <div key={icon} style={{display:"flex",alignItems:"center",gap:5,color:"rgba(255,255,255,.80)"}}>
                              <Icon name={icon} size={12} color="rgba(255,255,255,.80)" sw={1.8}/><span style={{fontSize:11}}>{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{background:CARD_BG,display:"flex",alignItems:"center",padding:"10px 14px"}}>
                      <button onClick={()=>onSelect?.(t.id)} style={{flex:1,display:"flex",alignItems:"center",gap:6,color:TEXT_D,fontSize:13,fontWeight:600,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>
                        <Icon name="arrow-right" size={15} color={p2.bg}/> 查看行程
                      </button>
                      <button onClick={()=>setDelTarget2(t.id)} style={{width:34,height:34,borderRadius:10,background:"#F4EDEC",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <Icon name="trash" size={15} color="#B04A38" sw={1.5}/>
                      </button>
                    </div>
                  </div>
                );
              })}
              <button onClick={()=>setShowAdd2(true)}
                style={{borderRadius:24,border:`2px dashed ${BORDER}`,background:"transparent",padding:"26px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:10,cursor:"pointer",fontFamily:"inherit"}}
                onMouseEnter={e=>e.currentTarget.style.background=CARD_BG} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{width:44,height:44,borderRadius:"50%",background:BORDER,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="plus" size={22} color={TEXT_M}/></div>
                <span style={{fontSize:13,color:TEXT_M}}>新增旅遊地點</span>
              </button>
            </div>
            <div style={{height:120}}/>
            <Dialog show={!!delTarget2} icon={<Icon name="trash" size={28}/>} title="刪除這段旅程？" desc="刪除後將無法復原。"
              onConfirm={()=>{onDelete?.(delTarget2);setDelTarget2(null);}} onCancel={()=>setDelTarget2(null)} confirmLabel="確認刪除" danger/>
            <TripFormSheet show={!!editTarget2} onClose={()=>setEditTarget2(null)} initialData={editTarget2} onSave={data=>{onEditTrip?.(editTarget2.id,data);setEditTarget2(null);}}/>
            <TripFormSheet show={showAdd2} onClose={()=>setShowAdd2(false)} initialData={null} onSave={data=>{onAdd?.(data);setShowAdd2(false);}}/>
          </div>
        );
      })()}
      {activeTab==="calendar"&&renderCalendar()}
      {activeTab==="map"&&<TripListTab trip={trip} onUpdate={onUpdate} pal={pal}
        listData={listData?.[trip.id]||{}} onUpdateListData={d=>onUpdateListData(p=>({...p,[trip.id]:d}))}/>}
      {activeTab==="wallet"&&<WalletTab trip={trip} onUpdate={onUpdate}/>}
      {activeTab==="bookmark"&&<BookmarkTab trip={trip} onUpdate={onUpdate}
        bookmarks={listData?.[`bookmarks_${trip.id}`]||[]}
        onUpdateBookmarks={bks=>onUpdateListData({...listData,[`bookmarks_${trip.id}`]:bks})}/> }

      {/* ── 固定底部導覽列 ── */}
      <div style={{
        position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:430,
        zIndex:80,
        background:`rgba(238,236,234,.97)`,
        backdropFilter:"blur(14px)",
        borderTop:`1px solid ${BORDER}`,
        boxShadow:"0 -6px 24px rgba(40,32,28,.08)",
      }}>
        <div style={{display:"flex",justifyContent:"space-around",alignItems:"center",padding:"10px 0 20px"}}>
          {NAV.map(({k,label})=>{
            const active=activeTab===k||(k==="dollar"&&activeTab==="wallet")||(k==="mountain"&&activeTab==="bookmark");
            const tabKey=k==="dollar"?"wallet":k==="mountain"?"bookmark":k;
            return(
              <button key={k} onClick={()=>setActiveTab(tabKey)}
                style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",color:active?pal.bg:TEXT_L,opacity:active?1:.65,transition:"all .2s"}}>
                {navIcon(k,active)}
                <span style={{fontSize:9,letterSpacing:"0.06em",fontWeight:active?600:400}}>{label}</span>
              </button>
            );
          })}
          {/* 離開共享旅程（非 owner 才顯示）*/}
          {trip.type==="shared"&&trip.ownerId!==user?.uid&&(
            <button onClick={()=>setShowLeaveConfirm(true)}
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",color:TEXT_L,opacity:.65}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              <span style={{fontSize:9,letterSpacing:"0.06em"}}>離開</span>
            </button>
          )}
        </div>
      </div>

      {/* 離開共享旅程確認 */}
      <Dialog show={showLeaveConfirm}
        icon={<Icon name="logout" size={28}/>}
        title="離開共享旅程？"
        desc="離開後將無法看到此旅程，需要重新輸入邀請碼才能加入。"
        onConfirm={async()=>{
          if(!trip._docId) return;
          const newMembers=(trip.members||[]).filter(uid=>uid!==user?.uid);
          await updateDoc(doc(fbDb,"trips",trip._docId),{members:newMembers}).catch(()=>{});
          setShowLeaveConfirm(false);
          onBack();
        }}
        onCancel={()=>setShowLeaveConfirm(false)}
        confirmLabel="確認離開" danger/>
    </div>
  );
}

// ─── Error Boundary ───
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state={error:null}; }
  static getDerivedStateFromError(e){ return {error:e}; }
  render(){
    if(this.state.error) return(
      <div style={{minHeight:"100vh",background:"#EEECEA",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"serif"}}>
        <div style={{fontSize:14,color:"#6A6058",marginBottom:12}}>App 發生錯誤，請重新整理</div>
        <div style={{fontSize:11,color:"#A09890",background:"#F8F7F5",padding:"12px 16px",borderRadius:12,maxWidth:360,wordBreak:"break-all",whiteSpace:"pre-wrap"}}>
          {this.state.error?.message||String(this.state.error)}
          {"\n\n"}
          {this.state.error?.stack?.split("\n").slice(0,5).join("\n")}
        </div>
        <button onClick={()=>window.location.reload()} style={{marginTop:20,padding:"10px 24px",borderRadius:14,background:"#2E2824",color:"#fff",border:"none",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>重新整理</button>
      </div>
    );
    return this.props.children;
  }
}

// ─── Main App ───
const STORAGE_KEY="TRAVEL_APP_V8_TRIPS", PREFS_KEY="TRAVEL_APP_V8_PREFS", LIST_KEY="TRAVEL_APP_V8_LIST";

// ─── 登入頁面 ───
function LoginPage(){
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // 處理 redirect 登入回調
  useEffect(()=>{
    setLoading(true);
    getRedirectResult(fbAuth)
      .then(result=>{ if(!result) setLoading(false); })
      .catch(()=>setLoading(false));
  },[]);

  const signIn = async()=>{
    setLoading(true); setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({prompt:"select_account"});
    try{
      // 先試 popup
      await signInWithPopup(fbAuth, provider);
    } catch(e){
      // popup 失敗（iOS Safari / 隱私模式）→ 改用 redirect
      if(e.code==="auth/popup-blocked"||e.code==="auth/popup-closed-by-user"||e.code==="auth/cancelled-popup-request"||e.message?.includes("sessionStorage")){
        try{
          await signInWithRedirect(fbAuth, provider);
        } catch(e2){
          setError("登入失敗，請再試一次");
          setLoading(false);
        }
      } else {
        setError("登入失敗，請再試一次");
        setLoading(false);
      }
    }
  };
  return(
    <div style={{minHeight:"100vh",background:"#EEECEA",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",fontFamily:"'Noto Serif TC',serif"}}>
      <div style={{marginBottom:32,textAlign:"center"}}>
        <div style={{fontFamily:"Georgia,serif",fontSize:28,fontWeight:700,fontStyle:"italic",color:"#6A6058",marginBottom:8}}>My Travel Journal</div>
        <div style={{fontSize:13,color:"#A09890"}}>記錄每一段美好旅程</div>
      </div>
      <div style={{background:"#F8F7F5",borderRadius:24,padding:"32px 28px",width:"100%",maxWidth:360,boxShadow:"0 8px 32px rgba(0,0,0,.08)"}}>
        <div style={{fontSize:15,fontWeight:600,color:"#2E2824",marginBottom:8,textAlign:"center"}}>歡迎使用</div>
        <div style={{fontSize:12,color:"#A09890",marginBottom:24,textAlign:"center"}}>登入後即可建立和管理你的旅遊行程</div>
        <button onClick={signIn} disabled={loading}
          style={{width:"100%",padding:"13px 0",borderRadius:16,background:loading?"#C0B4A8":"#2E2824",color:"#fff",fontSize:14,fontWeight:600,border:"none",cursor:loading?"default":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"all .2s"}}>
          {loading ? "登入中…" : <>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#ddd" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#ccc" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            使用 Google 登入
          </>}
        </button>
        {error&&<div style={{fontSize:11,color:"#B04A38",textAlign:"center",marginTop:12}}>{error}</div>}
      </div>
      <div style={{fontSize:11,color:"#A09890",marginTop:24,textAlign:"center",maxWidth:280}}>
        登入即表示你同意我們使用你的 Google 帳號資訊來建立個人旅遊記錄
      </div>
    </div>
  );
}

function AppInner(){
  const [user,    setUser]    = useState(undefined); // undefined=loading, null=logged out
  const [trips,   setTrips]   = useState([]);
  const [prefs,   setPrefs]   = useState({...DEFAULT_PREFS});
  const [listData,setListData]= useState({});
  const [currentId,setCurrentId]= useState(null);
  const [exportId, setExportId] = useState(null);

  const goExport = useCallback((id)=>{
    setExportId(id);
    setCurrentId(id);
  },[]);
  const [syncing, setSyncing] = useState(false);

  // 防止 iOS input focus 時頁面放大
  useEffect(()=>{
    const meta=document.querySelector("meta[name=viewport]");
    if(meta) meta.content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no";
    else{ const m=document.createElement("meta"); m.name="viewport"; m.content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"; document.head.appendChild(m); }
  },[]);

  // Firebase Auth 狀態監聽
  useEffect(()=>{
    const unsub = onAuthStateChanged(fbAuth, u=>{ setUser(u||null); });
    return unsub;
  },[]);

  // 登入後從 Firestore 讀取資料
  useEffect(()=>{
    if(!user) return;
    setSyncing(true);

    // 監聽個人旅程
    const tripsQ = query(collection(fbDb,"trips"), where("members","array-contains",user.uid));
    const unsubTrips = onSnapshot(tripsQ, snap=>{
      const data = snap.docs.map(d=>({...d.data(), _docId:d.id}));
      setTrips(data);
      setSyncing(false);
    }, ()=>setSyncing(false));

    // 讀取偏好設定
    getDoc(doc(fbDb,"users",user.uid)).then(d=>{
      if(d.exists()) setPrefs(d.data().prefs||{...DEFAULT_PREFS});
    });

    // 讀取清單資料
    getDoc(doc(fbDb,"listData",user.uid)).then(d=>{
      if(d.exists()) setListData(d.data()||{});
    });

    return ()=>{ unsubTrips(); };
  },[user]);

  // 存偏好到 Firestore
  useEffect(()=>{
    if(!user) return;
    setDoc(doc(fbDb,"users",user.uid),{prefs},{merge:true}).catch(()=>{});
  },[prefs]);

  // 存清單資料到 Firestore（debounce）
  const listSaveTimer = useRef(null);
  useEffect(()=>{
    if(!user) return;
    clearTimeout(listSaveTimer.current);
    listSaveTimer.current = setTimeout(()=>{
      setDoc(doc(fbDb,"listData",user.uid), listData, {merge:true}).catch(()=>{});
    },1000);
  },[listData]);

  const handleAdd = async data=>{
    if(!user) return;
    const t = {
      id:genId(), ...data,
      companions:[], expenses:[], bookmarks:[], flights:[],
      days:generateDays(data.startDate,data.endDate),
      ownerId:user.uid, members:[user.uid],
      type:data.type||"personal",
      inviteCode:data.inviteCode||null,
      createdAt:Date.now()
    };
    await addDoc(collection(fbDb,"trips"), t);
    setCurrentId(t.id);
  };

  const handleEdit = async(id,data)=>{
    const t = trips.find(x=>x.id===id); if(!t||!t._docId) return;
    const updated = {...t,...data,days:generateDays(data.startDate,data.endDate,t.days)};
    await updateDoc(doc(fbDb,"trips",t._docId), updated).catch(()=>{});
  };

  const handleUpdate = async u=>{
    if(!u._docId) return;
    await updateDoc(doc(fbDb,"trips",u._docId), u).catch(()=>{});
  };

  const handleDelete = async id=>{
    const t = trips.find(x=>x.id===id); if(!t||!t._docId) return;
    await deleteDoc(doc(fbDb,"trips",t._docId)).catch(()=>{});
    if(currentId===id) setCurrentId(null);
  };

  const cur = trips.find(t=>t.id===currentId)||null;

  // Loading
  if(user===undefined) return(
    <div style={{minHeight:"100vh",background:"#EEECEA",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontSize:13,color:"#A09890"}}>載入中…</div>
    </div>
  );

  // 未登入 → 顯示登入頁
  if(!user) return <LoginPage/>;

  return(
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        button{font-family:inherit;}
        ::-webkit-scrollbar{display:none;}
        @keyframes slideUp{from{transform:translateY(50px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .ev-row{animation:fadeUp .3s ease forwards;}
        .ev-row:nth-child(1){animation-delay:.04s}
        .ev-row:nth-child(2){animation-delay:.08s}
        .ev-row:nth-child(3){animation-delay:.12s}
        .ev-row:nth-child(4){animation-delay:.16s}
        .ev-row:nth-child(5){animation-delay:.20s}
      `}</style>
      {cur
        ?<TripDetailPage trip={cur} onBack={()=>setCurrentId(null)} onUpdate={handleUpdate}
            trips={trips} prefs={prefs} onUpdatePrefs={setPrefs}
            onSelect={setCurrentId} onAdd={handleAdd} onDelete={handleDelete} onEditTrip={handleEdit}
            listData={listData} onUpdateListData={setListData}
            user={user}
            initialExport={exportId===cur?.id}
            onExportClose={()=>setExportId(null)}/>
        :<TripListPage trips={trips} prefs={prefs} onSelect={setCurrentId} onAdd={handleAdd}
            onDelete={handleDelete} onEditTrip={handleEdit} onUpdatePrefs={setPrefs}
            onReorder={newOrder=>{
              newOrder.forEach((t,i)=>{
                if(t._docId) updateDoc(doc(fbDb,"trips",t._docId),{sortOrder:i}).catch(()=>{});
              });
              setTrips(newOrder);
            }}
            user={user} onSignOut={()=>signOut(fbAuth)}
            onExport={goExport}
            onJoinTrip={async(code)=>{
              try{
                const q=query(collection(fbDb,"trips"),where("inviteCode","==",code.trim().toUpperCase()));
                const snap=await getDocs(q);
                if(snap.empty) return "找不到此邀請碼，請確認後再試";
                const tripDoc=snap.docs[0];
                const td=tripDoc.data();
                if(td.members?.includes(user.uid)) return "你已經在這個旅程了";
                await updateDoc(doc(fbDb,"trips",tripDoc.id),{members:[...(td.members||[]),user.uid],type:"shared"});
                return null;
              } catch(e){
                return "加入失敗，請稍後再試";
              }
            }}/>
      }
    </div>
  );
}

export default function App(){
  return <ErrorBoundary><AppInner/></ErrorBoundary>;
}
