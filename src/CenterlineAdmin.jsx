import { useState } from "react";
import { PUNTOS_DOSIS, PRODUCTOS_DOSIS, getTipo } from "./data.js";
import { saveCenterlines, invalidateCenterlineCache } from "./api.js";

const SKU_LIST = ["700", "715", "716", "753", "767"];

const EMPTY_ROW = (sku) => ({
  sku, producto: "", punto: "", tipo: getTipo("", ""),
  minLH: "", stdLH: "", maxLH: "",
  minKgT: "", stdKgT: "", maxKgT: "",
});

const TIPO_BADGE = {
  "Continuo":          { bg: "#DCFCE7", text: "#15803D" },
  "Batch":             { bg: "#EFF6FF", text: "#1D4ED8" },
  "Ciclos por tiempo": { bg: "#FEF3C7", text: "#92400E" },
};

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", flexDirection: "column", justifyContent: "flex-end" };
const sheet   = { background: "#fff", borderRadius: "20px 20px 0 0", maxHeight: "92vh", display: "flex", flexDirection: "column" };
const iS      = { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "8px 10px", fontSize: 13, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit", boxSizing: "border-box" };
const lS      = { fontSize: 10, color: "#64748B", display: "block", marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 };

// ── FILA DE CENTERLINE ────────────────────────────────────────────────────────
function CLRow({ row, idx, onChange, onDelete }) {
  const [open, setOpen] = useState(false);
  const summary = [row.producto, row.punto].filter(Boolean).join(" · ") || "Nueva entrada";

  return (
    <div style={{ borderBottom: "1px solid #F1F5F9" }}>
      {/* Cabecera colapsable */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{summary}</div>
          {row.tipo && <div style={{ fontSize: 10, color: "#94A3B8" }}>{row.tipo}{row.stdLH ? ` · Std: ${row.stdLH} l/h` : ""}</div>}
        </div>
        <button onClick={() => setOpen(o => !o)}
          style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94A3B8", padding: "4px 6px" }}>
          {open ? "▲" : "▾"}
        </button>
        <button onClick={onDelete}
          style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#F87171", padding: "4px 6px" }}>
          🗑
        </button>
      </div>

      {/* Campos expandidos */}
      {open && (
        <div style={{ padding: "0 14px 14px", background: "#FAFAFA" }}>
          {/* Producto */}
          <div style={{ marginBottom: 8 }}>
            <label style={lS}>Producto</label>
            <select style={iS} value={row.producto} onChange={e => onChange("producto", e.target.value)}>
              <option value="">Seleccionar…</option>
              {PRODUCTOS_DOSIS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          {/* Punto + Tipo (derivado automáticamente) */}
          <div style={{ marginBottom: 12 }}>
            <label style={lS}>Punto dosificación</label>
            <select style={iS} value={row.punto} onChange={e => onChange("punto", e.target.value)}>
              <option value="">Seleccionar…</option>
              {PUNTOS_DOSIS.map(p => <option key={p}>{p}</option>)}
            </select>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>Tipo:</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                background: (TIPO_BADGE[row.tipo] || TIPO_BADGE["Continuo"]).bg,
                color:      (TIPO_BADGE[row.tipo] || TIPO_BADGE["Continuo"]).text,
              }}>{row.tipo || "Continuo"}</span>
              <span style={{ fontSize: 10, color: "#94A3B8" }}>· derivado automáticamente</span>
            </div>
          </div>

          {/* Valores l/h */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", marginBottom: 6 }}>
            Flujo l/h {row.tipo === "Batch" ? "(o l/batch)" : ""}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
            {[["minLH","Mínimo"], ["stdLH","Estándar"], ["maxLH","Máximo"]].map(([k, l]) => (
              <div key={k}>
                <label style={lS}>{l}</label>
                <input style={iS} type="number" step="0.001" min="0" placeholder="—"
                  value={row[k]} onChange={e => onChange(k, e.target.value)} />
              </div>
            ))}
          </div>

          {/* Valores kg/t */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0369A1", marginBottom: 6 }}>
            Dosis kg/t
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {[["minKgT","Mínimo"], ["stdKgT","Estándar"], ["maxKgT","Máximo"]].map(([k, l]) => (
              <div key={k}>
                <label style={lS}>{l}</label>
                <input style={iS} type="number" step="0.001" min="0" placeholder="—"
                  value={row[k]} onChange={e => onChange(k, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── PANEL PRINCIPAL ────────────────────────────────────────────────────────────
export default function CenterlineAdmin({ centerlines, onClose, onSaved, showToast }) {
  const [activeSku, setActiveSku] = useState(SKU_LIST[0]);
  const [rows,      setRows]      = useState(
    centerlines?.rows?.length ? [...centerlines.rows] : []
  );
  const [saving, setSaving] = useState(false);

  const skuRows   = rows.filter(r => r.sku === activeSku);
  const otherRows = rows.filter(r => r.sku !== activeSku);

  const updateRow = (idx, field, val) => {
    const updated = skuRows.map((r, i) => {
      if (i !== idx) return r;
      const newRow = { ...r, [field]: val };
      if (field === "producto" || field === "punto") {
        newRow.tipo = getTipo(newRow.producto, newRow.punto);
      }
      return newRow;
    });
    setRows([...otherRows, ...updated]);
  };

  const deleteRow = (idx) => {
    setRows([...otherRows, ...skuRows.filter((_, i) => i !== idx)]);
  };

  const addRow = () => {
    setRows([...otherRows, ...skuRows, EMPTY_ROW(activeSku)]);
  };

  const handleSave = async () => {
    setSaving(true);
    await saveCenterlines(rows);
    invalidateCenterlineCache();
    const skus = [...new Set(rows.map(r => r.sku))].filter(Boolean);
    onSaved({ rows, skus });
    showToast("✅ Centerlines guardados");
    setSaving(false);
    onClose();
  };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={sheet}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "#CBD5E1", margin: "12px auto 0", flexShrink: 0 }} />

        {/* Header */}
        <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>📏 Gestión de Centerlines</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{skuRows.length} entradas para SKU {activeSku}</div>
          </div>
          <button style={{ background: "none", border: "none", fontSize: 20, color: "#94A3B8", cursor: "pointer" }} onClick={onClose}>✕</button>
        </div>

        {/* SKU tabs */}
        <div style={{ display: "flex", padding: "10px 14px", gap: 6, borderBottom: "1px solid #F1F5F9", overflowX: "auto", flexShrink: 0 }}>
          {SKU_LIST.map(s => {
            const count = rows.filter(r => r.sku === s).length;
            const active = s === activeSku;
            return (
              <button key={s} onClick={() => setActiveSku(s)} style={{
                padding: "6px 14px", borderRadius: 10, border: "1.5px solid", fontWeight: 700,
                fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
                background: active ? "#1A2744" : "transparent",
                color: active ? "#fff" : "#64748B",
                borderColor: active ? "#1A2744" : "#E2E8F0",
              }}>
                {s} {count > 0 && <span style={{ fontSize: 10, opacity: 0.7 }}>({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Lista de filas */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {skuRows.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94A3B8", padding: "40px 0" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 13 }}>Sin entradas para SKU {activeSku}</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Toca "Agregar fila" para comenzar</div>
            </div>
          ) : (
            skuRows.map((row, i) => (
              <CLRow
                key={i}
                row={row}
                idx={i}
                onChange={(f, v) => updateRow(i, f, v)}
                onDelete={() => deleteRow(i)}
              />
            ))
          )}
        </div>

        {/* Botones acción */}
        <div style={{ padding: "12px 16px", display: "flex", gap: 10, borderTop: "1px solid #F1F5F9", flexShrink: 0 }}>
          <button onClick={addRow} style={{
            flex: 1, padding: "12px", borderRadius: 12, background: "#F1F5F9",
            color: "#1A2744", fontWeight: 700, fontSize: 14, border: "1.5px solid #E2E8F0", cursor: "pointer",
          }}>
            ➕ Agregar fila
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 2, padding: "12px", borderRadius: 12, background: saving ? "#94A3B8" : "#1A2744",
            color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: saving ? "not-allowed" : "pointer",
          }}>
            {saving ? "⏳ Guardando…" : "💾 Guardar centerlines"}
          </button>
        </div>
      </div>
    </div>
  );
}
