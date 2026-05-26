import { useState } from "react";
import { PUNTOS_DOSIS, PRODUCTOS_DOSIS, getTipo } from "./data.js";
import { saveCenterlines, invalidateCenterlineCache } from "./api.js";

const SKU_LIST = ["700", "715", "716", "753", "767"];

const TIPO_BADGE = {
  "Continuo":          { bg: "#DCFCE7", text: "#15803D" },
  "Batch":             { bg: "#EFF6FF", text: "#1D4ED8" },
  "Ciclos por tiempo": { bg: "#FEF3C7", text: "#92400E" },
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

/** Lee las rows existentes y construye un mapa { "producto|punto": {minLH,…} } para un SKU */
function initValuesForSku(sku, rows) {
  const map = {};
  (rows || []).filter(r => String(r.sku) === String(sku)).forEach(r => {
    map[`${r.producto}|${r.punto}`] = {
      minLH:  r.minLH  || "",
      stdLH:  r.stdLH  || "",
      maxLH:  r.maxLH  || "",
      minKgT: r.minKgT || "",
      stdKgT: r.stdKgT || "",
      maxKgT: r.maxKgT || "",
    };
  });
  return map;
}

/** Convierte el mapa en array de rows descartando combinaciones vacías */
function toRows(sku, valMap) {
  const out = [];
  PRODUCTOS_DOSIS.forEach(producto => {
    PUNTOS_DOSIS.forEach(punto => {
      const v = valMap[`${producto}|${punto}`];
      if (!v) return;
      if (!v.minLH && !v.stdLH && !v.maxLH && !v.minKgT && !v.stdKgT && !v.maxKgT) return;
      out.push({ sku, producto, punto, tipo: getTipo(producto, punto), ...v });
    });
  });
  return out;
}

function hasDatos(v) {
  return !!(v && (v.minLH || v.stdLH || v.maxLH || v.minKgT || v.stdKgT || v.maxKgT));
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
  zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
};
const sheet = {
  background: "#fff", borderRadius: 16, width: "100%", maxWidth: 980,
  maxHeight: "92vh", display: "flex", flexDirection: "column",
  boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
};

const TH = ({ children, color = "#7C8DB0", align = "center", minW = 68, style = {} }) => (
  <th style={{
    padding: "9px 8px", textAlign: align, color,
    fontWeight: 700, fontSize: 10, textTransform: "uppercase",
    letterSpacing: 0.4, whiteSpace: "nowrap",
    borderBottom: "2px solid #0F1D38", minWidth: minW, ...style,
  }}>
    {children}
  </th>
);

// ── PANEL PRINCIPAL ────────────────────────────────────────────────────────────
export default function CenterlineAdmin({ centerlines, onClose, onSaved, showToast }) {
  const [activeSku, setActiveSku] = useState(SKU_LIST[0]);
  const [saving,    setSaving]    = useState(false);
  const [filter,    setFilter]    = useState("");

  // allValues: { [sku]: { [producto|punto]: { minLH, stdLH, maxLH, minKgT, stdKgT, maxKgT } } }
  const [allValues, setAllValues] = useState(() => {
    const init = {};
    SKU_LIST.forEach(s => { init[s] = initValuesForSku(s, centerlines?.rows); });
    return init;
  });

  const setVal = (sku, producto, punto, field, val) => {
    const key = `${producto}|${punto}`;
    setAllValues(prev => ({
      ...prev,
      [sku]: { ...prev[sku], [key]: { ...(prev[sku]?.[key] || {}), [field]: val } },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const allRows = [];
    SKU_LIST.forEach(sku => allRows.push(...toRows(sku, allValues[sku] || {})));
    await saveCenterlines(allRows);
    invalidateCenterlineCache();
    const skus = [...new Set(allRows.map(r => r.sku))].filter(Boolean);
    onSaved({ rows: allRows, skus });
    showToast("✅ Centerlines guardados");
    setSaving(false);
    onClose();
  };

  const currentMap = allValues[activeSku] || {};

  // Cantidad de combinaciones con datos para mostrar en tabs y footer
  const countFilled = (sku) =>
    Object.values(allValues[sku] || {}).filter(hasDatos).length;

  const filledCount = countFilled(activeSku);

  // Filtro: normaliza espacios y guiones bajos para comparar
  const norm = (s) => s.toLowerCase().replace(/[_\s]+/g, " ");
  const productosFiltrados = filter.trim()
    ? PRODUCTOS_DOSIS.filter(p => norm(p).includes(norm(filter)))
    : PRODUCTOS_DOSIS;

  // Genera las filas de la tabla como array plano (productos → puntos)
  const tableRows = productosFiltrados.flatMap(producto => [
    // — Fila encabezado de producto —
    <tr key={`h|${producto}`}>
      <td colSpan={9} style={{
        padding: "7px 14px", background: "#F1F5F9",
        fontWeight: 700, fontSize: 11, color: "#475569",
        borderTop: "2px solid #E2E8F0", letterSpacing: 0.2,
      }}>
        {producto.replace(/_/g, " ")}
      </td>
    </tr>,
    // — Filas por punto —
    ...PUNTOS_DOSIS.map(punto => {
      const key   = `${producto}|${punto}`;
      const tipo  = getTipo(producto, punto);
      const tc    = TIPO_BADGE[tipo];
      const v     = currentMap[key] || {};
      const tiene = hasDatos(v);

      return (
        <tr key={key}
          style={{ background: tiene ? "#F0FDF4" : "#fff" }}
          onMouseEnter={e => { if (!tiene) e.currentTarget.style.background = "#F8FAFC"; }}
          onMouseLeave={e => { e.currentTarget.style.background = tiene ? "#F0FDF4" : "#fff"; }}
        >
          {/* Punto */}
          <td style={{ padding: "5px 14px", color: "#334155", fontSize: 12, borderBottom: "1px solid #F1F5F9", whiteSpace: "nowrap" }}>
            {punto}
          </td>

          {/* Tipo */}
          <td style={{ padding: "5px 8px", borderBottom: "1px solid #F1F5F9", textAlign: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: tc.bg, color: tc.text, whiteSpace: "nowrap" }}>
              {tipo}
            </span>
          </td>

          {/* 6 inputs numéricos */}
          {["minLH","stdLH","maxLH","minKgT","stdKgT","maxKgT"].map((field, fi) => (
            <td key={field} style={{
              padding: "3px 4px", borderBottom: "1px solid #F1F5F9",
              borderLeft: fi === 3 ? "1px dashed #BFDBFE" : "none",
            }}>
              <input
                type="number" step="0.001" min="0" placeholder="—"
                value={v[field] || ""}
                onChange={e => setVal(activeSku, producto, punto, field, e.target.value)}
                style={{
                  width: "100%", minWidth: 58,
                  border: "1.5px solid " + (tiene ? "#BBF7D0" : "#E8EEF5"),
                  borderRadius: 6, padding: "5px 5px",
                  fontSize: 12, textAlign: "right",
                  background: tiene ? "#F0FDF4" : "#F8FAFC",
                  color: "#1E293B", fontFamily: "inherit",
                  boxSizing: "border-box", outline: "none",
                }}
                onFocus={e => {
                  e.target.style.border = "1.5px solid #3B82F6";
                  e.target.style.background = "#fff";
                }}
                onBlur={e => {
                  const t2 = hasDatos(currentMap[key] || {});
                  e.target.style.border = "1.5px solid " + (t2 ? "#BBF7D0" : "#E8EEF5");
                  e.target.style.background = t2 ? "#F0FDF4" : "#F8FAFC";
                }}
              />
            </td>
          ))}
        </tr>
      );
    }),
  ]);

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={sheet}>

        {/* ── Header ── */}
        <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1E293B" }}>📏 Gestión de Centerlines</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>
              {filledCount > 0
                ? `${filledCount} combinación${filledCount !== 1 ? "es" : ""} con datos · SKU ${activeSku}`
                : `Sin datos ingresados para SKU ${activeSku}`}
            </div>
          </div>
          <button
            style={{ background: "none", border: "none", fontSize: 22, color: "#94A3B8", cursor: "pointer", lineHeight: 1, padding: 4 }}
            onClick={onClose}>✕</button>
        </div>

        {/* ── SKU tabs + filtro ── */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {SKU_LIST.map(s => {
              const cnt = countFilled(s);
              const active = s === activeSku;
              return (
                <button key={s} onClick={() => setActiveSku(s)} style={{
                  padding: "6px 18px", borderRadius: 10, border: "1.5px solid",
                  fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
                  background: active ? "#1A2744" : "transparent",
                  color: active ? "#fff" : "#64748B",
                  borderColor: active ? "#1A2744" : "#E2E8F0",
                }}>
                  {s}{cnt > 0 && <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 5 }}>({cnt})</span>}
                </button>
              );
            })}
          </div>
          <input
            style={{ flex: 1, minWidth: 180, border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "7px 12px", fontSize: 13, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit", outline: "none" }}
            placeholder="🔍 Filtrar por producto…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>

        {/* ── Tabla ── */}
        <div style={{ overflowY: "auto", overflowX: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#1A2744" }}>
              <tr>
                <TH align="left" minW={130} color="#94A3B8">Punto dosificación</TH>
                <TH minW={100} color="#94A3B8">Tipo</TH>
                <TH color="#60A5FA">Mín l/h</TH>
                <TH color="#60A5FA">Std l/h</TH>
                <TH color="#60A5FA">Máx l/h</TH>
                <TH color="#7DD3FC" style={{ borderLeft: "1px dashed #334155" }}>Mín kg/t</TH>
                <TH color="#7DD3FC">Std kg/t</TH>
                <TH color="#7DD3FC">Máx kg/t</TH>
              </tr>
            </thead>
            <tbody>
              {tableRows}
            </tbody>
          </table>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "#94A3B8", flex: 1 }}>
            Las filas en blanco no se guardan · El Tipo se deriva automáticamente del producto y punto
          </span>
          <button onClick={onClose} style={{
            padding: "10px 20px", borderRadius: 10, background: "#F1F5F9",
            color: "#64748B", fontWeight: 600, fontSize: 13,
            border: "1.5px solid #E2E8F0", cursor: "pointer",
          }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "10px 28px", borderRadius: 10,
            background: saving ? "#94A3B8" : "#1A2744",
            color: "#fff", fontWeight: 700, fontSize: 14,
            border: "none", cursor: saving ? "not-allowed" : "pointer",
          }}>
            {saving ? "⏳ Guardando…" : "💾 Guardar centerlines"}
          </button>
        </div>

      </div>
    </div>
  );
}
