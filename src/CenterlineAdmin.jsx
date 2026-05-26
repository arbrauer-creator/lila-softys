import { useState } from "react";
import { PUNTOS_DOSIS, PRODUCTOS_DOSIS, getTipo } from "./data.js";
import { saveCenterlines, invalidateCenterlineCache } from "./api.js";

const SKU_LIST = ["700", "715", "716", "753", "767"];

// Puntos estándar mostrados en la tabla (excluye "Otro" — se maneja con filas personalizadas)
const PUNTOS_STD = PUNTOS_DOSIS.filter(p => p !== "Otro");

const TIPO_BADGE = {
  "Continuo":          { bg: "#DCFCE7", text: "#15803D" },
  "Batch":             { bg: "#EFF6FF", text: "#1D4ED8" },
  "Ciclos por tiempo": { bg: "#FEF3C7", text: "#92400E" },
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

/** Inicializa valores estándar (solo kg/t) desde rows existentes para un SKU */
function initStdValues(sku, rows) {
  const map = {};
  (rows || [])
    .filter(r => String(r.sku) === String(sku) && PUNTOS_STD.includes(r.punto))
    .forEach(r => {
      map[`${r.producto}|${r.punto}`] = {
        minKgT: r.minKgT || "",
        stdKgT: r.stdKgT || "",
        maxKgT: r.maxKgT || "",
      };
    });
  return map;
}

/** Carga filas con puntos personalizados (no están en PUNTOS_STD) para un SKU */
function initCustomRows(sku, rows) {
  return (rows || [])
    .filter(r => String(r.sku) === String(sku) && !PUNTOS_STD.includes(r.punto))
    .map(r => ({
      producto: r.producto,
      punto:    r.punto,
      minKgT:   r.minKgT || "",
      stdKgT:   r.stdKgT || "",
      maxKgT:   r.maxKgT || "",
    }));
}

/** Convierte los mapas en array de rows listo para guardar */
function toRows(sku, stdMap, custRows) {
  const out = [];

  // Filas estándar con al menos un valor kg/t
  PRODUCTOS_DOSIS.forEach(producto => {
    PUNTOS_STD.forEach(punto => {
      const v = stdMap[`${producto}|${punto}`];
      if (!v || (!v.minKgT && !v.stdKgT && !v.maxKgT)) return;
      out.push({
        sku, producto, punto,
        tipo:  getTipo(producto, punto),
        minLH: "", stdLH: "", maxLH: "",
        ...v,
      });
    });
  });

  // Filas personalizadas con producto, punto y al menos un valor
  (custRows || []).forEach(r => {
    if (!r.producto || !r.punto) return;
    if (!r.minKgT && !r.stdKgT && !r.maxKgT) return;
    out.push({
      sku, producto: r.producto, punto: r.punto,
      tipo:  getTipo(r.producto, r.punto),
      minLH: "", stdLH: "", maxLH: "",
      minKgT: r.minKgT, stdKgT: r.stdKgT, maxKgT: r.maxKgT,
    });
  });

  return out;
}

function hasData(v) {
  return !!(v && (v.minKgT || v.stdKgT || v.maxKgT));
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
  zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
};
const sheet = {
  background: "#fff", borderRadius: 16, width: "100%", maxWidth: 780,
  maxHeight: "92vh", display: "flex", flexDirection: "column",
  boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
};

const numInput = (active) => ({
  width: "100%", minWidth: 72,
  border: "1.5px solid " + (active ? "#BBF7D0" : "#E8EEF5"),
  borderRadius: 6, padding: "6px 6px",
  fontSize: 13, textAlign: "right",
  background: active ? "#F0FDF4" : "#F8FAFC",
  color: "#1E293B", fontFamily: "inherit",
  boxSizing: "border-box", outline: "none",
});

const TH = ({ children, color = "#7C8DB0", align = "center", style = {} }) => (
  <th style={{
    padding: "9px 10px", textAlign: align, color,
    fontWeight: 700, fontSize: 10, textTransform: "uppercase",
    letterSpacing: 0.4, whiteSpace: "nowrap",
    borderBottom: "2px solid #0F1D38", ...style,
  }}>
    {children}
  </th>
);

// ── PANEL PRINCIPAL ────────────────────────────────────────────────────────────
export default function CenterlineAdmin({ centerlines, onClose, onSaved, showToast }) {
  const [activeSku, setActiveSku] = useState(SKU_LIST[0]);
  const [saving,    setSaving]    = useState(false);
  const [filter,    setFilter]    = useState("");

  // Valores estándar: { [sku]: { ["producto|punto"]: { minKgT, stdKgT, maxKgT } } }
  const [allStd, setAllStd] = useState(() => {
    const init = {};
    SKU_LIST.forEach(s => { init[s] = initStdValues(s, centerlines?.rows); });
    return init;
  });

  // Filas personalizadas: { [sku]: [ { producto, punto, minKgT, stdKgT, maxKgT } ] }
  const [allCustom, setAllCustom] = useState(() => {
    const init = {};
    SKU_LIST.forEach(s => { init[s] = initCustomRows(s, centerlines?.rows); });
    return init;
  });

  // ── Mutadores ────────────────────────────────────────────────────────────────

  const setStdVal = (sku, producto, punto, field, val) => {
    const key = `${producto}|${punto}`;
    setAllStd(prev => ({
      ...prev,
      [sku]: { ...prev[sku], [key]: { ...(prev[sku]?.[key] || {}), [field]: val } },
    }));
  };

  const setCustomField = (sku, idx, field, val) => {
    setAllCustom(prev => {
      const rows = [...(prev[sku] || [])];
      rows[idx] = { ...rows[idx], [field]: val };
      return { ...prev, [sku]: rows };
    });
  };

  const addCustomRow = (sku, producto) => {
    setAllCustom(prev => ({
      ...prev,
      [sku]: [...(prev[sku] || []), { producto, punto: "", minKgT: "", stdKgT: "", maxKgT: "" }],
    }));
  };

  const removeCustomRow = (sku, idx) => {
    setAllCustom(prev => {
      const rows = (prev[sku] || []).filter((_, i) => i !== idx);
      return { ...prev, [sku]: rows };
    });
  };

  // ── Guardar ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    const allRows = [];
    SKU_LIST.forEach(sku =>
      allRows.push(...toRows(sku, allStd[sku] || {}, allCustom[sku] || []))
    );
    await saveCenterlines(allRows);
    invalidateCenterlineCache();
    const skus = [...new Set(allRows.map(r => r.sku))].filter(Boolean);
    onSaved({ rows: allRows, skus });
    showToast("✅ Centerlines guardados");
    setSaving(false);
    onClose();
  };

  // ── Derivados de UI ──────────────────────────────────────────────────────────

  const stdMap     = allStd[activeSku]    || {};
  const custRows   = allCustom[activeSku] || [];

  const countFilled = (sku) => {
    const std  = Object.values(allStd[sku]    || {}).filter(hasData).length;
    const cust = (allCustom[sku] || []).filter(r => r.punto && hasData(r)).length;
    return std + cust;
  };

  const norm = (s) => s.toLowerCase().replace(/[_\s]+/g, " ");
  const productosFiltrados = filter.trim()
    ? PRODUCTOS_DOSIS.filter(p => norm(p).includes(norm(filter)))
    : PRODUCTOS_DOSIS;

  // ── Construcción de filas de tabla ───────────────────────────────────────────

  const tableRows = productosFiltrados.flatMap(producto => {
    // Filas personalizadas para este producto en el SKU activo
    const custForProd = custRows
      .map((r, globalIdx) => ({ r, globalIdx }))
      .filter(({ r }) => r.producto === producto);

    return [
      // Encabezado de grupo
      <tr key={`h|${producto}`}>
        <td colSpan={5} style={{
          padding: "7px 14px", background: "#F1F5F9",
          fontWeight: 700, fontSize: 11, color: "#475569",
          borderTop: "2px solid #E2E8F0", letterSpacing: 0.2,
        }}>
          {producto.replace(/_/g, " ")}
        </td>
      </tr>,

      // Filas estándar (un punto por fila)
      ...PUNTOS_STD.map(punto => {
        const key   = `${producto}|${punto}`;
        const tipo  = getTipo(producto, punto);
        const tc    = TIPO_BADGE[tipo];
        const v     = stdMap[key] || {};
        const tiene = hasData(v);

        return (
          <tr key={key}
            style={{ background: tiene ? "#F0FDF4" : "#fff" }}
            onMouseEnter={e => { if (!tiene) e.currentTarget.style.background = "#F8FAFC"; }}
            onMouseLeave={e => { e.currentTarget.style.background = tiene ? "#F0FDF4" : "#fff"; }}
          >
            <td style={{ padding: "5px 14px", color: "#334155", fontSize: 12, borderBottom: "1px solid #F1F5F9", whiteSpace: "nowrap" }}>
              {punto}
            </td>
            <td style={{ padding: "5px 8px", borderBottom: "1px solid #F1F5F9", textAlign: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: tc.bg, color: tc.text, whiteSpace: "nowrap" }}>
                {tipo}
              </span>
            </td>
            {["minKgT", "stdKgT", "maxKgT"].map(field => (
              <td key={field} style={{ padding: "3px 4px", borderBottom: "1px solid #F1F5F9" }}>
                <input
                  type="number" step="0.001" min="0" placeholder="—"
                  value={v[field] || ""}
                  onChange={e => setStdVal(activeSku, producto, punto, field, e.target.value)}
                  style={numInput(tiene)}
                  onFocus={e => { e.target.style.border = "1.5px solid #3B82F6"; e.target.style.background = "#fff"; }}
                  onBlur={e => {
                    const t2 = hasData(stdMap[key] || {});
                    e.target.style.border = "1.5px solid " + (t2 ? "#BBF7D0" : "#E8EEF5");
                    e.target.style.background = t2 ? "#F0FDF4" : "#F8FAFC";
                  }}
                />
              </td>
            ))}
            {/* celda vacía para alinear con la columna de eliminar de custom rows */}
            <td style={{ width: 28, borderBottom: "1px solid #F1F5F9" }} />
          </tr>
        );
      }),

      // Filas personalizadas de este producto
      ...custForProd.map(({ r, globalIdx }) => {
        const tipo = r.punto ? getTipo(producto, r.punto) : null;
        const tc   = tipo ? TIPO_BADGE[tipo] : null;
        const tiene = hasData(r) && !!r.punto;

        return (
          <tr key={`cust|${producto}|${globalIdx}`}
            style={{ background: tiene ? "#FFF7ED" : "#FFFBF5" }}
          >
            {/* Punto — texto editable */}
            <td style={{ padding: "3px 8px 3px 14px", borderBottom: "1px solid #F1F5F9" }}>
              <input
                placeholder="Nombre del punto…"
                value={r.punto}
                onChange={e => setCustomField(activeSku, globalIdx, "punto", e.target.value)}
                style={{
                  width: "100%", border: "1.5px solid #FDE68A", borderRadius: 6,
                  padding: "5px 8px", fontSize: 12, background: "#FFFBEB",
                  color: "#92400E", fontFamily: "inherit", outline: "none",
                }}
                onFocus={e => { e.target.style.border = "1.5px solid #F59E0B"; }}
                onBlur={e => { e.target.style.border = "1.5px solid #FDE68A"; }}
              />
            </td>
            {/* Tipo derivado */}
            <td style={{ padding: "3px 8px", borderBottom: "1px solid #F1F5F9", textAlign: "center" }}>
              {tc ? (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: tc.bg, color: tc.text, whiteSpace: "nowrap" }}>
                  {tipo}
                </span>
              ) : (
                <span style={{ fontSize: 10, color: "#CBD5E1" }}>—</span>
              )}
            </td>
            {/* Inputs kg/t */}
            {["minKgT", "stdKgT", "maxKgT"].map(field => (
              <td key={field} style={{ padding: "3px 4px", borderBottom: "1px solid #F1F5F9" }}>
                <input
                  type="number" step="0.001" min="0" placeholder="—"
                  value={r[field] || ""}
                  onChange={e => setCustomField(activeSku, globalIdx, field, e.target.value)}
                  style={{
                    ...numInput(tiene),
                    border: "1.5px solid #FDE68A",
                    background: "#FFFBEB",
                  }}
                  onFocus={e => { e.target.style.border = "1.5px solid #F59E0B"; e.target.style.background = "#fff"; }}
                  onBlur={e => { e.target.style.border = "1.5px solid #FDE68A"; e.target.style.background = "#FFFBEB"; }}
                />
              </td>
            ))}
            {/* Eliminar */}
            <td style={{ padding: "3px 4px", borderBottom: "1px solid #F1F5F9", textAlign: "center", width: 28 }}>
              <button
                onClick={() => removeCustomRow(activeSku, globalIdx)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#F87171", lineHeight: 1, padding: "2px 4px" }}
                title="Eliminar fila">
                ✕
              </button>
            </td>
          </tr>
        );
      }),

      // Botón "Agregar otro punto"
      <tr key={`add|${producto}`}>
        <td colSpan={5} style={{ padding: "4px 14px 6px", borderBottom: "1px solid #F1F5F9" }}>
          <button
            onClick={() => addCustomRow(activeSku, producto)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 11, color: "#94A3B8", padding: "2px 0",
              display: "flex", alignItems: "center", gap: 4,
            }}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>＋</span> Otro punto
          </button>
        </td>
      </tr>,
    ];
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={sheet}>

        {/* Header */}
        <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1E293B" }}>📏 Gestión de Centerlines</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>
              {countFilled(activeSku) > 0
                ? `${countFilled(activeSku)} combinación${countFilled(activeSku) !== 1 ? "es" : ""} con datos · SKU ${activeSku}`
                : `Sin datos ingresados para SKU ${activeSku}`}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 22, color: "#94A3B8", cursor: "pointer", lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* SKU tabs + filtro */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {SKU_LIST.map(s => {
              const cnt    = countFilled(s);
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

        {/* Tabla */}
        <div style={{ overflowY: "auto", overflowX: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#1A2744" }}>
              <tr>
                <TH align="left" style={{ minWidth: 140, paddingLeft: 14 }}>Punto dosificación</TH>
                <TH style={{ minWidth: 110 }}>Tipo</TH>
                <TH color="#7DD3FC" style={{ minWidth: 80 }}>Mín kg/t</TH>
                <TH color="#7DD3FC" style={{ minWidth: 80 }}>Std kg/t</TH>
                <TH color="#7DD3FC" style={{ minWidth: 80 }}>Máx kg/t</TH>
                <th style={{ width: 28 }} />
              </tr>
            </thead>
            <tbody>
              {tableRows}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "#94A3B8", flex: 1 }}>
            Las filas en blanco no se guardan · El Tipo se deriva automáticamente
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
