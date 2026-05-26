import { useState, useEffect } from "react";
import { PRODUCTOS_NIVELES, ZONAS_NIVELES } from "./data.js";
import { saveNiveles, fetchLastNiveles, todayStr, nowSantiago } from "./api.js";

// ── ESTILOS LOCALES ───────────────────────────────────────────────────────────
const S = {
  page:     { padding: "12px 12px 100px" },
  card:     { background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 12, overflow: "hidden" },
  cardPad:  { padding: "14px 14px" },
  label:    { fontSize: 11, color: "#64748B", marginBottom: 4, display: "block", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 },
  input:    { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", fontSize: 16, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit", boxSizing: "border-box" },
  select:   { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", fontSize: 14, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit" },
  primaryBtn: { width: "100%", padding: "14px", borderRadius: 12, background: "#1A2744", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" },
  sectionHdr: (c) => ({ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, background: c.bg, borderBottom: `1.5px solid ${c.border}`, cursor: "pointer", borderRadius: 0 }),
  sectionHdrText: (c) => ({ fontSize: 13, fontWeight: 700, color: c.text, flex: 1 }),
  // product card
  prodCard: { padding: "12px 14px", borderBottom: "1px solid #F1F5F9" },
  prodLabel: { fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 4 },
  prodRef:   { fontSize: 11, color: "#94A3B8", marginBottom: 8 },
  row:       { display: "flex", gap: 8, alignItems: "flex-end" },
  trasBtn:   (active) => ({
    padding: "10px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, flexShrink: 0,
    border: `1.5px solid ${active ? "#F97316" : "#E2E8F0"}`,
    background: active ? "#FFF7ED" : "#F8FAFC",
    color: active ? "#C2410C" : "#94A3B8",
    cursor: "pointer", whiteSpace: "nowrap",
  }),
};

// ── PRODUCTO CARD ─────────────────────────────────────────────────────────────
function ProductCard({ prod, valor, trasvasije, lastVal, onChange }) {
  return (
    <div style={S.prodCard}>
      <div style={S.prodLabel}>{prod.label}</div>
      <div style={S.prodRef}>
        {lastVal !== undefined && lastVal !== ""
          ? `Último: ${lastVal} ${prod.unit}`
          : "Sin registro previo"}
      </div>
      <div style={S.row}>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Nivel actual ({prod.unit})</label>
          <input
            style={{ ...S.input, fontSize: 20, fontWeight: 700, textAlign: "center" }}
            type="number" inputMode="decimal" min="0" step="0.1"
            placeholder="—"
            value={valor}
            onChange={e => onChange({ valor: e.target.value, trasvasije })}
          />
        </div>
        <div>
          <label style={{ ...S.label, textAlign: "center", display: "block", marginBottom: 4 }}>Trasvasije</label>
          <button
            style={S.trasBtn(trasvasije)}
            onClick={() => onChange({ valor, trasvasije: !trasvasije })}
          >
            {trasvasije ? "🔄 Sí" : "– No"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ZONA SECTION ──────────────────────────────────────────────────────────────
function ZonaSection({ zona, productos, vals, lastNiveles, onChange }) {
  const [open, setOpen] = useState(true);
  const c = ZONAS_NIVELES.find(z => z.id === zona) || { bg: "#F8FAFC", border: "#E2E8F0", text: "#334155", icon: "📦" };
  const filled = productos.filter(p => (vals[p.id]?.valor || "") !== "").length;
  return (
    <div style={{ borderBottom: `1px solid ${c.border}20` }}>
      <div style={S.sectionHdr(c)} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 18 }}>{c.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={S.sectionHdrText(c)}>{zona}</div>
          <div style={{ fontSize: 10, color: c.text, opacity: 0.7 }}>{filled}/{productos.length} ingresados</div>
        </div>
        <span style={{ color: c.text, fontSize: 16, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", display:"block" }}>▾</span>
      </div>
      {open && productos.map(prod => (
        <ProductCard
          key={prod.id}
          prod={prod}
          valor={(vals[prod.id]?.valor) || ""}
          trasvasije={(vals[prod.id]?.trasvasije) || false}
          lastVal={lastNiveles[prod.id]}
          onChange={v => onChange(prod.id, v)}
        />
      ))}
    </div>
  );
}

// ── MAIN MODULE ───────────────────────────────────────────────────────────────
export default function NivelesModule({ usuario, config, showToast }) {
  const [fecha,       setFecha]       = useState(todayStr());
  const [turno,       setTurno]       = useState("AM");
  const [vals,        setVals]        = useState({});          // { p01: { valor:"", trasvasije:false } }
  const [lastNiveles, setLastNiveles] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);

  // Carga referencia último ingreso
  useEffect(() => {
    fetchLastNiveles()
      .then(data => setLastNiveles(data))
      .finally(() => setLoading(false));
  }, []);

  // Productos activos según configuración del admin
  const activeProds = PRODUCTOS_NIVELES.filter(p => {
    if (!config || Object.keys(config).length === 0) return true; // sin config → mostrar todos
    return config[p.id] !== false; // false = inactivo
  });

  // Zonas que tienen al menos un producto activo
  const zonas = [...new Set(activeProds.map(p => p.zona))];

  const handleChange = (id, v) => setVals(prev => ({ ...prev, [id]: v }));

  const filledCount = activeProds.filter(p => (vals[p.id]?.valor || "") !== "").length;
  const pct = activeProds.length > 0 ? Math.round(filledCount / activeProds.length * 100) : 0;

  const guardar = async () => {
    const ingresados = activeProds.filter(p => (vals[p.id]?.valor || "") !== "");
    if (ingresados.length === 0) { showToast("⚠️ Ingresa al menos un nivel"); return; }
    setSaving(true);
    const valores    = {};
    const trasvasijes = {};
    activeProds.forEach(p => {
      valores[p.id]     = vals[p.id]?.valor     || "";
      trasvasijes[p.id] = vals[p.id]?.trasvasije || false;
    });
    await saveNiveles({
      fecha, turno, hora: nowSantiago().split("T")[1].slice(0, 5),
      tecnico: usuario?.nombre || "",
      valores, trasvasijes,
    });
    showToast("✅ Niveles guardados · enviando a Sheets…");
    setVals({});
    setSaving(false);
  };

  return (
    <div style={S.page}>
      {/* Encabezado fecha/turno */}
      <div style={S.card}>
        <div style={S.cardPad}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={S.label}>Fecha</label>
              <input style={S.input} type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Turno</label>
              <select style={S.select} value={turno} onChange={e => setTurno(e.target.value)}>
                <option value="AM">Turno AM</option>
                <option value="PM">Turno PM</option>
              </select>
            </div>
          </div>
          {/* Barra de progreso */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748B", marginBottom: 4 }}>
              <span>{filledCount}/{activeProds.length} productos ingresados</span>
              <span style={{ fontWeight: 700, color: pct === 100 ? "#16A34A" : "#3B82F6" }}>{pct}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "#E2E8F0", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#22C55E" : "#3B82F6", borderRadius: 2, transition: "width 0.3s" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de productos por zona */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#94A3B8", padding: "40px 0", fontSize: 14 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>Cargando referencias…
        </div>
      ) : activeProds.length === 0 ? (
        <div style={{ textAlign: "center", color: "#94A3B8", padding: "40px 0", fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>Sin productos activos
        </div>
      ) : (
        <div style={{ ...S.card, overflow: "visible" }}>
          {zonas.map(zona => (
            <ZonaSection
              key={zona}
              zona={zona}
              productos={activeProds.filter(p => p.zona === zona)}
              vals={vals}
              lastNiveles={lastNiveles}
              onChange={handleChange}
            />
          ))}
        </div>
      )}

      {/* Botón guardar */}
      {activeProds.length > 0 && (
        <button style={{ ...S.primaryBtn, opacity: saving ? 0.6 : 1 }} onClick={guardar} disabled={saving}>
          {saving ? "⏳ Guardando…" : "💾 Guardar niveles"}
        </button>
      )}
    </div>
  );
}
