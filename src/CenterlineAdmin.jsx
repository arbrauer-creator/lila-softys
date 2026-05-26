import { useState, useEffect } from "react";
import { PUNTOS_DOSIS, getTipo } from "./data.js";
import { saveCenterlines, invalidateCenterlineCache, fetchDosificaciones } from "./api.js";

const SKU_LIST   = ["700", "715", "716", "753", "767"];
const PUNTOS_STD = PUNTOS_DOSIS.filter(p => p !== "Otro");

const TIPO_BADGE = {
  "Continuo":          { bg: "#DCFCE7", text: "#15803D" },
  "Batch":             { bg: "#EFF6FF", text: "#1D4ED8" },
  "Ciclos por tiempo": { bg: "#FEF3C7", text: "#92400E" },
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

/** Mapa { "prod|punto": { minKgT, stdKgT, maxKgT } } desde rows de centerlines */
function initStdValues(sku, rows) {
  const map = {};
  (rows || []).filter(r => String(r.sku) === String(sku)).forEach(r => {
    map[`${r.producto}|${r.punto}`] = {
      minKgT: r.minKgT || "",
      stdKgT: r.stdKgT || "",
      maxKgT: r.maxKgT || "",
    };
  });
  return map;
}

function hasData(v) {
  return !!(v && (v.minKgT || v.stdKgT || v.maxKgT));
}

function newCustomRow() {
  return { producto: "", punto: "", customPunto: false, minKgT: "", stdKgT: "", maxKgT: "" };
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
  zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
};
const sheet = {
  background: "#fff", borderRadius: 16, width: "100%", maxWidth: 820,
  maxHeight: "92vh", display: "flex", flexDirection: "column",
  boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
};
const sel = {
  width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 6,
  padding: "6px 8px", fontSize: 12, background: "#F8FAFC",
  color: "#1E293B", fontFamily: "inherit", outline: "none",
};
const numInp = (highlight) => ({
  width: "100%", minWidth: 72,
  border: "1.5px solid " + (highlight ? "#BBF7D0" : "#E2E8F0"),
  borderRadius: 6, padding: "6px 6px", fontSize: 12, textAlign: "right",
  background: highlight ? "#F0FDF4" : "#F8FAFC",
  color: "#1E293B", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
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

// ── FILA DE COMBINACIÓN FIJA (solo valores editables) ─────────────────────────
function StdRow({ punto, tipo, v, onChange }) {
  const tc     = TIPO_BADGE[tipo];
  const tiene  = hasData(v);

  return (
    <tr style={{ background: tiene ? "#F0FDF4" : "#fff" }}
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
            value={(v && v[field]) || ""}
            onChange={e => onChange(field, e.target.value)}
            style={numInp(tiene)}
            onFocus={e => { e.target.style.border = "1.5px solid #3B82F6"; e.target.style.background = "#fff"; }}
            onBlur={e => {
              e.target.style.border = "1.5px solid " + (tiene ? "#BBF7D0" : "#E2E8F0");
              e.target.style.background = tiene ? "#F0FDF4" : "#F8FAFC";
            }}
          />
        </td>
      ))}
      {/* columna de ancho para alinear con filas custom */}
      <td style={{ width: 32, borderBottom: "1px solid #F1F5F9" }} />
    </tr>
  );
}

// ── FILA DE COMBINACIÓN PERSONALIZADA (producto + punto editables) ─────────────
function CustomRow({ row, onChange, onDelete }) {
  const tipo  = row.producto && row.punto ? getTipo(row.producto, row.punto) : null;
  const tc    = tipo ? TIPO_BADGE[tipo] : null;
  const tiene = hasData(row) && !!row.punto && !!row.producto;

  const handlePuntoSelect = (val) => {
    if (val === "__otro__") { onChange("customPunto", true); onChange("punto", ""); }
    else                    { onChange("customPunto", false); onChange("punto", val); }
  };

  return (
    <tr style={{ background: "#FFFBEB" }}>
      <td style={{ padding: "4px 6px 4px 14px", borderBottom: "1px solid #FEF3C7" }}>
        {/* Punto */}
        {row.customPunto ? (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input
              placeholder="Nombre del punto…"
              value={row.punto}
              onChange={e => onChange("punto", e.target.value)}
              style={{ ...sel, flex: 1, background: "#FFFBEB", border: "1.5px solid #FDE68A" }}
              onFocus={e => { e.target.style.border = "1.5px solid #F59E0B"; }}
              onBlur={e => { e.target.style.border = "1.5px solid #FDE68A"; }}
            />
            <button onClick={() => { onChange("customPunto", false); onChange("punto", ""); }}
              title="Volver al selector"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 13, padding: "2px 4px", flexShrink: 0 }}>↩</button>
          </div>
        ) : (
          <select style={{ ...sel, background: "#FFFBEB", border: "1.5px solid #FDE68A" }}
            value={row.punto} onChange={e => handlePuntoSelect(e.target.value)}>
            <option value="">Punto…</option>
            {PUNTOS_STD.map(p => <option key={p} value={p}>{p}</option>)}
            <option value="__otro__">✏️ Otro punto…</option>
          </select>
        )}
      </td>
      <td style={{ padding: "4px 8px", borderBottom: "1px solid #FEF3C7", textAlign: "center" }}>
        {tc ? (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: tc.bg, color: tc.text, whiteSpace: "nowrap" }}>{tipo}</span>
        ) : <span style={{ fontSize: 10, color: "#CBD5E1" }}>—</span>}
      </td>
      {["minKgT", "stdKgT", "maxKgT"].map(field => (
        <td key={field} style={{ padding: "3px 4px", borderBottom: "1px solid #FEF3C7" }}>
          <input
            type="number" step="0.001" min="0" placeholder="—"
            value={row[field] || ""}
            onChange={e => onChange(field, e.target.value)}
            style={{ ...numInp(tiene), border: "1.5px solid #FDE68A", background: "#FFFBEB" }}
            onFocus={e => { e.target.style.border = "1.5px solid #F59E0B"; e.target.style.background = "#fff"; }}
            onBlur={e => { e.target.style.border = "1.5px solid #FDE68A"; e.target.style.background = "#FFFBEB"; }}
          />
        </td>
      ))}
      <td style={{ padding: "4px 6px", borderBottom: "1px solid #FEF3C7", textAlign: "center", width: 32 }}>
        <button onClick={onDelete}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#F87171", fontSize: 15, lineHeight: 1, padding: "2px 4px" }}
          title="Eliminar">🗑</button>
      </td>
    </tr>
  );
}

// ── PANEL PRINCIPAL ────────────────────────────────────────────────────────────
export default function CenterlineAdmin({ centerlines, onClose, onSaved, showToast }) {
  const [activeSku,    setActiveSku]    = useState(SKU_LIST[0]);
  const [saving,       setSaving]       = useState(false);
  const [combos,       setCombos]       = useState([]);   // { producto, punto }[]
  const [loadingCombos,setLoadingCombos]= useState(true);

  // Valores estándar: { [sku]: { ["prod|punto"]: { minKgT, stdKgT, maxKgT } } }
  const [allStd, setAllStd] = useState(() => {
    const init = {};
    SKU_LIST.forEach(s => { init[s] = initStdValues(s, centerlines?.rows); });
    return init;
  });

  // Filas extra: { [sku]: [ { producto, punto, customPunto, minKgT, stdKgT, maxKgT } ] }
  const [allCustom, setAllCustom] = useState(() => {
    const init = {};
    SKU_LIST.forEach(s => { init[s] = []; });
    return init;
  });

  // ── Carga combinaciones desde Dosificaciones ──────────────────────────────
  useEffect(() => {
    fetchDosificaciones().then(dosis => {
      // Extraer pares únicos producto+punto
      const seen  = new Set();
      const pairs = [];
      (dosis || []).forEach(d => {
        if (!d.producto || !d.punto) return;
        const key = `${d.producto}|${d.punto}`;
        if (!seen.has(key)) { seen.add(key); pairs.push({ producto: d.producto, punto: d.punto }); }
      });
      // Ordenar por producto, luego punto
      pairs.sort((a, b) =>
        a.producto.localeCompare(b.producto, "es") || a.punto.localeCompare(b.punto, "es")
      );
      setCombos(pairs);

      // Rows de centerlines que NO están en las combos → van a custom
      const comboKeys = new Set(pairs.map(c => `${c.producto}|${c.punto}`));
      const customInit = {};
      SKU_LIST.forEach(sku => {
        customInit[sku] = (centerlines?.rows || [])
          .filter(r => String(r.sku) === String(sku) && !comboKeys.has(`${r.producto}|${r.punto}`))
          .map(r => ({
            producto:    r.producto || "",
            punto:       r.punto    || "",
            customPunto: !PUNTOS_STD.includes(r.punto),
            minKgT:      r.minKgT   || "",
            stdKgT:      r.stdKgT   || "",
            maxKgT:      r.maxKgT   || "",
          }));
      });
      setAllCustom(customInit);
    }).finally(() => setLoadingCombos(false));
  }, []);

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
      rows[idx]  = { ...rows[idx], [field]: val };
      return { ...prev, [sku]: rows };
    });
  };

  const addCustomRow = (sku) => {
    setAllCustom(prev => ({ ...prev, [sku]: [...(prev[sku] || []), newCustomRow()] }));
  };

  const removeCustomRow = (sku, idx) => {
    setAllCustom(prev => ({
      ...prev,
      [sku]: (prev[sku] || []).filter((_, i) => i !== idx),
    }));
  };

  // ── Guardar ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    const allRows = [];
    SKU_LIST.forEach(sku => {
      const stdM  = allStd[sku]    || {};
      const custR = allCustom[sku] || [];

      // Combos estándar con datos
      combos.forEach(({ producto, punto }) => {
        const v = stdM[`${producto}|${punto}`];
        if (!hasData(v)) return;
        allRows.push({
          sku, producto, punto, tipo: getTipo(producto, punto),
          minLH: "", stdLH: "", maxLH: "", ...v,
        });
      });

      // Filas custom con datos
      custR.forEach(r => {
        if (!r.producto || !r.punto || !hasData(r)) return;
        allRows.push({
          sku, producto: r.producto, punto: r.punto,
          tipo: getTipo(r.producto, r.punto),
          minLH: "", stdLH: "", maxLH: "",
          minKgT: r.minKgT, stdKgT: r.stdKgT, maxKgT: r.maxKgT,
        });
      });
    });

    await saveCenterlines(allRows);
    invalidateCenterlineCache();
    const skus = [...new Set(allRows.map(r => r.sku))].filter(Boolean);
    onSaved({ rows: allRows, skus });
    showToast("✅ Centerlines guardados");
    setSaving(false);
    onClose();
  };

  // ── Derivados ─────────────────────────────────────────────────────────────────

  const stdMap   = allStd[activeSku]    || {};
  const custRows = allCustom[activeSku] || [];

  const countFilled = (sku) =>
    Object.values(allStd[sku] || {}).filter(hasData).length +
    (allCustom[sku] || []).filter(r => r.producto && r.punto && hasData(r)).length;

  // Agrupar combos por producto
  const byProduct = {};
  combos.forEach(({ producto, punto }) => {
    if (!byProduct[producto]) byProduct[producto] = [];
    byProduct[producto].push(punto);
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
              {loadingCombos
                ? "Cargando combinaciones desde Dosificaciones…"
                : `${combos.length} combinaciones · ${countFilled(activeSku)} con datos · SKU ${activeSku}`}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 22, color: "#94A3B8", cursor: "pointer", lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* SKU tabs */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 6, flexShrink: 0, overflowX: "auto" }}>
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

        {/* Tabla */}
        <div style={{ overflowY: "auto", overflowX: "auto", flex: 1 }}>
          {loadingCombos ? (
            <div style={{ textAlign: "center", color: "#94A3B8", padding: "60px 0" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
              <div style={{ fontSize: 13 }}>Cargando combinaciones desde Dosificaciones…</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#1A2744" }}>
                <tr>
                  <TH align="left" style={{ minWidth: 160, paddingLeft: 14 }}>Punto dosificación</TH>
                  <TH style={{ minWidth: 110 }}>Tipo</TH>
                  <TH color="#7DD3FC" style={{ minWidth: 80 }}>Mín kg/t</TH>
                  <TH color="#7DD3FC" style={{ minWidth: 80 }}>Std kg/t</TH>
                  <TH color="#7DD3FC" style={{ minWidth: 80 }}>Máx kg/t</TH>
                  <th style={{ width: 32, borderBottom: "2px solid #0F1D38" }} />
                </tr>
              </thead>
              <tbody>
                {/* ── Combos desde Dosificaciones ── */}
                {combos.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "40px 0", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                    Sin registros en Dosificaciones aún
                  </td></tr>
                ) : (
                  Object.entries(byProduct).flatMap(([producto, puntos]) => [
                    // Encabezado de producto
                    <tr key={`h|${producto}`}>
                      <td colSpan={6} style={{
                        padding: "7px 14px", background: "#F1F5F9",
                        fontWeight: 700, fontSize: 11, color: "#475569",
                        borderTop: "2px solid #E2E8F0",
                      }}>
                        {producto.replace(/_/g, " ")}
                      </td>
                    </tr>,
                    // Filas de punto
                    ...puntos.map(punto => (
                      <StdRow
                        key={`${producto}|${punto}`}
                        punto={punto}
                        tipo={getTipo(producto, punto)}
                        v={stdMap[`${producto}|${punto}`]}
                        onChange={(field, val) => setStdVal(activeSku, producto, punto, field, val)}
                      />
                    )),
                  ])
                )}

                {/* ── Filas personalizadas ── */}
                {custRows.length > 0 && (
                  <tr>
                    <td colSpan={6} style={{
                      padding: "7px 14px", background: "#FEF9C3",
                      fontWeight: 700, fontSize: 11, color: "#92400E",
                      borderTop: "2px solid #FDE68A",
                    }}>
                      ✏️ Otras combinaciones
                    </td>
                  </tr>
                )}
                {custRows.map((row, idx) => (
                  <CustomRow
                    key={idx}
                    row={row}
                    onChange={(field, val) => setCustomField(activeSku, idx, field, val)}
                    onDelete={() => removeCustomRow(activeSku, idx)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
          <button onClick={() => addCustomRow(activeSku)} style={{
            padding: "10px 18px", borderRadius: 10, background: "#FFFBEB",
            color: "#92400E", fontWeight: 700, fontSize: 13,
            border: "1.5px solid #FDE68A", cursor: "pointer", whiteSpace: "nowrap",
          }}>
            ➕ Otra combinación
          </button>
          <span style={{ fontSize: 11, color: "#94A3B8", flex: 1 }}>
            Las filas en blanco no se guardan
          </span>
          <button onClick={onClose} style={{
            padding: "10px 18px", borderRadius: 10, background: "#F1F5F9",
            color: "#64748B", fontWeight: 600, fontSize: 13,
            border: "1.5px solid #E2E8F0", cursor: "pointer",
          }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "10px 28px", borderRadius: 10,
            background: saving ? "#94A3B8" : "#1A2744",
            color: "#fff", fontWeight: 700, fontSize: 14,
            border: "none", cursor: saving ? "not-allowed" : "pointer",
          }}>
            {saving ? "⏳ Guardando…" : "💾 Guardar"}
          </button>
        </div>

      </div>
    </div>
  );
}
