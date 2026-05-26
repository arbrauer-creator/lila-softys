import { useState, useEffect } from "react";
import { TIPOS_DOSIS, USOS_DOSIS, PUNTOS_DOSIS, PRODUCTOS_DOSIS } from "./data.js";
import { saveDosificacion, fetchDosificaciones, todayStr, nowSantiago } from "./api.js";

const S = {
  page:    { padding: "12px 12px 100px" },
  card:    { background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 12, overflow: "hidden" },
  cardPad: { padding: "14px" },
  label:   { fontSize: 11, color: "#64748B", marginBottom: 4, display: "block", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 },
  input:   { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", fontSize: 14, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit", boxSizing: "border-box" },
  select:  { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", fontSize: 14, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit" },
  textarea:{ width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 12px", fontSize: 13, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit", resize: "vertical", minHeight: 60, boxSizing: "border-box" },
  primaryBtn: { width: "100%", padding: "14px", borderRadius: 12, background: "#1A2744", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" },
  secondaryBtn: { padding: "8px 16px", borderRadius: 10, background: "#F1F5F9", color: "#1A2744", fontSize: 13, fontWeight: 600, border: "1.5px solid #E2E8F0", cursor: "pointer" },
  grid2:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  grid3:   { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 },
  badge:   (c) => ({ display: "inline-block", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: c.bg, color: c.text }),
};

const TIPO_COLORS = {
  "Continuo":        { bg: "#DCFCE7", text: "#15803D" },
  "Batch":           { bg: "#EFF6FF", text: "#1D4ED8" },
  "Ciclos por tiempo":{ bg: "#FEF3C7", text: "#92400E" },
};

const EMPTY_FORM = {
  producto: "", punto: "", tipo: "Continuo", flujo: "", tiempo: "", periodo: "", hz: "", uso: "", obs: "",
};

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

// ── FORMULARIO ────────────────────────────────────────────────────────────────
function NuevoSetpointForm({ usuario, onSaved, showToast }) {
  const [form, setForm]   = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
      </div>
      <div style={S.cardPad}>
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

        {/* Campos numéricos según tipo */}
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

// ── MAIN MODULE ───────────────────────────────────────────────────────────────
export default function DosificacionesModule({ usuario, showToast }) {
  const [dosis,   setDosis]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
      {/* Controles */}
      <div style={S.card}>
        <div style={{ ...S.cardPad, display: "flex", gap: 10, alignItems: "center" }}>
          <input style={{ ...S.input, flex: 1, padding: "8px 12px" }}
            placeholder="🔍 Filtrar por producto…"
            value={filterProd} onChange={e => setFilterProd(e.target.value)} />
          <button style={{ ...S.secondaryBtn, whiteSpace: "nowrap" }} onClick={() => setShowForm(f => !f)}>
            {showForm ? "✕ Cerrar" : "➕ Nuevo"}
          </button>
        </div>
      </div>

      {/* Formulario nuevo setpoint */}
      {showForm && (
        <NuevoSetpointForm usuario={usuario} showToast={showToast} onSaved={() => { setShowForm(false); load(); }} />
      )}

      {/* Lista de setpoints actuales */}
      <div style={{ ...S.cardPad, paddingLeft: 0, paddingRight: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4 }}>
          Setpoints registrados {filtered.length > 0 ? `(${filtered.length})` : ""}
        </div>
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
    </div>
  );
}
