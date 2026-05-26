import { useState, useEffect } from "react";
import { PRODUCTOS_NIVELES } from "./data.js";
import { fetchConsumoRows } from "./api.js";

const S = {
  page:    { padding: "12px 12px 100px" },
  card:    { background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 12, overflow: "hidden" },
  cardPad: { padding: "14px" },
  label:   { fontSize: 11, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 },
  select:  { border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "7px 10px", fontSize: 13, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit" },
};

// Mini sparkline CSS-based (barras proporcionales)
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div style={{ height: 20, background: "#F1F5F9", borderRadius: 3, overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.4s" }} />
    </div>
  );
}

function TrendArrow({ vals }) {
  const nums = vals.filter(v => v !== "" && !isNaN(parseFloat(v))).map(Number);
  if (nums.length < 2) return <span style={{ color: "#94A3B8" }}>—</span>;
  const avg1 = nums.slice(0, Math.ceil(nums.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(nums.length / 2);
  const avg2 = nums.slice(Math.ceil(nums.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(nums.length / 2);
  if (avg2 > avg1 * 1.05) return <span title="Tendencia al alza">↑</span>;
  if (avg2 < avg1 * 0.95) return <span title="Tendencia a la baja">↓</span>;
  return <span style={{ color: "#94A3B8" }}>→</span>;
}

// Encabezados del CSV de BBDD MP03 (en orden) para mapear a product ids
const COL_TO_ID = {
  "Nivel Lavador alcalino CONN 5132 ES (cm)":          "p01",
  "Nivel lavador ácido CONN 5074 ET(cm)":               "p02",
  "Nivel pasivante CONN 1050 AP (cm)":                 "p03",
  "Nivel detacktificante CONN 1012 CT (cm)":           "p04",
  "Nivel dispersante CONN 5518 MA CT (cm)":            "p05",
  "Nivel micro partícula ECOPART-T PRP (cm)":          "p06",
  "Nivel micro partícula ECOPART-T Máquina (cm)":      "p07",
  "Nivel Enzima ECOENZ-C sala aditivo (cm)":           "p08",
  "Nivel Enzima ECOENZ-C PRP (cm)":                    "p09",
  "Ecofor751 (cm)":                                    "p10",
  "Nivel Solvente EcoSolv sala de aditivo arriba (cm)":"p11",
  "Nivel Solvente EcoSolv sala de aditivo Abajo(cm)":  "p12",
  "Nivel Enzima ECOENZ REF 200 (cm) PRP":              "p13",
  "Nivel Enzima ECOENZ REF 200 (cm)2 Maquina":         "p14",
  "Nivel Microbiocida 431 (cm)":                       "p15",
  "Ecofor-771":                                        "p16",
  "Nivel Coagulante EcoFix 102 (cm)":                  "p17",
  "Nivel Floculante EcoFix 108 (saco)":                "p18",
  "ECO PC 105":                                        "p19",
  "Ecofor752 (cm)":                                    "p20",
  "Nivel Ecofix 507":                                  "p21",
  "Nivel Coagulante Ecofix 102 Dispercion (cm)":       "p22",
  "Dispersante Eco Disp 594":                          "p23",
  "Microbiosida Ecosan 403":                           "p24",
  "EcoenzB sala aditivos":                             "p25",
  "Coagulante Glue Pulp":                              "p26",
  "Dispersante Glue Pulp":                             "p27",
};

function parseNum(v) {
  if (!v || v === "") return NaN;
  return parseFloat(String(v).replace(",", "."));
}

export default function DashboardModule({ config }) {
  const [days,    setDays]    = useState(14);
  const [data,    setData]    = useState(null);   // { headers, rows }
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    setLoading(true); setError(false);
    fetchConsumoRows(days)
      .then(d => { setData(d); if (!d || !d.headers?.length) setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [days]);

  // Productos activos
  const activeProds = PRODUCTOS_NIVELES.filter(p =>
    !config || Object.keys(config).length === 0 || config[p.id] !== false
  );

  // Armar tabla: para cada producto activo, obtener sus valores en las últimas N fechas
  let tableData = [];
  let fechas    = [];
  if (data?.headers?.length && data?.rows?.length) {
    // Últimas N filas con al menos un valor
    const rows = data.rows
      .filter(r => r.some((v, i) => i > 1 && v !== ""))
      .slice(-days);
    fechas = rows.map(r => r[0]); // columna Fecha

    tableData = activeProds.map(prod => {
      // encontrar índice de columna que corresponde a este product id
      const colIdx = data.headers.findIndex(h => COL_TO_ID[h] === prod.id);
      const vals = rows.map(r => colIdx >= 0 ? (r[colIdx] || "") : "");
      const nums = vals.map(parseNum).filter(n => !isNaN(n));
      const max  = nums.length ? Math.max(...nums) : 0;
      const last = nums.length ? nums[nums.length - 1] : null;
      return { prod, vals, max, last };
    }).filter(d => d.max > 0 || d.vals.some(v => v !== ""));
  }

  const lastFechas = fechas.slice(-7); // mostrar últimas 7 en tabla

  return (
    <div style={S.page}>
      {/* Controles */}
      <div style={S.card}>
        <div style={{ ...S.cardPad, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={S.label}>Período</span>
          <select style={S.select} value={days} onChange={e => setDays(Number(e.target.value))}>
            <option value={7}>7 días</option>
            <option value={14}>14 días</option>
            <option value={30}>30 días</option>
          </select>
          {loading && <span style={{ fontSize: 12, color: "#94A3B8" }}>⏳ Cargando…</span>}
        </div>
      </div>

      {error && (
        <div style={{ ...S.card, padding: 16, textAlign: "center", color: "#B91C1C", fontSize: 13 }}>
          ⚠️ No se pudo cargar el dashboard. Verifica que el Apps Script tenga acceso a BBDD MP03.
        </div>
      )}

      {!loading && !error && tableData.length === 0 && (
        <div style={{ textAlign: "center", color: "#94A3B8", padding: "40px 0", fontSize: 14 }}>
          Sin datos de consumo para el período seleccionado
        </div>
      )}

      {/* Tabla de consumos */}
      {!loading && tableData.length > 0 && (
        <div style={S.card}>
          <div style={{ ...S.cardPad, paddingBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 12 }}>
              📊 Consumo por producto — últimas {lastFechas.length} fechas
            </div>
          </div>
          {tableData.map(({ prod, vals, max, last }) => {
            const recentVals = vals.slice(-7);
            const maxRecent  = Math.max(...recentVals.map(parseNum).filter(n => !isNaN(n)), 0);
            return (
              <div key={prod.id} style={{ padding: "10px 14px", borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#334155" }}>{prod.label}</div>
                  <TrendArrow vals={recentVals} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1A2744", minWidth: 60, textAlign: "right" }}>
                    {last !== null ? `${last} ${prod.unit}` : "—"}
                  </div>
                </div>
                {/* Mini barras para las últimas fechas */}
                <div style={{ display: "flex", gap: 2 }}>
                  {recentVals.map((v, i) => {
                    const n = parseNum(v);
                    const color = isNaN(n) ? "#E2E8F0" : n === 0 ? "#FCA5A5" : "#3B82F6";
                    return <MiniBar key={i} value={isNaN(n) ? 0 : n} max={maxRecent || 1} color={color} />;
                  })}
                </div>
                {/* Fechas bajo barras */}
                <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                  {lastFechas.slice(-7).map((f, i) => (
                    <div key={i} style={{ flex: 1, fontSize: 8, color: "#94A3B8", textAlign: "center", overflow: "hidden" }}>
                      {f ? String(f).slice(5) : ""}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leyenda */}
      {!loading && tableData.length > 0 && (
        <div style={{ ...S.card, ...S.cardPad }}>
          <div style={{ fontSize: 11, color: "#94A3B8", display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#3B82F6", borderRadius: 2, marginRight: 4 }} />Consumo normal</span>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#FCA5A5", borderRadius: 2, marginRight: 4 }} />Sin consumo (0)</span>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#E2E8F0", borderRadius: 2, marginRight: 4 }} />Sin dato</span>
          </div>
        </div>
      )}
    </div>
  );
}
