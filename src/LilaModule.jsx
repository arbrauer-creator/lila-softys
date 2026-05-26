import { useState, useEffect, useCallback, useRef } from "react";
import { SECTORES, getSectoresLila2, FLOW_UNITS, TIME_UNITS } from "./data.js";
import { sendLilaRecord, uploadPhotoToDrive, compressImage, todayStr, nowSantiago } from "./api.js";

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const SECTOR_STYLES = {
  mp3:  { bg:"#E8F5E9", border:"#4CAF50", text:"#1B5E20", icon:"🧪" },
  mp3b: { bg:"#E0F2F7", border:"#0097A7", text:"#006064", icon:"🔧" },
  clar: { bg:"#E3F2FD", border:"#2196F3", text:"#0D47A1", icon:"💧" },
  mp12: { bg:"#FFF8E1", border:"#FFC107", text:"#E65100", icon:"⚙️" },
  eflu: { bg:"#FCE4EC", border:"#E91E63", text:"#880E4F", icon:"♻️" },
};
const STATE_COLORS = {
  "Hecho":     { bg:"#DCFCE7", border:"#4ADE80", text:"#15803D" },
  "No OK":     { bg:"#FEE2E2", border:"#F87171", text:"#B91C1C" },
  "Pendiente": { bg:"#FEF9C3", border:"#FBBF24", text:"#92400E" },
  "N/A":       { bg:"#F1F5F9", border:"#CBD5E1", text:"#64748B" },
};
const STATE_LABELS = ["Hecho","No OK","Pendiente","N/A"];
const S = {
  page:      { padding:"12px 12px 100px" },
  card:      { background:"#fff", borderRadius:14, boxShadow:"0 1px 4px rgba(0,0,0,0.07)", marginBottom:12, overflow:"hidden" },
  cardPad:   { padding:"14px 14px" },
  sectionHdr:    (c) => ({ padding:"10px 14px", display:"flex", alignItems:"center", gap:10, background:c.bg, borderBottom:`1.5px solid ${c.border}`, cursor:"pointer" }),
  sectionHdrText:(c) => ({ fontSize:13, fontWeight:700, color:c.text, flex:1 }),
  equipoHdr: { padding:"11px 14px", display:"flex", alignItems:"center", gap:8, cursor:"pointer", borderBottom:"1px solid #F1F5F9" },
  equipoNum: { width:24, height:24, borderRadius:6, background:"#1A2744", color:"#fff", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" },
  equipoLabel:{ fontSize:13, fontWeight:600, color:"#1E293B", flex:1, lineHeight:1.3 },
  stRow:     { borderBottom:"1px solid #F1F5F9", padding:"10px 14px" },
  stDesc:    { fontSize:13, color:"#334155", lineHeight:1.5, marginBottom:8 },
  stFreq:    { fontSize:11, color:"#94A3B8", marginBottom:8, display:"flex", flexWrap:"wrap", gap:4, alignItems:"center" },
  stateBar:  { display:"flex", gap:6, marginBottom:8 },
  stateBtn:  (active, c) => ({ flex:1, padding:"7px 4px", borderRadius:8, fontSize:12, fontWeight:600, border:`1.5px solid ${active?c.border:"#E2E8F0"}`, background:active?c.bg:"#F8FAFC", color:active?c.text:"#94A3B8", cursor:"pointer" }),
  fieldLabel:{ fontSize:11, color:"#64748B", marginBottom:4, display:"block", fontWeight:500 },
  input:     { width:"100%", border:"1.5px solid #E2E8F0", borderRadius:8, padding:"8px 10px", fontSize:14, background:"#F8FAFC", color:"#1E293B", fontFamily:"inherit", boxSizing:"border-box" },
  select:    { width:"100%", border:"1.5px solid #E2E8F0", borderRadius:8, padding:"8px 10px", fontSize:14, background:"#F8FAFC", color:"#1E293B", fontFamily:"inherit" },
  textarea:  { width:"100%", border:"1.5px solid #E2E8F0", borderRadius:8, padding:"8px 10px", fontSize:13, background:"#F8FAFC", color:"#1E293B", fontFamily:"inherit", resize:"vertical", minHeight:56, boxSizing:"border-box" },
  unitSel:   { width:80, border:"1.5px solid #E2E8F0", borderRadius:8, padding:"7px 6px", fontSize:13, background:"#F8FAFC", color:"#1E293B", fontFamily:"inherit" },
  probetaBox:  { background:"#FFFBEB", border:"1.5px solid #FCD34D", borderRadius:10, padding:10, marginBottom:8 },
  probetaTitle:{ fontSize:11, fontWeight:700, color:"#92400E", marginBottom:8 },
  prodRow:   { background:"#fff", borderRadius:8, padding:"8px 10px", marginBottom:6, border:"1px solid #FEF3C7" },
  prodName:  { fontSize:12, fontWeight:600, color:"#78350F", marginBottom:6 },
  inlineRow: { display:"flex", gap:6 },
  inlineField:{ flex:1 },
  tiempoBox:  { background:"#F0F9FF", border:"1.5px solid #7DD3FC", borderRadius:10, padding:10, marginBottom:8 },
  tiempoTitle:{ fontSize:11, fontWeight:700, color:"#075985", marginBottom:8 },
  lavadosBox: { background:"#F0FDF4", border:"1.5px solid #86EFAC", borderRadius:10, padding:12, margin:"0 14px 12px" },
  lavadosTitle:{ fontSize:11, fontWeight:700, color:"#166534", marginBottom:10 },
  lavadosSec: { background:"#fff", borderRadius:8, padding:10, marginBottom:8, border:"1px solid #D1FAE5" },
  lavadosSecTitle:{ fontSize:12, fontWeight:700, color:"#15803D", marginBottom:8 },
  vaciosBox:  { background:"#FFF7ED", border:"1.5px solid #FED7AA", borderRadius:10, padding:10, marginBottom:8 },
  vaciosNote: { fontSize:11, fontWeight:700, color:"#C2410C", background:"#FFEDD5", borderRadius:6, padding:"5px 10px", marginBottom:10, display:"block" },
  turbidezBox:{ background:"#F0F9FF", border:"1.5px solid #BAE6FD", borderRadius:8, padding:"8px 10px", marginBottom:8 },
  nivelesBox: { background:"#F5F3FF", border:"1.5px solid #C4B5FD", borderRadius:10, padding:10, marginBottom:8 },
  nivelesTitle:{ fontSize:11, fontWeight:700, color:"#5B21B6", marginBottom:8 },
  progBar:   () => ({ height:4, borderRadius:2, background:"#E2E8F0", overflow:"hidden" }),
  progFill:  (pct) => ({ height:"100%", width:`${pct}%`, background:pct===100?"#22C55E":"#3B82F6", borderRadius:2, transition:"width 0.3s" }),
  primaryBtn:{ width:"100%", padding:"14px", borderRadius:12, background:"#1A2744", color:"#fff", fontSize:15, fontWeight:700, border:"none", cursor:"pointer", letterSpacing:0.2 },
  versionBtn:(active) => ({ flex:1, padding:"11px 8px", borderRadius:10, fontSize:13, fontWeight:700, textAlign:"center", border:`2px solid ${active?"#1A2744":"#E2E8F0"}`, background:active?"#1A2744":"#F8FAFC", color:active?"#fff":"#94A3B8", cursor:"pointer" }),
  versionBadge:(v) => ({ display:"inline-block", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:v==="lila2"?"#FEF3C7":"#EFF6FF", color:v==="lila2"?"#92400E":"#1D4ED8", marginLeft:6 }),
  chip:      (bg, color) => ({ fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:10, background:bg, color }),
};

// ── FIELD COMPONENTS ──────────────────────────────────────────────────────────
function PhotoFields({ vals, onChange, eqId, stS }) {
  const valsRef = useRef(vals);
  useEffect(() => { valsRef.current = vals; }, [vals]);
  const [compressing, setCompressing] = useState({});
  const [uploading,   setUploading]   = useState({});
  const [driveOk,     setDriveOk]     = useState({});
  const grupos = [{ key:"anterior", label:"📷 Foto estado anterior" }, { key:"posterior", label:"📷 Foto estado posterior" }];

  const handleFile = async (grupo, idx, e) => {
    const file = e.target.files[0]; if (!file) return; e.target.value = "";
    const slotKey = `${grupo}_${idx}`;
    setCompressing(p => ({ ...p, [slotKey]:true }));
    const rawUrl = await new Promise(resolve => { const r = new FileReader(); r.onload = ev => resolve(ev.target.result); r.readAsDataURL(file); });
    const compressed = await compressImage(rawUrl);
    setCompressing(p => ({ ...p, [slotKey]:false }));
    { const cur = valsRef.current||{}; const arr=[...(cur[grupo]||[null,null,null])]; arr[idx]={preview:compressed,driveUrl:null,thumbnail:null}; onChange({...cur,[grupo]:arr}); }
    setUploading(p => ({ ...p, [slotKey]:true })); setDriveOk(p => ({ ...p, [slotKey]:null }));
    try {
      const [header, imageBase64] = compressed.split(",");
      const mimeType = header.match(/:(.*?);/)[1];
      const fechaFolder = new Date().toLocaleDateString("sv-SE",{timeZone:"America/Santiago"}).slice(0,7);
      const equipoFolder = eqId ? `${eqId}_s${stS}` : "general";
      const filename = `${equipoFolder}_${slotKey}_${Date.now()}.jpg`;
      const result = await uploadPhotoToDrive({ imageBase64, mimeType, filename, fechaFolder, equipoFolder });
      setUploading(p=>({...p,[slotKey]:false})); setDriveOk(p=>({...p,[slotKey]:!!result}));
      if (result) { const cur=valsRef.current||{}; const arr=[...(cur[grupo]||[null,null,null])]; arr[idx]={preview:compressed,driveUrl:result.url,thumbnail:result.thumbnail}; onChange({...cur,[grupo]:arr}); }
    } catch (_) { setUploading(p=>({...p,[slotKey]:false})); setDriveOk(p=>({...p,[slotKey]:false})); }
  };
  const handleRemove = (grupo, idx) => {
    const cur=valsRef.current||{}; const arr=[...(cur[grupo]||[null,null,null])]; arr[idx]=null; onChange({...cur,[grupo]:arr});
    const slotKey=`${grupo}_${idx}`; setUploading(p=>({...p,[slotKey]:false})); setDriveOk(p=>({...p,[slotKey]:null}));
  };
  return (
    <div style={{ background:"#EEF2FF", border:"1.5px solid #C7D7FD", borderRadius:10, padding:10, marginBottom:8 }}>
      {grupos.map(({key,label},gi) => (
        <div key={key} style={{ marginBottom:gi===0?10:0 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#3730A3", marginBottom:6 }}>{label}</div>
          <div style={{ display:"flex", gap:8 }}>
            {[0,1,2].map(idx => {
              const slot=(vals?.[key]||[])[idx]; const slotKey=`${key}_${idx}`;
              const isCompress=compressing[slotKey]; const isUp=uploading[slotKey]; const ok=driveOk[slotKey];
              const preview=slot?.preview||(typeof slot==="string"?slot:null); const driveUrl=slot?.driveUrl;
              return (
                <div key={idx} style={{ position:"relative", width:80, height:80, borderRadius:10, border:preview||isCompress?"2px solid #6366F1":"1.5px dashed #A5B4FC", background:preview?"transparent":"#F5F3FF", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {isCompress ? (
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", color:"#6366F1", fontSize:9, gap:4 }}><span style={{fontSize:18}}>⚙️</span><span>Procesando…</span></div>
                  ) : preview ? (
                    <>
                      <img src={preview} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      <div style={{ position:"absolute", bottom:2, left:2, right:2 }}>
                        {isUp && <div style={{ background:"rgba(0,0,0,0.65)", borderRadius:4, padding:"1px 4px", fontSize:9, color:"#FCD34D", textAlign:"center" }}>⏳ Subiendo…</div>}
                        {!isUp && ok===true  && <a href={driveUrl} target="_blank" rel="noreferrer" style={{ display:"block", background:"rgba(21,128,61,0.85)", borderRadius:4, padding:"1px 4px", fontSize:9, color:"#fff", textAlign:"center", textDecoration:"none" }}>✓ Drive</a>}
                        {!isUp && ok===false && <div style={{ background:"rgba(185,28,28,0.8)", borderRadius:4, padding:"1px 4px", fontSize:9, color:"#fff", textAlign:"center" }}>⚠ Error</div>}
                      </div>
                      <button onClick={() => handleRemove(key,idx)} style={{ position:"absolute", top:2, right:2, background:"rgba(0,0,0,0.55)", border:"none", color:"#fff", borderRadius:"50%", width:18, height:18, fontSize:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, lineHeight:1 }}>✕</button>
                    </>
                  ) : (
                    <label style={{ cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#818CF8", fontSize:10, width:"100%", height:"100%" }}>
                      <span style={{fontSize:22}}>📷</span><span style={{marginTop:2}}>Foto {idx+1}</span>
                      <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>handleFile(key,idx,e)} />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function PresionBombasFields({ vals, onChange }) {
  const v=vals||{};
  const getAlert = (val) => { const n=parseFloat(val); if(isNaN(n)||val==="") return null; if(n<2.5) return {msg:"⚠️ Por debajo del mínimo (2,5 bar)",ok:false}; if(n>5) return {msg:"⚠️ Por encima del máximo (5 bar)",ok:false}; return {msg:"✓ Valor en rango (2,5 – 5 bar)",ok:true}; };
  return (
    <div style={{ background:"#FFF7ED", border:"1.5px solid #FED7AA", borderRadius:10, padding:10, marginBottom:8 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#C2410C", marginBottom:8 }}>🔧 Presión manómetros de bomba</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {[["floodaf","Presión bomba Floodaf (bar)"],["saturno","Presión bomba Saturno (bar)"]].map(([key,label]) => {
          const alert=getAlert(v[key]||"");
          return (
            <div key={key}>
              <label style={S.fieldLabel}>{label}</label>
              <input style={{...S.input,fontSize:13,borderColor:alert?(alert.ok?"#86EFAC":"#FCA5A5"):"#E2E8F0"}} type="number" min="0" max="11" step="0.1" placeholder="0.0" value={v[key]||""} onChange={e=>onChange({...v,[key]:e.target.value})} />
              {alert && <div style={{ fontSize:10, fontWeight:600, marginTop:3, padding:"2px 6px", borderRadius:5, background:alert.ok?"#F0FDF4":"#FEF2F2", color:alert.ok?"#15803D":"#B91C1C" }}>{alert.msg}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FrecuenciasVFFields({ vals, onChange }) {
  const v=vals||{};
  return (
    <div style={{ background:"#F0F9FF", border:"1.5px solid #7DD3FC", borderRadius:10, padding:10, marginBottom:8 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#075985", marginBottom:8 }}>⚡ Frecuencia VF (Hz)</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {[["floodaf","Frecuencia (Hz) Floodaf"],["saturno","Frecuencia (Hz) Saturno"]].map(([key,label]) => (
          <div key={key}><label style={S.fieldLabel}>{label}</label><input style={{...S.input,fontSize:13}} type="number" min="0" max="50" step="0.1" placeholder="0.0" value={v[key]||""} onChange={e=>onChange({...v,[key]:e.target.value})} /></div>
        ))}
      </div>
    </div>
  );
}

function FrecuenciasBombaFields({ vals, onChange }) {
  const v=vals||{};
  return (
    <div style={{ background:"#FFF1F2", border:"1.5px solid #FECDD3", borderRadius:10, padding:10, marginBottom:8 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#BE123C", marginBottom:8 }}>📊 Parámetros de frecuencia</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
        <div><label style={S.fieldLabel}>Frecuencia bomba (Hz)</label><input style={{...S.input,fontSize:13}} type="number" min="0" max="50" step="0.1" placeholder="0.0" value={v.hz||""} onChange={e=>onChange({...v,hz:e.target.value})} /></div>
        <div><label style={S.fieldLabel}>Presión manómetro</label><input style={{...S.input,fontSize:13}} type="number" min="0" max="11" step="0.1" placeholder="0.0" value={v.presion||""} onChange={e=>onChange({...v,presion:e.target.value})} /></div>
        <div><label style={S.fieldLabel}>Índice preparador</label><input style={{...S.input,fontSize:13}} type="number" min="0" step="0.1" placeholder="0.0" value={v.indice||""} onChange={e=>onChange({...v,indice:e.target.value})} /></div>
      </div>
    </div>
  );
}

function ParametrosProceso({ vals, onChange }) {
  const v=vals||{};
  return (
    <div style={{ background:"#F5F3FF", border:"1.5px solid #C4B5FD", borderRadius:10, padding:10, marginBottom:8 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#5B21B6", marginBottom:8 }}>📊 Parámetros de proceso</div>
      <div style={{ marginBottom:6 }}><label style={S.fieldLabel}>Flujo de entrada</label><input style={{...S.input,fontSize:13}} type="number" min="0" step="0.1" placeholder="0.0" value={v.flujo_entrada||""} onChange={e=>onChange({...v,flujo_entrada:e.target.value})} /></div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
        {[1,2,3].map(n => <div key={n}><label style={S.fieldLabel}>Vel. barredor {n}</label><input style={{...S.input,fontSize:13}} type="number" min="0" step="0.1" placeholder="0.0" value={v[`vel_barredor${n}`]||""} onChange={e=>onChange({...v,[`vel_barredor${n}`]:e.target.value})} /></div>)}
      </div>
    </div>
  );
}

function ToberasFields({ vals, onChange }) {
  const v=vals||{};
  return (
    <div style={{ background:"#FFF7ED", border:"1.5px solid #FED7AA", borderRadius:10, padding:10, marginBottom:8 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#C2410C", marginBottom:8 }}>🚿 N° Toberas obstruidas</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
        {[["tela","Regadera Tela"],["pano_sup","Regadera Paño sup."],["pano_inf","Regadera Paño inf."]].map(([key,label]) => (
          <div key={key}><label style={S.fieldLabel}>{label}</label><input style={{...S.input,fontSize:13}} type="number" min="0" step="1" placeholder="0" value={v[key]||""} onChange={e=>onChange({...v,[key]:e.target.value})} /></div>
        ))}
      </div>
    </div>
  );
}

function PhLavadoFields({ vals, onChange }) {
  const v=vals||{};
  return (
    <div style={{ background:"#F0FDF4", border:"1.5px solid #86EFAC", borderRadius:10, padding:10, marginBottom:8 }}>
      <div style={{ fontSize:11, fontWeight:700, color:"#166534", marginBottom:8 }}>🧪 pH lavado — Tela y Paño</div>
      {[["tela","Tela"],["pano","Paño"]].map(([prefix,lbl]) => (
        <div key={prefix} style={{ background:"#fff", borderRadius:8, padding:8, marginBottom:6, border:"1px solid #BBF7D0" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#15803D", marginBottom:6 }}>{lbl}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            <div><label style={S.fieldLabel}>pH lavado alcalino</label><input style={{...S.input,fontSize:13}} type="number" min="0" max="14" step="0.1" placeholder="0.0" value={v[`${prefix}_alc`]||""} onChange={e=>onChange({...v,[`${prefix}_alc`]:e.target.value})} /></div>
            <div><label style={S.fieldLabel}>pH lavado ácido</label><input style={{...S.input,fontSize:13}} type="number" min="0" max="14" step="0.1" placeholder="0.0" value={v[`${prefix}_ac`]||""} onChange={e=>onChange({...v,[`${prefix}_ac`]:e.target.value})} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProbetaFields({ productos, vals, onChange }) {
  return (
    <div style={S.probetaBox}>
      <div style={S.probetaTitle}>🧪 Medición por probeta</div>
      {productos.map(prod => {
        const v=vals[prod]||{flujo_teo:"",flujo_real:"",unidad:"ml/min"};
        return (
          <div key={prod} style={S.prodRow}>
            <div style={S.prodName}>{prod}</div>
            <div style={S.inlineRow}>
              <div style={S.inlineField}><label style={S.fieldLabel}>Flujo teórico</label><input style={{...S.input,padding:"7px 8px",fontSize:13}} type="number" min="0" step="0.1" placeholder="0.0" value={v.flujo_teo} onChange={e=>onChange(prod,{...v,flujo_teo:e.target.value})} /></div>
              <div style={S.inlineField}><label style={S.fieldLabel}>Flujo real</label><input style={{...S.input,padding:"7px 8px",fontSize:13}} type="number" min="0" step="0.1" placeholder="0.0" value={v.flujo_real} onChange={e=>onChange(prod,{...v,flujo_real:e.target.value})} /></div>
              <div><label style={S.fieldLabel}>Unidad</label><select style={S.unitSel} value={v.unidad} onChange={e=>onChange(prod,{...v,unidad:e.target.value})}>{FLOW_UNITS.map(u=><option key={u}>{u}</option>)}</select></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TiempoFields({ productos, vals, onChange }) {
  return (
    <div style={S.tiempoBox}>
      <div style={S.tiempoTitle}>⏱ Tiempos de dosificación</div>
      {productos.map(prod => {
        const v=vals[prod]||{valor:"",unidad:"s"};
        return (
          <div key={prod} style={{...S.prodRow,border:"1px solid #BAE6FD",marginBottom:6}}>
            <div style={{...S.prodName,color:"#075985"}}>{prod}</div>
            <div style={{display:"flex",gap:6,alignItems:"flex-end"}}>
              <div style={{flex:1}}><input style={{...S.input,padding:"7px 8px",fontSize:13}} type="number" min="0" step="0.1" placeholder="0.0" value={v.valor} onChange={e=>onChange(prod,{...v,valor:e.target.value})} /></div>
              <div><select style={S.unitSel} value={v.unidad} onChange={e=>onChange(prod,{...v,unidad:e.target.value})}>{TIME_UNITS.map(u=><option key={u}>{u}</option>)}</select></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LavadosFields({ vals, onChange }) {
  const secciones=[{key:"paño",label:"1 Paño"},{key:"tela",label:"2 Tela"}];
  const empty={n_lavados:"",flujo_alc:"",flujo_ac:"",t_alc:"",t_ac:""};
  return (
    <div style={S.lavadosBox}>
      <div style={S.lavadosTitle}>🧺 Datos de lavado por vestimenta</div>
      {secciones.map(({key,label}) => {
        const v=(vals||{})[key]||empty;
        return (
          <div key={key} style={S.lavadosSec}>
            <div style={S.lavadosSecTitle}>{label}</div>
            <div style={{marginBottom:6}}><label style={S.fieldLabel}>N° Lavados</label><input style={{...S.input,fontSize:13}} type="number" min="0" placeholder="0" value={v.n_lavados} onChange={e=>onChange(key,{...v,n_lavados:e.target.value})} /></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              <div><label style={S.fieldLabel}>Flujo Alcalino</label><input style={{...S.input,fontSize:13}} type="number" min="0" step="0.1" placeholder="0.0" value={v.flujo_alc} onChange={e=>onChange(key,{...v,flujo_alc:e.target.value})} /></div>
              <div><label style={S.fieldLabel}>Flujo Ácido</label><input style={{...S.input,fontSize:13}} type="number" min="0" step="0.1" placeholder="0.0" value={v.flujo_ac} onChange={e=>onChange(key,{...v,flujo_ac:e.target.value})} /></div>
              <div><label style={S.fieldLabel}>Tiempo Alcalino</label><input style={{...S.input,fontSize:13}} type="number" min="0" step="0.1" placeholder="0.0" value={v.t_alc} onChange={e=>onChange(key,{...v,t_alc:e.target.value})} /></div>
              <div><label style={S.fieldLabel}>Tiempo Ácido</label><input style={{...S.input,fontSize:13}} type="number" min="0" step="0.1" placeholder="0.0" value={v.t_ac} onChange={e=>onChange(key,{...v,t_ac:e.target.value})} /></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VaciosFields({ vals, onChange }) {
  const v=vals||{sifon1:"",sifon2:"",prensa:""};
  return (
    <div style={S.vaciosBox}>
      <span style={S.vaciosNote}>⚠️ Valores deben ser obtenidos de terreno</span>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[["sifon1","Vacío Sifón 1"],["sifon2","Vacío Sifón 2"],["prensa","Vacío Prensa"]].map(([k,lbl]) => (
          <div key={k}><label style={S.fieldLabel}>{lbl}</label><input style={{...S.input,fontSize:13}} type="number" step="0.01" placeholder="0.00" value={v[k]} onChange={e=>onChange({...v,[k]:e.target.value})} /></div>
        ))}
      </div>
    </div>
  );
}

// ── SUBTASK ROW ───────────────────────────────────────────────────────────────
function SubtaskRow({ st, eqId, vals, onChange }) {
  const key=`${eqId}_${st.s}`;
  const v=vals[key]||{ estado:"", obs:"", probeta:{}, tiempos:{}, vacios:{}, turbidez:"", niveles:{}, fotos:{}, presionBombas:{}, frecuenciasVF:{}, indiceConcentracion:"", parametrosProceso:{}, toberas:{}, phLavado:{}, frecuenciasBomba:{} };
  return (
    <div style={S.stRow}>
      <div style={S.stDesc}>{st.desc}</div>
      <div style={S.stFreq}>
        <span>{st.f>1?`🔁 ${st.f}x por turno`:"1x por turno"}</span>
        {st.soloAM           && <span style={S.chip("#FEF9C3","#854D0E")}>☀️ Solo AM</span>}
        {st.fotos            && <span style={S.chip("#EEF2FF","#3730A3")}>📷 Fotos</span>}
        {st.presionBombas    && <span style={S.chip("#FFF7ED","#C2410C")}>🔧 Presión</span>}
        {st.frecuenciasVF    && <span style={S.chip("#F0F9FF","#075985")}>⚡ Hz VF</span>}
        {st.indiceConcentracion && <span style={S.chip("#F0FDF4","#166534")}>📏 Índice</span>}
        {st.probeta          && <span style={S.chip("#FEF3C7","#92400E")}>🧪 Probeta</span>}
        {st.tiempos          && <span style={S.chip("#E0F2FE","#075985")}>⏱ Tiempos</span>}
        {st.vacios           && <span style={S.chip("#FFEDD5","#C2410C")}>📊 Vacíos</span>}
        {st.turbidez         && <span style={S.chip("#E0F2FE","#0369A1")}>💧 Turbidez</span>}
        {st.niveles          && <span style={S.chip("#EDE9FE","#5B21B6")}>📈 Niveles</span>}
        {st.parametrosProceso && <span style={S.chip("#F5F3FF","#5B21B6")}>📊 Parámetros</span>}
        {st.toberas          && <span style={S.chip("#FFF7ED","#C2410C")}>🚿 Toberas</span>}
        {st.phLavado         && <span style={S.chip("#F0FDF4","#166534")}>🧪 pH</span>}
        {st.frecuenciasBomba && <span style={S.chip("#FFF1F2","#BE123C")}>📊 Frecuencias</span>}
      </div>
      <div style={S.stateBar}>
        {STATE_LABELS.map(lbl => (
          <button key={lbl} style={S.stateBtn(v.estado===lbl,STATE_COLORS[lbl])}
            onClick={()=>onChange(key,{...v,estado:v.estado===lbl?"":lbl})}>
            {lbl==="Hecho"?"✓":lbl==="No OK"?"✗":lbl==="Pendiente"?"⏳":"—"} {lbl}
          </button>
        ))}
      </div>
      {st.fotos            && <PhotoFields vals={v.fotos} onChange={fv=>onChange(key,{...v,fotos:fv})} eqId={eqId} stS={st.s} />}
      {st.presionBombas    && <PresionBombasFields vals={v.presionBombas} onChange={pv=>onChange(key,{...v,presionBombas:pv})} />}
      {st.frecuenciasVF    && <FrecuenciasVFFields vals={v.frecuenciasVF} onChange={fv=>onChange(key,{...v,frecuenciasVF:fv})} />}
      {st.indiceConcentracion && (
        <div style={{background:"#F0FDF4",border:"1.5px solid #86EFAC",borderRadius:10,padding:10,marginBottom:8}}>
          <label style={{...S.fieldLabel,fontWeight:700,color:"#166534"}}>📏 Índice de concentración (0–40)</label>
          <input style={{...S.input,fontSize:13}} type="number" min="0" max="40" step="0.1" placeholder="0.0" value={v.indiceConcentracion||""} onChange={e=>onChange(key,{...v,indiceConcentracion:e.target.value})} />
        </div>
      )}
      {st.probeta          && <ProbetaFields productos={st.productos} vals={v.probeta} onChange={(p,pv)=>onChange(key,{...v,probeta:{...v.probeta,[p]:pv}})} />}
      {st.tiempos          && <TiempoFields productos={st.productos_tiempo} vals={v.tiempos} onChange={(p,tv)=>onChange(key,{...v,tiempos:{...v.tiempos,[p]:tv}})} />}
      {st.vacios           && <VaciosFields vals={v.vacios} onChange={vv=>onChange(key,{...v,vacios:vv})} />}
      {st.turbidez && (
        <div style={S.turbidezBox}><label style={{...S.fieldLabel,color:"#0369A1",fontWeight:700}}>💧 Valor de turbidez (NTU)</label><input style={{...S.input,fontSize:13}} type="number" min="0" step="0.1" placeholder="0.0" value={v.turbidez||""} onChange={e=>onChange(key,{...v,turbidez:e.target.value})} /></div>
      )}
      {st.niveles && (
        <div style={S.nivelesBox}>
          <div style={S.nivelesTitle}>📈 Valores de operación</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            <div><label style={S.fieldLabel}>Nivel (0–100)</label><input style={{...S.input,fontSize:13}} type="number" min="0" max="100" step="0.1" placeholder="0.0" value={(v.niveles||{}).nivel||""} onChange={e=>onChange(key,{...v,niveles:{...(v.niveles||{}),nivel:e.target.value}})} /></div>
            <div><label style={S.fieldLabel}>Flujo de aire</label><input style={{...S.input,fontSize:13}} type="number" min="0" step="0.1" placeholder="0.0" value={(v.niveles||{}).flujo_aire||""} onChange={e=>onChange(key,{...v,niveles:{...(v.niveles||{}),flujo_aire:e.target.value}})} /></div>
            <div><label style={S.fieldLabel}>Flujo de entrada</label><input style={{...S.input,fontSize:13}} type="number" min="0" step="0.1" placeholder="0.0" value={(v.niveles||{}).flujo_entrada||""} onChange={e=>onChange(key,{...v,niveles:{...(v.niveles||{}),flujo_entrada:e.target.value}})} /></div>
          </div>
        </div>
      )}
      {st.parametrosProceso && <ParametrosProceso vals={v.parametrosProceso} onChange={pv=>onChange(key,{...v,parametrosProceso:pv})} />}
      {st.toberas          && <ToberasFields vals={v.toberas} onChange={tv=>onChange(key,{...v,toberas:tv})} />}
      {st.phLavado         && <PhLavadoFields vals={v.phLavado} onChange={phv=>onChange(key,{...v,phLavado:phv})} />}
      {st.frecuenciasBomba && <FrecuenciasBombaFields vals={v.frecuenciasBomba} onChange={fbv=>onChange(key,{...v,frecuenciasBomba:fbv})} />}
      <textarea style={S.textarea} placeholder="Observación (opcional)..." value={v.obs} onChange={e=>onChange(key,{...v,obs:e.target.value})} />
    </div>
  );
}

function EquipoBlock({ eq, vals, onChange, version, turno }) {
  const [open,setOpen]=useState(false);
  const visibleSt=eq.subtareas.filter(st=>!st.soloAM||turno==="AM");
  const done=visibleSt.filter(st=>(vals[`${eq.id}_${st.s}`]||{}).estado).length;
  const pct=visibleSt.length>0?Math.round(done/visibleSt.length*100):0;
  const lavKey=`${eq.id}_lavados`;
  return (
    <div style={{borderBottom:"1px solid #F1F5F9"}}>
      <div style={S.equipoHdr} onClick={()=>setOpen(o=>!o)}>
        <div style={S.equipoNum}>{eq.n}</div>
        <div style={{flex:1}}>
          <div style={S.equipoLabel}>{eq.label}</div>
          <div style={{fontSize:10,color:"#94A3B8",marginTop:2}}>{eq.accion} · {done}/{visibleSt.length} tareas{eq.epp?` · ${eq.epp.substring(0,30)}${eq.epp.length>30?"…":""}`:""}</div>
          <div style={{...S.progBar(),marginTop:4}}><div style={S.progFill(pct)}/></div>
        </div>
        <span style={{fontSize:18,color:"#94A3B8",marginLeft:6,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s",display:"block"}}>▾</span>
      </div>
      {open && (
        <div>
          {eq.consolidado && <div style={{background:"#EFF6FF",padding:"6px 14px",fontSize:11,color:"#1D4ED8",borderBottom:"1px solid #DBEAFE"}}>📌 Sección incluye bombas de sala aditivos y sala azul</div>}
          {visibleSt.map(st=><SubtaskRow key={st.s} st={st} eqId={eq.id} vals={vals} onChange={onChange} />)}
          {eq.lavadosFields&&version==="lila1"&&<LavadosFields vals={vals[lavKey]||{}} onChange={(sec,v)=>onChange(lavKey,{...(vals[lavKey]||{}),[sec]:v})} />}
        </div>
      )}
    </div>
  );
}

function SectorBlock({ sec, vals, onChange, version, turno }) {
  const [open,setOpen]=useState(true);
  const style=SECTOR_STYLES[sec.id];
  const allVis=sec.equipos.flatMap(e=>e.subtareas.filter(st=>!st.soloAM||turno==="AM"));
  const done=allVis.filter(st=>{ const eq=sec.equipos.find(e=>e.subtareas.includes(st)); return eq&&(vals[`${eq.id}_${st.s}`]||{}).estado; }).length;
  return (
    <div style={S.card}>
      <div style={S.sectionHdr(style)} onClick={()=>setOpen(o=>!o)}>
        <span style={{fontSize:18}}>{style.icon}</span>
        <div style={{flex:1}}>
          <div style={S.sectionHdrText(style)}>{sec.label}</div>
          <div style={{fontSize:10,color:style.text,opacity:0.7}}>{done}/{allVis.length} tareas completadas</div>
        </div>
        <span style={{color:style.text,fontSize:16,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s",display:"block"}}>▾</span>
      </div>
      {open&&sec.equipos.map(eq=><EquipoBlock key={eq.id} eq={eq} vals={vals} onChange={onChange} version={version} turno={turno}/>)}
    </div>
  );
}

// ── LILA MODULE (export) ──────────────────────────────────────────────────────
export default function LilaModule({ usuario, showToast }) {
  const [version, setVersion] = useState("lila1");
  const [turno,   setTurno]   = useState("AM");
  const [fecha,   setFecha]   = useState(todayStr());
  const [obsGen,  setObsGen]  = useState("");
  const [vals,    setVals]    = useState({});
  const handleVal = useCallback((key, v) => setVals(prev => ({ ...prev, [key]: v })), []);

  const filtrarPorPermiso = (secs) => {
    if (!usuario || usuario.admin) return secs;
    return secs.filter(sec => usuario.secciones?.[sec.id] === true);
  };
  const baseSectores    = version === "lila2" ? getSectoresLila2() : SECTORES;
  const activeSectores  = filtrarPorPermiso(baseSectores);
  const allSt           = activeSectores.flatMap(s => s.equipos.flatMap(e => e.subtareas.filter(st => !st.soloAM || turno === "AM").map(st => ({ eqId: e.id, st }))));
  const doneCount       = allSt.filter(({ eqId, st }) => (vals[`${eqId}_${st.s}`] || {}).estado).length;
  const total           = allSt.length;
  const pctGlobal       = total > 0 ? Math.round(doneCount / total * 100) : 0;

  const guardar = () => {
    const tasks = [];
    activeSectores.forEach(sec => sec.equipos.forEach(eq => {
      eq.subtareas.filter(st => !st.soloAM || turno === "AM").forEach(st => {
        const v = vals[`${eq.id}_${st.s}`] || {};
        const fotosAnt  = (v.fotos?.anterior  || []).filter(Boolean);
        const fotosPost = (v.fotos?.posterior || []).filter(Boolean);
        tasks.push({
          sector:sec.label, equipo:eq.label, n_equipo:eq.n, subtarea:st.s, desc:st.desc,
          estado:v.estado||"Pendiente", obs:v.obs||"",
          probeta:v.probeta||{}, tiempos:v.tiempos||{}, vacios:v.vacios||{}, turbidez:v.turbidez||"", niveles:v.niveles||{},
          fotos_anterior:fotosAnt.length, fotos_posterior:fotosPost.length,
          fotos_anterior_urls:fotosAnt.map(p=>p?.driveUrl).filter(Boolean),
          fotos_posterior_urls:fotosPost.map(p=>p?.driveUrl).filter(Boolean),
          presionBombas:v.presionBombas||{}, frecuenciasVF:v.frecuenciasVF||{}, indiceConcentracion:v.indiceConcentracion||"",
          parametrosProceso:v.parametrosProceso||{}, toberas:v.toberas||{}, phLavado:v.phLavado||{}, frecuenciasBomba:v.frecuenciasBomba||{},
        });
      });
    }));
    const reg = { id:Date.now(), ts:nowSantiago(), fecha, turno, tecnico:usuario?.nombre||"", version, obs_gen:obsGen, tasks };
    sendLilaRecord(reg);
    setVals({}); setObsGen(""); setFecha(todayStr());
    showToast("✅ Registro guardado · enviando a Sheets…");
  };

  return (
    <div style={S.page}>
      {/* Barra progreso */}
      <div style={{ background:"#fff", borderRadius:12, boxShadow:"0 1px 4px rgba(0,0,0,0.07)", marginBottom:12, padding:"10px 14px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#64748B", marginBottom:4 }}>
          <span>{doneCount}/{total} tareas completadas</span>
          <span style={{ fontWeight:700, color:pctGlobal===100?"#16A34A":"#3B82F6" }}>{pctGlobal}%</span>
        </div>
        <div style={S.progBar()}><div style={S.progFill(pctGlobal)}/></div>
      </div>

      {/* Versión */}
      <div style={S.card}>
        <div style={S.cardPad}>
          <div style={{ fontSize:11, fontWeight:600, color:"#64748B", marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>Versión de ronda</div>
          <div style={{ display:"flex", gap:8 }}>
            <button style={S.versionBtn(version==="lila1")} onClick={()=>setVersion("lila1")}>📋 LILA Completa</button>
            <button style={S.versionBtn(version==="lila2")} onClick={()=>setVersion("lila2")}>⚡ LILA 2 · Turno rápido</button>
          </div>
          {version==="lila2"&&<div style={{fontSize:11,color:"#92400E",background:"#FEF9C3",borderRadius:8,padding:"6px 10px",marginTop:8}}>Selección explícita de equipos y subtareas</div>}
        </div>
      </div>

      {/* Datos generales */}
      <div style={S.card}>
        <div style={S.cardPad}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={{ fontSize:11, color:"#64748B", marginBottom:4, display:"block", fontWeight:500 }}>Técnico</label>
              <div style={{ ...S.input, background:"#F1F5F9", color:"#475569", display:"flex", alignItems:"center" }}>{usuario?.nombre}</div>
            </div>
            <div>
              <label style={{ fontSize:11, color:"#64748B", marginBottom:4, display:"block", fontWeight:500 }}>Turno *</label>
              <select style={S.select} value={turno} onChange={e=>setTurno(e.target.value)}>
                <option value="AM">Turno AM</option>
                <option value="PM">Turno PM</option>
              </select>
            </div>
            <div style={{ gridColumn:"1 / -1" }}>
              <label style={{ fontSize:11, color:"#64748B", marginBottom:4, display:"block", fontWeight:500 }}>Fecha</label>
              <input style={S.input} type="date" value={fecha} onChange={e=>setFecha(e.target.value)} />
            </div>
          </div>
          {turno==="PM"&&<div style={{fontSize:11,color:"#0369A1",background:"#E0F2FE",borderRadius:8,padding:"6px 10px",marginTop:10}}>🌙 Turno PM: tareas "Solo AM" ocultas</div>}
        </div>
      </div>

      {activeSectores.length===0&&(
        <div style={{textAlign:"center",color:"#94A3B8",padding:"40px 0",fontSize:14}}>
          <div style={{fontSize:32,marginBottom:8}}>🔒</div>Sin secciones asignadas a tu perfil
        </div>
      )}

      {activeSectores.map(sec=><SectorBlock key={sec.id} sec={sec} vals={vals} onChange={handleVal} version={version} turno={turno}/>)}

      {activeSectores.length>0&&(
        <>
          <div style={S.card}>
            <div style={S.cardPad}>
              <label style={{fontSize:13,fontWeight:700,color:"#1E293B",marginBottom:8,display:"block"}}>💬 Observación general del turno</label>
              <textarea style={{...S.textarea,minHeight:100}} placeholder="Novedades del turno, incidentes, condiciones especiales…" value={obsGen} onChange={e=>setObsGen(e.target.value)} />
            </div>
          </div>
          <button style={S.primaryBtn} onClick={guardar}>💾 Guardar registro LILA</button>
        </>
      )}
    </div>
  );
}
