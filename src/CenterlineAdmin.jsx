import { useState } from "react";
import { PUNTOS_DOSIS, PRODUCTOS_DOSIS, getTipo } from "./data.js";
import { saveCenterlines, invalidateCenterlineCache } from "./api.js";

const SKU_LIST  = ["700", "715", "716", "753", "767"];
const PUNTOS_STD = PUNTOS_DOSIS.filter(p => p !== "Otro");

const TIPO_BADGE = {
  "Continuo":          { bg: "#DCFCE7", text: "#15803D" },
  "Batch":             { bg: "#EFF6FF", text: "#1D4ED8" },
  "Ciclos por tiempo": { bg: "#FEF3C7", text: "#92400E" },
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

function initRows(sku, rows) {
  return (rows || [])
    .filter(r => String(r.sku) === String(sku))
    .map(r => ({
      producto:    r.producto || "",
      punto:       r.punto    || "",
      customPunto: !PUNTOS_STD.includes(r.punto),   // true si el punto no es estándar
      minKgT:      r.minKgT   || "",
      stdKgT:      r.stdKgT   || "",
      maxKgT:      r.maxKgT   || "",
    }));
}

function newRow() {
  return { producto: "", punto: "", customPunto: false, minKgT: "", stdKgT: "", maxKgT: "" };
}

function toSaveRows(sku, rows) {
  return (rows || [])
    .filter(r => r.producto && r.punto && (r.minKgT || r.stdKgT || r.maxKgT))
    .map(r => ({
      sku,
      producto: r.producto,
      punto:    r.punto,
      tipo:     getTipo(r.producto, r.punto),
      minLH: "", stdLH: "", maxLH: "",
      minKgT: r.minKgT, stdKgT: r.stdKgT, maxKgT: r.maxKgT,
    }));
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
const inp = (highlight) => ({
  width: "100%", border: "1.5px solid " + (highlight ? "#BBF7D0" : "#E2E8F0"),
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

// ── FILA EDITABLE ─────────────────────────────────────────────────────────────
function CLEditRow({ row, onChange, onDelete }) {
  const tipo    = row.producto && row.punto ? getTipo(row.producto, row.punto) : null;
  const tc      = tipo ? TIPO_BADGE[tipo] : null;
  const hasData = !!(row.minKgT || row.stdKgT || row.maxKgT);

  const handlePuntoSelect = (val) => {
    if (val === "__otro__") {
      onChange("customPunto", true);
      onChange("punto", "");
    } else {
      onChange("customPunto", false);
      onChange("punto", val);
    }
  };

  return (
    <tr style={{ background: hasData ? "#F0FDF4" : "#fff" }}>

      {/* Producto */}
      <td style={{ padding: "4px 6px", borderBottom: "1px solid #F1F5F9" }}>
        <select style={sel} value={row.producto} onChange={e => onChange("producto", e.target.value)}>
          <option value="">Seleccionar…</option>
          {PRODUCTOS_DOSIS.map(p => (
            <option key={p} value={p}>{p.replace(/_/g, " ")}</option>
          ))}
        </select>
      </td>

      {/* Punto */}
      <td style={{ padding: "4px 6px", borderBottom: "1px solid #F1F5F9" }}>
        {row.customPunto ? (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input
              placeholder="Nombre del punto…"
              value={row.punto}
              onChange={e => onChange("punto", e.target.value)}
              style={{ ...sel, flex: 1, background: "#FFFBEB", border: "1.5px solid #FDE68A" }}
            />
            <button
              onClick={() => { onChange("customPunto", false); onChange("punto", ""); }}
              title="Usar punto estándar"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 13, padding: "2px 4px", flexShrink: 0 }}>
              ↩
            </button>
          </div>
        ) : (
          <select style={sel} value={row.punto} onChange={e => handlePuntoSelect(e.target.value)}>
            <option value="">Seleccionar…</option>
            {PUNTOS_STD.map(p => <option key={p} value={p}>{p}</option>)}
            <option value="__otro__">✏️ Otro punto…</option>
          </select>
        )}
      </td>

      {/* Tipo */}
      <td style={{ padding: "4px 8px", borderBottom: "1px solid #F1F5F9", textAlign: "center", whiteSpace: "nowrap" }}>
        {tc ? (
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: tc.bg, color: tc.text }}>
            {tipo}
          </span>
        ) : (
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>—</span>
        )}
      </td>

      {/* Mín / Std / Máx kg/t */}
      {["minKgT", "stdKgT", "maxKgT"].map(field => (
        <td key={field} style={{ padding: "4px 4px", borderBottom: "1px solid #F1F5F9" }}>
          <input
            type="number" step="0.001" min="0" placeholder="—"
            value={row[field] || ""}
            onChange={e => onChange(field, e.target.value)}
            style={inp(hasData)}
            onFocus={e => { e.target.style.border = "1.5px solid #3B82F6"; e.target.style.background = "#fff"; }}
            onBlur={e => {
              e.target.style.border = "1.5px solid " + (hasData ? "#BBF7D0" : "#E2E8F0");
              e.target.style.background = hasData ? "#F0FDF4" : "#F8FAFC";
            }}
          />
        </td>
      ))}

      {/* Eliminar */}
      <td style={{ padding: "4px 6px", borderBottom: "1px solid #F1F5F9", textAlign: "center" }}>
        <button
          onClick={onDelete}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#F87171", fontSize: 15, lineHeight: 1, padding: "2px 4px" }}
          title="Eliminar fila">
          🗑
        </button>
      </td>
    </tr>
  );
}

// ── PANEL PRINCIPAL ────────────────────────────────────────────────────────────
export default function CenterlineAdmin({ centerlines, onClose, onSaved, showToast }) {
  const [activeSku, setActiveSku] = useState(SKU_LIST[0]);
  const [saving,    setSaving]    = useState(false);

  // { [sku]: [ { producto, punto, customPunto, minKgT, stdKgT, maxKgT } ] }
  const [allRows, setAllRows] = useState(() => {
    const init = {};
    SKU_LIST.forEach(s => { init[s] = initRows(s, centerlines?.rows); });
    return init;
  });

  // ── Mutadores ────────────────────────────────────────────────────────────────

  const updateRow = (sku, idx, field, val) => {
    setAllRows(prev => {
      const rows = [...(prev[sku] || [])];
      rows[idx]  = { ...rows[idx], [field]: val };
      return { ...prev, [sku]: rows };
    });
  };

  const addRow = (sku) => {
    setAllRows(prev => ({ ...prev, [sku]: [...(prev[sku] || []), newRow()] }));
  };

  const deleteRow = (sku, idx) => {
    setAllRows(prev => ({
      ...prev,
      [sku]: (prev[sku] || []).filter((_, i) => i !== idx),
    }));
  };

  // ── Guardar ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    const allSaveRows = [];
    SKU_LIST.forEach(sku => allSaveRows.push(...toSaveRows(sku, allRows[sku] || [])));
    await saveCenterlines(allSaveRows);
    invalidateCenterlineCache();
    const skus = [...new Set(allSaveRows.map(r => r.sku))].filter(Boolean);
    onSaved({ rows: allSaveRows, skus });
    showToast("✅ Centerlines guardados");
    setSaving(false);
    onClose();
  };

  // ── UI helpers ───────────────────────────────────────────────────────────────

  const rows    = allRows[activeSku] || [];
  const filled  = (sku) => (allRows[sku] || []).filter(r => r.producto && r.punto && (r.minKgT || r.stdKgT || r.maxKgT)).length;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={sheet}>

        {/* Header */}
        <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1E293B" }}>📏 Gestión de Centerlines</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>
              {rows.length === 0
                ? `Sin combinaciones para SKU ${activeSku}`
                : `${rows.length} combinación${rows.length !== 1 ? "es" : ""} · ${filled(activeSku)} con datos · SKU ${activeSku}`}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 22, color: "#94A3B8", cursor: "pointer", lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* SKU tabs */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 6, flexShrink: 0, overflowX: "auto" }}>
          {SKU_LIST.map(s => {
            const cnt    = filled(s);
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
          {rows.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94A3B8", padding: "60px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Sin combinaciones para SKU {activeSku}</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Usa el botón "Agregar combinación" para comenzar</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#1A2744" }}>
                <tr>
                  <TH align="left" style={{ minWidth: 160, paddingLeft: 10 }}>Producto</TH>
                  <TH align="left" style={{ minWidth: 140 }}>Punto dosificación</TH>
                  <TH style={{ minWidth: 110 }}>Tipo</TH>
                  <TH color="#7DD3FC" style={{ minWidth: 78 }}>Mín kg/t</TH>
                  <TH color="#7DD3FC" style={{ minWidth: 78 }}>Std kg/t</TH>
                  <TH color="#7DD3FC" style={{ minWidth: 78 }}>Máx kg/t</TH>
                  <th style={{ width: 36 }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <CLEditRow
                    key={idx}
                    row={row}
                    onChange={(field, val) => updateRow(activeSku, idx, field, val)}
                    onDelete={() => deleteRow(activeSku, idx)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #F1F5F9", display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
          <button onClick={() => addRow(activeSku)} style={{
            padding: "10px 20px", borderRadius: 10, background: "#F1F5F9",
            color: "#1A2744", fontWeight: 700, fontSize: 13,
            border: "1.5px solid #E2E8F0", cursor: "pointer", whiteSpace: "nowrap",
          }}>
            ➕ Agregar combinación
          </button>
          <span style={{ fontSize: 11, color: "#94A3B8", flex: 1 }}>
            Las filas sin valores no se guardan · El Tipo se deriva del producto y punto
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
