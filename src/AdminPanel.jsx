import { useState } from "react";
import { PRODUCTOS_NIVELES } from "./data.js";
import { saveConfig, invalidateConfigCache } from "./api.js";

const S = {
  overlay:  { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" },
  sheet:    { background: "#fff", borderRadius: "20px 20px 0 0", padding: "0 0 40px", maxHeight: "85vh", overflowY: "auto" },
  handle:   { width: 40, height: 4, borderRadius: 2, background: "#CBD5E1", margin: "12px auto 0" },
  header:   { padding: "16px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9" },
  title:    { fontSize: 16, fontWeight: 700, color: "#1E293B" },
  closeBtn: { background: "none", border: "none", fontSize: 20, color: "#94A3B8", cursor: "pointer" },
  row:      { display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #F8FAFC", gap: 10 },
  prodName: { flex: 1, fontSize: 13, color: "#334155", fontWeight: 500 },
  zona:     { fontSize: 10, color: "#94A3B8", display: "block" },
  toggle:   (active) => ({
    width: 44, height: 24, borderRadius: 12,
    background: active ? "#1A2744" : "#E2E8F0",
    border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
  }),
  toggleDot:(active) => ({
    position: "absolute", top: 3, left: active ? 23 : 3,
    width: 18, height: 18, borderRadius: 9,
    background: "#fff", transition: "left 0.2s",
  }),
  saveBtn:  { margin: "12px 16px 0", width: "calc(100% - 32px)", padding: "13px", borderRadius: 12, background: "#1A2744", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" },
};

const ZONA_ICONS = { "Sala Aditivos":"🧪", "PRP":"🔬", "Máquina":"⚙️", "Dispersión":"🔀", "Pulpa":"📦" };

export default function AdminPanel({ config, onClose, onSaved }) {
  // config = { p01: true, p02: false, … }  → true/undefined = activo, false = inactivo
  const [local, setLocal] = useState(() => {
    const out = {};
    PRODUCTOS_NIVELES.forEach(p => { out[p.id] = config[p.id] !== false; });
    return out;
  });
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setLocal(prev => ({ ...prev, [id]: !prev[id] }));

  const handleSave = async () => {
    setSaving(true);
    await saveConfig(local);
    invalidateConfigCache();
    onSaved(local);
    setSaving(false);
    onClose();
  };

  // Agrupar por zona
  const zonas = [...new Set(PRODUCTOS_NIVELES.map(p => p.zona))];

  const activeCount = Object.values(local).filter(Boolean).length;

  return (
    <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.sheet}>
        <div style={S.handle} />
        <div style={S.header}>
          <div style={S.title}>⚙️ Gestión de productos <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 400 }}>({activeCount}/{PRODUCTOS_NIVELES.length} activos)</span></div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        {zonas.map(zona => (
          <div key={zona}>
            {/* Encabezado de zona */}
            <div style={{ padding: "8px 16px 4px", background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.4 }}>
                {ZONA_ICONS[zona] || "📦"} {zona}
              </span>
            </div>
            {PRODUCTOS_NIVELES.filter(p => p.zona === zona).map(prod => (
              <div key={prod.id} style={S.row}>
                <div style={{ flex: 1 }}>
                  <div style={S.prodName}>{prod.label}</div>
                  <span style={S.zona}>{prod.unit}</span>
                </div>
                <button style={S.toggle(local[prod.id])} onClick={() => toggle(prod.id)}>
                  <div style={S.toggleDot(local[prod.id])} />
                </button>
              </div>
            ))}
          </div>
        ))}

        <button style={{ ...S.saveBtn, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
          {saving ? "⏳ Guardando…" : "💾 Guardar configuración"}
        </button>
      </div>
    </div>
  );
}
