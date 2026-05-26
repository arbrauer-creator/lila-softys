import { useState, useEffect } from "react";
import { saveSession, loadSession, clearSession, fetchUsuarios, fetchConfig,
         fetchCenterlines, saveSku, loadSku } from "./api.js";
import LilaModule           from "./LilaModule.jsx";
import NivelesModule        from "./NivelesModule.jsx";
import DashboardModule      from "./DashboardModule.jsx";
import DosificacionesModule from "./DosificacionesModule.jsx";
import AdminPanel           from "./AdminPanel.jsx";

// ── ESTILOS GLOBALES ──────────────────────────────────────────────────────────
const S = {
  app:        { fontFamily: "'DM Sans', system-ui, sans-serif", background: "#F1F5F9", minHeight: "100vh", maxWidth: 480, margin: "0 auto" },
  header:     { background: "#1A2744", padding: "12px 16px 10px", position: "sticky", top: 0, zIndex: 50 },
  headerRow:  { display: "flex", alignItems: "center", justifyContent: "space-between" },
  headerTitle:{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: -0.3 },
  headerSub:  { display: "flex", alignItems: "center", gap: 8, marginTop: 4 },
  headerUser: { fontSize: 11, color: "#94A3B8" },
  skuWrap:    { display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.10)", borderRadius: 8, padding: "3px 8px 3px 6px" },
  skuLabel:   { fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 },
  skuSelect:  { background: "transparent", border: "none", color: "#60A5FA", fontSize: 12, fontWeight: 700, cursor: "pointer", outline: "none", padding: 0, fontFamily: "inherit" },
  gearBtn:    { background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 18, width: 34, height: 34, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  logoutBtn:  { background: "rgba(255,255,255,0.10)", border: "none", color: "#94A3B8", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8, cursor: "pointer" },
  // Bottom nav
  nav:        { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid #E2E8F0", display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 0px)" },
  navItem:    () => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 4px 6px", background: "none", border: "none", cursor: "pointer", gap: 3 }),
  navIcon:    () => ({ fontSize: 22, lineHeight: 1 }),
  navLabel:   (active) => ({ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? "#1A2744" : "#94A3B8", letterSpacing: 0.2 }),
  navIndicator: { position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 20, height: 2, background: "#1A2744", borderRadius: 1 },
  // Login
  loginWrap:  { minHeight: "100vh", background: "linear-gradient(160deg,#1A2744 0%,#243560 60%,#1A2744 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" },
  loginTitle: { fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: -1 },
  loginSub:   { fontSize: 14, color: "#94A3B8", marginTop: 4 },
  loginCard:  { background: "#fff", borderRadius: 20, padding: "24px 20px", width: "100%", maxWidth: 360, marginTop: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
  loginLabel: { fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6, marginTop: 16 },
  loginInput: { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "12px 14px", fontSize: 15, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit", boxSizing: "border-box" },
  loginBtn:   (dis) => ({ width: "100%", padding: "14px", borderRadius: 12, background: dis ? "#CBD5E1" : "#1A2744", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: dis ? "not-allowed" : "pointer", marginTop: 20 }),
  loginError: { background: "#FEF2F2", color: "#B91C1C", borderRadius: 10, padding: "10px 12px", fontSize: 13, marginTop: 12, textAlign: "center" },
  // Toast
  toast:      (vis) => ({ position: "fixed", bottom: vis ? 80 : -80, left: "50%", transform: "translateX(-50%)", background: "#1E293B", color: "#fff", padding: "10px 20px", borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 999, transition: "bottom 0.3s", whiteSpace: "nowrap", maxWidth: "90vw", textAlign: "center" }),
};

const MODULES = [
  { id: "lila",    icon: "📋", label: "LILA"      },
  { id: "niveles", icon: "🛢",  label: "Niveles"   },
  { id: "dash",    icon: "📊", label: "Dashboard"  },
  { id: "dosis",   icon: "⚙️", label: "Dosis"     },
];

const MODULE_TITLES = {
  lila:    "LILA · Eco-Quim SF TG",
  niveles: "🛢 Registro de Niveles MP3",
  dash:    "📊 Dashboard Consumos",
  dosis:   "⚙️ Dosificaciones",
};

// ── LOGIN SCREEN ───────────────────────────────────────────────────────────────
function LoginScreen({ usuarios, onLogin, error, loading }) {
  const [nombre, setNombre] = useState("");
  const [pin,    setPin]    = useState("");
  const submit = () => { if (nombre && pin) onLogin(nombre, pin); };
  return (
    <div style={S.loginWrap}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏭</div>
        <div style={S.loginTitle}>LILA</div>
        <div style={S.loginSub}>Eco-Quim SF TG</div>
      </div>
      <div style={S.loginCard}>
        <label style={{ ...S.loginLabel, marginTop: 0 }}>Usuario</label>
        <select style={S.loginInput} value={nombre} onChange={e => setNombre(e.target.value)}>
          <option value="">Seleccionar usuario…</option>
          {[...usuarios]
            .sort((a, b) => {
              if (a.nombre === "Invitado") return 1;
              if (b.nombre === "Invitado") return -1;
              return a.nombre.localeCompare(b.nombre, "es");
            })
            .map(u => (
              <option key={u.nombre} value={u.nombre}>{u.nombre}{u.admin ? " ★" : ""}</option>
            ))}
        </select>
        <label style={S.loginLabel}>PIN</label>
        <input
          style={{ ...S.loginInput, fontSize: 24, letterSpacing: 10, textAlign: "center" }}
          type="password" inputMode="numeric" maxLength={6} placeholder="••••"
          value={pin} onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
        />
        {error && <div style={S.loginError}>⚠️ {error}</div>}
        {loading
          ? <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 13, padding: "8px 0", marginTop: 20 }}>Cargando usuarios…</div>
          : <button style={S.loginBtn(!nombre || !pin)} onClick={submit} disabled={!nombre || !pin}>Ingresar →</button>
        }
      </div>
    </div>
  );
}

// ── BOTTOM NAV ────────────────────────────────────────────────────────────────
function BottomNav({ active, onChange }) {
  return (
    <nav style={S.nav}>
      {MODULES.map(m => {
        const isActive = m.id === active;
        return (
          <button key={m.id} style={S.navItem(isActive)} onClick={() => onChange(m.id)}>
            <div style={{ position: "relative" }}>
              {isActive && <div style={S.navIndicator} />}
              <span style={S.navIcon(isActive)}>{m.icon}</span>
            </div>
            <span style={S.navLabel(isActive)}>{m.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [usuario,     setUsuario]     = useState(() => loadSession());
  const [usuarios,    setUsuarios]    = useState([]);
  const [loadingU,    setLoadingU]    = useState(true);
  const [loginError,  setLoginError]  = useState("");

  const [module,      setModule]      = useState("lila");
  const [config,      setConfig]      = useState({});
  const [showAdmin,   setShowAdmin]   = useState(false);
  const [toast,       setToast]       = useState("");

  // SKU activo — global por turno, persiste en localStorage
  const [sku,         setSku]         = useState(() => loadSku());
  // Centerlines — se cargan una vez y se pasan a DosificacionesModule
  const [centerlines, setCenterlines] = useState({ rows: [], skus: [] });

  // Cargar usuarios
  useEffect(() => {
    fetchUsuarios().then(u => {
      setUsuarios(u);
      const sess = loadSession();
      if (sess) {
        const actualizado = u.find(x => x.nombre === sess.nombre);
        if (actualizado) { saveSession(actualizado); setUsuario(actualizado); }
      }
    }).finally(() => setLoadingU(false));
  }, []);

  // Cargar config
  useEffect(() => { fetchConfig().then(c => setConfig(c)); }, []);

  // Cargar centerlines
  useEffect(() => { fetchCenterlines().then(cl => setCenterlines(cl)); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const handleSkuChange = (v) => { setSku(v); saveSku(v); };

  const handleLogin = (nombre, pin) => {
    const user = usuarios.find(u => u.nombre === nombre && String(u.pin) === String(pin));
    if (user) { saveSession(user); setUsuario(user); setLoginError(""); }
    else       { setLoginError("PIN incorrecto. Intenta de nuevo."); }
  };

  const handleLogout = () => {
    clearSession(); setUsuario(null); setLoginError(""); setModule("lila");
  };

  // Pantalla de login
  if (!usuario) {
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <LoginScreen usuarios={usuarios} onLogin={handleLogin} error={loginError} loading={loadingU} />
      </>
    );
  }

  // ── App Shell ──────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={S.header}>
        <div style={S.headerRow}>
          <div>
            <div style={S.headerTitle}>{MODULE_TITLES[module]}</div>
            <div style={S.headerSub}>
              <span style={S.headerUser}>{usuario.nombre}{usuario.admin ? " ★" : ""}</span>
              {/* SKU selector global */}
              <div style={S.skuWrap}>
                <span style={S.skuLabel}>SKU</span>
                <select
                  style={S.skuSelect}
                  value={sku}
                  onChange={e => handleSkuChange(e.target.value)}
                >
                  <option value="">—</option>
                  {(centerlines.skus.length > 0 ? centerlines.skus : []).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {usuario.admin && (
              <button style={S.gearBtn} onClick={() => setShowAdmin(true)} title="Gestión de productos">
                🛠
              </button>
            )}
            <button style={S.logoutBtn} onClick={handleLogout}>Salir</button>
          </div>
        </div>
      </header>

      {/* Módulo activo */}
      {module === "lila"    && <LilaModule    usuario={usuario} showToast={showToast} />}
      {module === "niveles" && <NivelesModule usuario={usuario} config={config} showToast={showToast} />}
      {module === "dash"    && <DashboardModule />}
      {module === "dosis"   && (
        <DosificacionesModule
          usuario={usuario}
          showToast={showToast}
          sku={sku}
          centerlines={centerlines}
        />
      )}

      {/* Nav inferior */}
      <BottomNav active={module} onChange={setModule} />

      {/* Panel admin */}
      {showAdmin && usuario.admin && (
        <AdminPanel
          config={config}
          onClose={() => setShowAdmin(false)}
          onSaved={(newConfig) => { setConfig(newConfig); showToast("✅ Configuración guardada"); }}
        />
      )}

      {/* Toast */}
      <div style={S.toast(!!toast)}>{toast}</div>
    </div>
  );
}
