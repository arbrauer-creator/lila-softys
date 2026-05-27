import { useState, useEffect } from "react";
import { PUNTOS_DOSIS, PRODUCTOS_DOSIS, COMBOS_DOSIS, getTipo } from "./data.js";
import { saveCenterlines, invalidateCenterlineCache, fetchCenterlines } from "./api.js";

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
  position: "fixed", inset: 0, zIndex: 300,
  display: "flex", alignItems: "stretch", justifyContent: "stretch",
};
const sheet = {
  background: "#fff", width: "100%", height: "100%",
  display: "flex", flexDirection: "column",
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

// ── FILA FIJA (producto+punto de COMBOS_DOSIS, solo valores editables) ─────────
function StdRow({ producto, punto, tipo, v, onChange, firstInGroup, groupSize }) {
  const tc    = TIPO_BADGE[tipo];
  const tiene = hasData(v);
  return (
    <tr style={{ background: tiene ? "#F0FDF4" : "#fff" }}
      onMouseEnter={e => { if (!tiene) e.currentTarget.style.background = "#F8FAFC"; }}
      onMouseLeave={e => { e.currentTarget.style.background = tiene ? "#F0FDF4" : "#fff"; }}
    >
      {/* Celda de producto: solo en la primera fila del grupo, con rowSpan */}
      {firstInGroup && (
        <td rowSpan={groupSize} style={{
          padding: "5px 14px", color: "#475569", fontSize: 12, fontWeight: 600,
          borderBottom: "1px solid #F1F5F9", whiteSpace: "nowrap",
          borderRight: "1px solid #F1F5F9", verticalAlign: "middle",
          background: tiene ? "#F0FDF4" : "#F8FAFC",
        }}>
          {producto.replace(/_/g, " ")}
        </td>
      )}
      {/* Punto */}
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
      <td style={{ width: 32, borderBottom: "1px solid #F1F5F9" }} />
    </tr>
  );
}

// ── FILA PERSONALIZADA (producto+punto editables) ─────────────────────────────
function CustomRow({ row, onChange, onDelete }) {
  const tipo  = row.producto && row.punto ? getTipo(row.producto, row.punto) : null;
  const tc    = tipo ? TIPO_BADGE[tipo] : null;
  const tiene = hasData(row) && !!row.punto && !!row.producto;

  const handlePuntoSelect = (val) => {
    if (val === "__otro__") { onChange("customPunto", true);  onChange("punto", ""); }
    else                    { onChange("customPunto", false); onChange("punto", val); }
  };

  const custoBorder = "1.5px solid #FDE68A";
  const custoBack   = "#FFFBEB";

  return (
    <tr style={{ background: custoBack }}>
      {/* Producto */}
      <td style={{ padding: "4px 6px 4px 14px", borderBottom: "1px solid #FEF3C7", minWidth: 180 }}>
        <select style={{ ...sel, background: custoBack, border: custoBorder }}
          value={row.producto} onChange={e => onChange("producto", e.target.value)}>
          <option value="">Producto…</option>
          {PRODUCTOS_DOSIS.map(p => (
            <option key={p} value={p}>{p.replace(/_/g, " ")}</option>
          ))}
        </select>
      </td>
      {/* Punto */}
      <td style={{ padding: "4px 6px", borderBottom: "1px solid #FEF3C7", minWidth: 160 }}>
        {row.customPunto ? (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input
              placeholder="Nombre del punto…"
              value={row.punto}
              onChange={e => onChange("punto", e.target.value)}
              style={{ ...sel, flex: 1, background: custoBack, border: custoBorder }}
              onFocus={e => { e.target.style.border = "1.5px solid #F59E0B"; }}
              onBlur={e =>  { e.target.style.border = custoBorder; }}
            />
            <button onClick={() => { onChange("customPunto", false); onChange("punto", ""); }}
              title="Volver al selector"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 13, padding: "2px 4px", flexShrink: 0 }}>↩</button>
          </div>
        ) : (
          <select style={{ ...sel, background: custoBack, border: custoBorder }}
            value={row.punto} onChange={e => handlePuntoSelect(e.target.value)}>
            <option value="">Punto…</option>
            {PUNTOS_STD.map(p => <option key={p} value={p}>{p}</option>)}
            <option value="__otro__">✏️ Otro punto…</option>
          </select>
        )}
      </td>
      {/* Tipo */}
      <td style={{ padding: "4px 8px", borderBottom: "1px solid #FEF3C7", textAlign: "center" }}>
        {tc
          ? <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: tc.bg, color: tc.text, whiteSpace: "nowrap" }}>{tipo}</span>
          : <span style={{ fontSize: 10, color: "#CBD5E1" }}>—</span>}
      </td>
      {["minKgT", "stdKgT", "maxKgT"].map(field => (
        <td key={field} style={{ padding: "3px 4px", borderBottom: "1px solid #FEF3C7" }}>
          <input
            type="number" step="0.001" min="0" placeholder="—"
            value={row[field] || ""}
            onChange={e => onChange(field, e.target.value)}
            style={{ ...numInp(tiene), border: "1.5px solid #FDE68A", background: "#FFFBEB" }}
            onFocus={e => { e.target.style.border = "1.5px solid #F59E0B"; e.target.style.background = "#fff"; }}
            onBlur={e =>  { e.target.style.border = "1.5px solid #FDE68A"; e.target.style.background = "#FFFBEB"; }}
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
  const [activeSku,  setActiveSku]  = useState(SKU_LIST[0]);
  const [saving,     setSaving]     = useState(false);
  const [comentario, setComentario] = useState("");

  // Valores estándar: { [sku]: { ["prod|punto"]: { minKgT, stdKgT, maxKgT } } }
  const [allStd, setAllStd] = useState(() => {
    const init = {};
    SKU_LIST.forEach(s => { init[s] = initStdValues(s, centerlines?.rows); });
    return init;
  });

  // Filas extra (puntos fuera de COMBOS_DOSIS): { [sku]: [...] }
  const [allCustom, setAllCustom] = useState(() => {
    const comboKeys = new Set(COMBOS_DOSIS.map(c => `${c.producto}|${c.punto}`));
    const init = {};
    SKU_LIST.forEach(s => {
      init[s] = (centerlines?.rows || [])
        .filter(r => String(r.sku) === String(s) && !comboKeys.has(`${r.producto}|${r.punto}`))
        .map(r => ({
          producto:    r.producto || "",
          punto:       r.punto    || "",
          customPunto: !PUNTOS_STD.includes(r.punto),
          minKgT:      r.minKgT   || "",
          stdKgT:      r.stdKgT   || "",
          maxKgT:      r.maxKgT   || "",
        }));
    });
    return init;
  });

  // Al montar: carga datos frescos desde la API para reflejar el último guardado
  useEffect(() => {
    const comboKeys = new Set(COMBOS_DOSIS.map(c => `${c.producto}|${c.punto}`));
    fetchCenterlines().then(cl => {
      if (!cl?.rows?.length) return;
      const newStd = {};
      SKU_LIST.forEach(s => { newStd[s] = initStdValues(s, cl.rows); });
      setAllStd(newStd);
      const newCustom = {};
      SKU_LIST.forEach(s => {
        newCustom[s] = cl.rows
          .filter(r => String(r.sku) === String(s) && !comboKeys.has(`${r.producto}|${r.punto}`))
          .map(r => ({
            producto: r.producto || "", punto: r.punto || "",
            customPunto: !PUNTOS_STD.includes(r.punto),
            minKgT: r.minKgT || "", stdKgT: r.stdKgT || "", maxKgT: r.maxKgT || "",
          }));
      });
      setAllCustom(newCustom);
    });
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

  const addCustomRow = () => {
    setAllCustom(prev => ({ ...prev, [activeSku]: [...(prev[activeSku] || []), newCustomRow()] }));
  };

  const removeCustomRow = (idx) => {
    setAllCustom(prev => ({
      ...prev,
      [activeSku]: (prev[activeSku] || []).filter((_, i) => i !== idx),
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
      COMBOS_DOSIS.forEach(({ producto, punto }) => {
        const v = stdM[`${producto}|${punto}`];
        if (!hasData(v)) return;
        allRows.push({ sku, producto, punto, tipo: getTipo(producto, punto), minLH: "", stdLH: "", maxLH: "", ...v, comentario });
      });

      // Filas custom con datos
      custR.forEach(r => {
        if (!r.producto || !r.punto || !hasData(r)) return;
        allRows.push({ sku, producto: r.producto, punto: r.punto, tipo: getTipo(r.producto, r.punto), minLH: "", stdLH: "", maxLH: "", minKgT: r.minKgT, stdKgT: r.stdKgT, maxKgT: r.maxKgT, comentario });
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

  // Agrupar COMBOS_DOSIS por producto (manteniendo orden original)
  const byProduct = [];
  const seen = new Set();
  COMBOS_DOSIS.forEach(({ producto, punto }) => {
    if (!seen.has(producto)) { seen.add(producto); byProduct.push({ producto, puntos: [] }); }
    byProduct.find(g => g.producto === producto).puntos.push(punto);
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={overlay}>
      <div style={sheet}>

        {/* Header */}
        <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1E293B" }}>📏 Gestión de Centerlines</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>
              {COMBOS_DOSIS.length} combinaciones · {countFilled(activeSku)} con datos · SKU {activeSku}
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
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#1A2744" }}>
              <tr>
                <TH align="left" style={{ minWidth: 180, paddingLeft: 14 }}>Producto</TH>
                <TH align="left" style={{ minWidth: 150 }}>Punto dosificación</TH>
                <TH style={{ minWidth: 110 }}>Tipo</TH>
                <TH color="#7DD3FC" style={{ minWidth: 80 }}>Mín kg/t</TH>
                <TH color="#7DD3FC" style={{ minWidth: 80 }}>Std kg/t</TH>
                <TH color="#7DD3FC" style={{ minWidth: 80 }}>Máx kg/t</TH>
                <th style={{ width: 32, borderBottom: "2px solid #0F1D38" }} />
              </tr>
            </thead>
            <tbody>

              {/* ── Combinaciones desde COMBOS_DOSIS ── */}
              {byProduct.flatMap(({ producto, puntos }) =>
                puntos.map((punto, qi) => (
                  <StdRow
                    key={`${producto}|${punto}`}
                    producto={producto}
                    punto={punto}
                    tipo={getTipo(producto, punto)}
                    v={stdMap[`${producto}|${punto}`]}
                    onChange={(field, val) => setStdVal(activeSku, producto, punto, field, val)}
                    firstInGroup={qi === 0}
                    groupSize={puntos.length}
                  />
                ))
              )}

              {/* ── Filas personalizadas ── */}
              {custRows.length > 0 && (
                <tr>
                  <td colSpan={7} style={{
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
                  onDelete={() => removeCustomRow(idx)}
                />
              ))}

            </tbody>
          </table>
        </div>

        {/* Comentario */}
        <div style={{ padding: "10px 20px 0", borderTop: "1px solid #F1F5F9", flexShrink: 0 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>
            Comentario / motivo del cambio
          </label>
          <textarea
            placeholder="Ej: Ajuste por cambio de gramaje, nueva campaña SKU 700…"
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            style={{
              width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8,
              padding: "8px 12px", fontSize: 13, fontFamily: "inherit",
              resize: "vertical", minHeight: 56, boxSizing: "border-box",
              outline: "none", color: "#1E293B", background: "#F8FAFC",
            }}
            onFocus={e => { e.target.style.border = "1.5px solid #3B82F6"; e.target.style.background = "#fff"; }}
            onBlur={e  => { e.target.style.border = "1.5px solid #E2E8F0"; e.target.style.background = "#F8FAFC"; }}
          />
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 20px 12px", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
          <button onClick={addCustomRow} style={{
            padding: "10px 18px", borderRadius: 10, background: "#FFFBEB",
            color: "#92400E", fontWeight: 700, fontSize: 13,
            border: "1.5px solid #FDE68A", cursor: "pointer", whiteSpace: "nowrap",
          }}>
            ➕ Otra combinación
          </button>
          <span style={{ fontSize: 11, color: "#94A3B8", flex: 1 }}>
            Las filas en blanco no se guardan · Tipo derivado automáticamente
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
