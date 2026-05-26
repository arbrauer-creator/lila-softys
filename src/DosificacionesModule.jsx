import { useState, useEffect } from "react";
import { TIPOS_DOSIS, USOS_DOSIS, PUNTOS_DOSIS, PRODUCTOS_DOSIS } from "./data.js";
import { saveDosificacion, fetchDosificaciones, todayStr, nowSantiago } from "./api.js";

const S = {
  page:       { padding: "12px 12px 100px" },
  card:       { background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 12, overflow: "hidden" },
  cardPad:    { padding: "14px" },
  label:      { fontSize: 11, color: "#64748B", marginBottom: 4, display: "block", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 },
  input:      { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", fontSize: 14, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit", boxSizing: "border-box" },
  select:     { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", fontSize: 14, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit" },
  textarea:   { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", fontSize: 13, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit", resize: "vertical", minHeight: 60, boxSizing: "border-box" },
  primaryBtn: { width: "100%", padding: "14px", borderRadius: 12, background: "#1A2744", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" },
  secondaryBtn:{ padding: "8px 14px", borderRadius: 10, background: "#F1F5F9", color: "#1A2744", fontSize: 13, fontWeight: 600, border: "1.5px solid #E2E8F0", cursor: "pointer" },
  activeBtn:  { padding: "8px 14px", borderRadius: 10, background: "#1A2744", color: "#fff", fontSize: 13, fontWeight: 600, border: "1.5px solid #1A2744", cursor: "pointer" },
  grid2:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  grid3:      { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 },
  badge:      (c) => ({ display: "inline-block", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: c.bg, color: c.text }),
};

const TIPO_COLORS = {
  "Continuo":          { bg: "#DCFCE7", text: "#15803D" },
  "Batch":             { bg: "#EFF6FF", text: "#1D4ED8" },
  "Ciclos por tiempo": { bg: "#FEF3C7", text: "#92400E" },
};

const EMPTY_FORM = {
  producto: "", punto: "", tipo: "Continuo", flujo: "", tiempo: "", periodo: "", hz: "", uso: "", obs: "",
};

// ── UTILIDADES CENTERLINE ─────────────────────────────────────────────────────
function normStr(s) {
  return String(s || "").toLowerCase().replace(/[_\-\s]+/g, " ").trim();
}

/** Filtra filas del centerline que coincidan con SKU + producto (fuzzy) + punto (fuzzy) */
function matchCL(clRows, sku, producto, punto) {
  if (!sku || !producto || !clRows?.length) return [];
  const np = normStr(producto);
  return clRows.filter(r => {
    if (String(r.sku) !== String(sku)) return false;
    const rp = normStr(r.producto);
    // Coincidencia si la clave principal del nombre coincide
    const prodMatch = np.split(" ").some(w => w.length > 3 && rp.includes(w)) ||
                      rp.split(" ").some(w => w.length > 3 && np.includes(w));
    if (!prodMatch) return false;
    if (!punto) return true;
    const nn = normStr(punto);
    const rn = normStr(r.punto);
    return !nn || rn.includes(nn) || nn.includes(rn) || nn === "" || rn === "";
  });
}

/** Semáforo: compara flujo (ml/min) con centerline (l/h) */
function trafficLight(flujoMlMin, tipo, clRow) {
  if (!flujoMlMin || !clRow) return null;
  const v = parseFloat(String(flujoMlMin).replace(",", "."));
  if (isNaN(v)) return null;
  // Convertir ml/min → l/h
  const vLH = v * 60 / 1000;
  const minV = parseFloat(String(clRow.minLH).replace(",", "."));
  const maxV = parseFloat(String(clRow.maxLH).replace(",", "."));
  if (isNaN(minV) || isNaN(maxV)) return null;
  if (vLH < minV) return { color: "#EF4444", icon: "🔴", label: "Bajo mínimo" };
  if (vLH > maxV) return { color: "#F97316", icon: "🟠", label: "Sobre máximo" };
  const stdV = parseFloat(String(clRow.stdLH).replace(",", "."));
  const tol  = isNaN(stdV) ? 0 : Math.abs(stdV - minV) * 0.15;
  if (!isNaN(stdV) && Math.abs(vLH - stdV) <= tol) return { color: "#22C55E", icon: "🟢", label: "En estándar" };
  return { color: "#EAB308", icon: "🟡", label: "Dentro de rango" };
}

// ── PANEL DE REFERENCIA CENTERLINE ────────────────────────────────────────────
function CLReference({ clMatches, flujo, tipo, sku }) {
  if (!sku) return (
    <div style={{ background: "#FFF9F5", border: "1.5px solid #FDE68A", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#92400E", marginBottom: 10 }}>
      ⚠️ Selecciona el SKU activo en el header para ver el centerline
    </div>
  );
  if (!clMatches.length) return null;

  return (
    <div style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", marginBottom: 8 }}>
        📏 Centerline SKU {sku}
      </div>
      {clMatches.map((r, i) => {
        const tl = flujo ? trafficLight(flujo, tipo, r) : null;
        return (
          <div key={i} style={{ marginBottom: i < clMatches.length - 1 ? 8 : 0, paddingBottom: i < clMatches.length - 1 ? 8 : 0, borderBottom: i < clMatches.length - 1 ? "1px solid #DBEAFE" : "none" }}>
            <div style={{ fontSize: 11, color: "#1D4ED8", fontWeight: 600, marginBottom: 4 }}>
              {r.punto} · {r.tipo}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
              {[["Mín", r.minLH], ["Std", r.stdLH], ["Máx", r.maxLH]].map(([lbl, val]) => (
                <div key={lbl} style={{ background: "#fff", borderRadius: 6, padding: "4px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#64748B" }}>{lbl} (l/h)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{val || "—"}</div>
                </div>
              ))}
              {r.stdKgT && [["Mín kg/t", r.minKgT], ["Std kg/t", r.stdKgT], ["Máx kg/t", r.maxKgT]].map(([lbl, val]) => (
                <div key={lbl} style={{ background: "#F0F9FF", borderRadius: 6, padding: "4px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#0369A1" }}>{lbl}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0C4A6E" }}>{val || "—"}</div>
                </div>
              ))}
            </div>
            {tl && (
              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 6, padding: "4px 8px" }}>
                <span style={{ fontSize: 14 }}>{tl.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: tl.color }}>{tl.label}</span>
                <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: "auto" }}>
                  flujo ingresado: {(parseFloat(String(flujo).replace(",","."))*60/1000).toFixed(3)} l/h
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── SETPOINT CARD ─────────────────────────────────────────────────────────────
function SetpointCard({ d }) {
  const [open, setOpen] = useState(false);
  const tc = TIPO_COLORS[d.tipo] || { bg: "#F1F5F9", text: "#64748B" };
  return (
    <div style={{ padding: "12px 14px", borderBottom: "1px solid #F1F5F9" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{d.producto}</div>
          <div style={{ fontSize: 11, color: "#64748B" }}>{d.punto} · {d.uso || "—"}</div>
        </div>
        <span style={S.badge(tc)}>{d.tipo}</span>
        <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 18, cursor: "pointer" }}>{open ? "▲" : "▾"}</button>
      </div>
      {open && (
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {d.flujo   && <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "6px 8px" }}><div style={{ fontSize: 10, color: "#64748B" }}>Flujo</div><div style={{ fontSize: 13, fontWeight: 700 }}>{d.flujo} ml/min</div></div>}
          {d.tiempo  && <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "6px 8px" }}><div style={{ fontSize: 10, color: "#64748B" }}>Tiempo</div><div style={{ fontSize: 13, fontWeight: 700 }}>{d.tiempo} min</div></div>}
          {d.periodo && <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "6px 8px" }}><div style={{ fontSize: 10, color: "#64748B" }}>Período</div><div style={{ fontSize: 13, fontWeight: 700 }}>{d.periodo} min</div></div>}
          {d.hz      && <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "6px 8px" }}><div style={{ fontSize: 10, color: "#64748B" }}>Hz</div><div style={{ fontSize: 13, fontWeight: 700 }}>{d.hz}</div></div>}
          {d.obs     && <div style={{ gridColumn: "1 / -1", background: "#FFF9F5", borderRadius: 8, padding: "6px 8px", fontSize: 12, color: "#92400E" }}>💬 {d.obs}</div>}
          <div style={{ gridColumn: "1 / -1", fontSize: 10, color: "#94A3B8" }}>{d.tecnico || "—"} · {d.fecha || ""} {d.hora || ""}</div>
        </div>
      )}
    </div>
  );
}

// ── FORMULARIO NUEVO SETPOINT ──────────────────────────────────────────────────
function NuevoSetpointForm({ usuario, onSaved, showToast, sku, centerlines }) {
  const [form,   setForm]   = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Buscar coincidencias centerline
  const clMatches = matchCL(centerlines?.rows, sku, form.producto, form.punto);

  const guardar = async () => {
    if (!form.producto || !form.punto || !form.tipo) {
      showToast("⚠️ Completa Producto, Punto y Tipo");
      return;
    }
    setSaving(true);
    await saveDosificacion({
      fecha:   todayStr(),
      hora:    nowSantiago().split("T")[1].slice(0, 5),
      tecnico: usuario?.nombre || "",
      sku:     sku || "",
      ...form,
    });
    showToast("✅ Setpoint guardado · enviando a Sheets…");
    setForm({ ...EMPTY_FORM });
    setSaving(false);
    onSaved();
  };

  return (
    <div style={S.card}>
      <div style={{ ...S.cardPad, borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>➕ Nuevo setpoint</div>
        {sku && <span style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", background: "#EFF6FF", padding: "2px 8px", borderRadius: 8 }}>SKU {sku}</span>}
      </div>
      <div style={S.cardPad}>

        {/* Producto */}
        <div style={{ marginBottom: 10 }}>
          <label style={S.label}>Producto *</label>
          <select style={S.select} value={form.producto} onChange={e => set("producto", e.target.value)}>
            <option value="">Seleccionar…</option>
            {PRODUCTOS_DOSIS.map(p => <option key={p}>{p}</option>)}
            <option value="_otro">Otro…</option>
          </select>
          {form.producto === "_otro" && (
            <input style={{ ...S.input, marginTop: 6 }} placeholder="Nombre del producto" value={form._prod_otro || ""}
              onChange={e => setForm(f => ({ ...f, _prod_otro: e.target.value, producto: e.target.value || "_otro" }))} />
          )}
        </div>

        {/* Punto + Tipo */}
        <div style={{ ...S.grid2, marginBottom: 10 }}>
          <div>
            <label style={S.label}>Punto dosificación *</label>
            <select style={S.select} value={form.punto} onChange={e => set("punto", e.target.value)}>
              <option value="">Seleccionar…</option>
              {PUNTOS_DOSIS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Tipo *</label>
            <select style={S.select} value={form.tipo} onChange={e => set("tipo", e.target.value)}>
              {TIPOS_DOSIS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Referencia centerline (aparece cuando hay producto + punto seleccionado) */}
        {form.producto && form.producto !== "_otro" && (
          <CLReference clMatches={clMatches} flujo={form.flujo} tipo={form.tipo} sku={sku} />
        )}

        {/* Campos numéricos */}
        <div style={S.grid3}>
          <div>
            <label style={S.label}>Flujo (ml/min)</label>
            <input style={S.input} type="number" min="0" step="0.1" placeholder="0.0"
              value={form.flujo} onChange={e => set("flujo", e.target.value)} />
          </div>
          {form.tipo !== "Continuo" && (
            <div>
              <label style={S.label}>Tiempo (min)</label>
              <input style={S.input} type="number" min="0" step="0.5" placeholder="0.0"
                value={form.tiempo} onChange={e => set("tiempo", e.target.value)} />
            </div>
          )}
          {form.tipo === "Ciclos por tiempo" && (
            <div>
              <label style={S.label}>Período (min)</label>
              <input style={S.input} type="number" min="0" step="1" placeholder="0"
                value={form.periodo} onChange={e => set("periodo", e.target.value)} />
            </div>
          )}
          <div>
            <label style={S.label}>Hz bomba</label>
            <input style={S.input} type="number" min="0" max="60" step="0.1" placeholder="—"
              value={form.hz} onChange={e => set("hz", e.target.value)} />
          </div>
        </div>

        {/* Uso + Obs */}
        <div style={{ marginTop: 10 }}>
          <label style={S.label}>Uso</label>
          <select style={S.select} value={form.uso} onChange={e => set("uso", e.target.value)}>
            <option value="">Seleccionar…</option>
            {USOS_DOSIS.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={S.label}>Observación</label>
          <textarea style={S.textarea} placeholder="Motivo del cambio, condiciones especiales…"
            value={form.obs} onChange={e => set("obs", e.target.value)} />
        </div>

        <button style={{ ...S.primaryBtn, marginTop: 12, opacity: saving ? 0.6 : 1 }} onClick={guardar} disabled={saving}>
          {saving ? "⏳ Guardando…" : "💾 Registrar setpoint"}
        </button>
      </div>
    </div>
  );
}

// ── VISTA CENTERLINE POR SKU ──────────────────────────────────────────────────
function CenterlineView({ centerlines, sku }) {
  const [filter, setFilter] = useState("");

  if (!sku) return (
    <div style={{ textAlign: "center", color: "#94A3B8", padding: "40px 0", fontSize: 14 }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📏</div>
      Selecciona el SKU activo en el header para ver el centerline
    </div>
  );

  const skuRows = (centerlines?.rows || [])
    .filter(r => String(r.sku) === String(sku))
    .filter(r => !filter || normStr(r.producto).includes(normStr(filter)) || normStr(r.punto).includes(normStr(filter)));

  // Agrupar por producto
  const byProd = skuRows.reduce((acc, r) => {
    const k = r.producto;
    if (!acc[k]) acc[k] = [];
    acc[k].push(r);
    return acc;
  }, {});

  return (
    <div>
      {/* Filtro */}
      <div style={S.card}>
        <div style={S.cardPad}>
          <input
            style={{ ...S.input, padding: "8px 12px" }}
            placeholder="🔍 Filtrar por producto o punto…"
            value={filter} onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>

      {skuRows.length === 0 ? (
        <div style={{ textAlign: "center", color: "#94A3B8", padding: "40px 0", fontSize: 14 }}>
          {filter ? "Sin resultados" : `Sin centerlines para SKU ${sku}`}
        </div>
      ) : (
        <div style={S.card}>
          {/* Encabezado tabla */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 60px 60px 60px 60px", gap: 0, background: "#1A2744", padding: "8px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>Producto · Punto</div>
            {["Mín l/h","Std l/h","Máx l/h","Mín kg/t","Std kg/t","Máx kg/t"].map(h => (
              <div key={h} style={{ fontSize: 9, fontWeight: 700, color: "#60A5FA", textAlign: "center", textTransform: "uppercase", lineHeight: 1.2 }}>{h}</div>
            ))}
          </div>
          {Object.entries(byProd).map(([prod, rows]) => (
            <div key={prod}>
              <div style={{ padding: "6px 14px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#334155" }}>{prod}</span>
              </div>
              {rows.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 60px 60px 60px 60px", gap: 0, padding: "8px 14px", borderBottom: "1px solid #F1F5F9", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>{r.punto}</div>
                    <span style={S.badge(TIPO_COLORS[r.tipo] || { bg: "#F1F5F9", text: "#64748B" })}>{r.tipo}</span>
                  </div>
                  {[r.minLH, r.stdLH, r.maxLH, r.minKgT, r.stdKgT, r.maxKgT].map((val, vi) => (
                    <div key={vi} style={{ textAlign: "center", fontSize: 12, fontWeight: vi === 1 || vi === 4 ? 700 : 400, color: vi === 1 || vi === 4 ? "#1A2744" : "#64748B" }}>
                      {val || "—"}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN MODULE ───────────────────────────────────────────────────────────────
export default function DosificacionesModule({ usuario, showToast, sku, centerlines }) {
  const [dosis,      setDosis]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [view,       setView]       = useState("registros"); // "registros" | "centerline"
  const [filterProd, setFilterProd] = useState("");

  const load = () => {
    setLoading(true);
    fetchDosificaciones()
      .then(d => setDosis(d))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filterProd
    ? dosis.filter(d => d.producto?.toLowerCase().includes(filterProd.toLowerCase()))
    : dosis;

  return (
    <div style={S.page}>

      {/* Barra de controles */}
      <div style={S.card}>
        <div style={{ ...S.cardPad, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Toggle vista */}
          <button style={view === "registros" ? S.activeBtn : S.secondaryBtn} onClick={() => setView("registros")}>
            ⚙️ Setpoints
          </button>
          <button style={view === "centerline" ? S.activeBtn : S.secondaryBtn} onClick={() => setView("centerline")}>
            📏 Centerline{sku ? ` ${sku}` : ""}
          </button>
          {view === "registros" && (
            <button style={{ ...S.secondaryBtn, marginLeft: "auto", whiteSpace: "nowrap" }} onClick={() => setShowForm(f => !f)}>
              {showForm ? "✕ Cerrar" : "➕ Nuevo"}
            </button>
          )}
        </div>
        {/* Filtro (solo en vista registros) */}
        {view === "registros" && (
          <div style={{ padding: "0 14px 12px" }}>
            <input
              style={{ ...S.input, padding: "8px 12px" }}
              placeholder="🔍 Filtrar por producto…"
              value={filterProd} onChange={e => setFilterProd(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* ─── Vista Centerline ─── */}
      {view === "centerline" && (
        <CenterlineView centerlines={centerlines} sku={sku} />
      )}

      {/* ─── Vista Registros ─── */}
      {view === "registros" && (
        <>
          {showForm && (
            <NuevoSetpointForm
              usuario={usuario}
              showToast={showToast}
              sku={sku}
              centerlines={centerlines}
              onSaved={() => { setShowForm(false); load(); }}
            />
          )}

          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4 }}>
            Setpoints registrados {filtered.length > 0 ? `(${filtered.length})` : ""}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", color: "#94A3B8", padding: "40px 0" }}>⏳ Cargando…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94A3B8", padding: "40px 0", fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚙️</div>
              {filterProd ? "Sin resultados para ese filtro" : "Sin setpoints registrados aún"}
            </div>
          ) : (
            <div style={S.card}>
              {filtered.map((d, i) => <SetpointCard key={i} d={d} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
