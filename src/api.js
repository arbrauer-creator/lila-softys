// ── APPS SCRIPT ────────────────────────────────────────────────────────────────
export const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby4JKZ7ry6TqNM3vGRLu7kjdPVN3Ck0Pss0WbWYTFutVVow2PhByCLVbZjuV0CbdY8S/exec";

// BBDD MP03 published CSV base
const BBDD_PUB = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRwNCuRZGGGhH7RYWofBTY1lDK-JGCCbbLj3xtIYznUcaiqP4rjAF_6f2RqFLMsIyUZtu5WLtB2F9i2/pub?single=true&output=csv&gid=";
export const GID_CONSUMOS = "958102669";
export const GID_NIVELES  = "1163712205";
export const GID_DOSIS    = "727307735";

// ── SESSION (12 h) ─────────────────────────────────────────────────────────────
const SESSION_KEY = "lila_session";
const SESSION_TTL = 12 * 60 * 60 * 1000;
export function saveSession(user)  { try { localStorage.setItem(SESSION_KEY, JSON.stringify({ user, exp: Date.now() + SESSION_TTL })); } catch(_) {} }
export function clearSession()     { localStorage.removeItem(SESSION_KEY); }
export function loadSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (s && s.exp > Date.now()) return s.user;
    localStorage.removeItem(SESSION_KEY);
  } catch {}
  return null;
}

// ── DATE HELPERS ──────────────────────────────────────────────────────────────
export const todayStr    = () => new Date().toLocaleDateString("sv-SE",  { timeZone: "America/Santiago" });
export const nowSantiago = () => new Date().toLocaleString  ("sv-SE",  { timeZone: "America/Santiago" }).replace(" ", "T");
export function fmtDate(d) {
  if (!d) return "";
  return new Date(d + "T12:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── IMAGE COMPRESSION ─────────────────────────────────────────────────────────
export async function compressImage(dataUrl, maxPx = 900, quality = 0.60) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ── PHOTO UPLOAD ──────────────────────────────────────────────────────────────
export async function uploadPhotoToDrive({ imageBase64, mimeType, filename, fechaFolder, equipoFolder }) {
  if (!APPS_SCRIPT_URL) return null;
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ type: "photo", imageBase64, mimeType, filename, fechaFolder, equipoFolder }),
      redirect: "follow",
    });
    const data = await res.json();
    if (data.url) return { url: data.url, thumbnail: data.thumbnail };
    return null;
  } catch { return null; }
}

// ── LILA ──────────────────────────────────────────────────────────────────────
export async function sendLilaRecord(reg) {
  if (!APPS_SCRIPT_URL) return;
  try { await fetch(APPS_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(reg) }); } catch (_) {}
}

// ── USUARIOS ──────────────────────────────────────────────────────────────────
export async function fetchUsuarios() {
  if (!APPS_SCRIPT_URL) return [];
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000); // 12 s timeout
  try {
    const res  = await fetch(APPS_SCRIPT_URL + "?action=getUsers", { redirect: "follow", signal: ctrl.signal });
    const data = await res.json();
    const raw  = Array.isArray(data.users) ? data.users : [];
    // Normaliza nombres de propiedades para tolerar variaciones de encabezado en la hoja
    // (Nombre/nombre/name, PIN/pin/Pin, Admin/admin, etc.)
    const parseBool = (v) => {
      if (typeof v === "boolean") return v;
      if (typeof v === "number")  return v !== 0;
      const s = String(v ?? "").toLowerCase().trim();
      return s === "true" || s === "verdadero" || s === "1" || s === "sí" || s === "si";
    };
    return raw
      .filter(u => u && typeof u === "object")
      .map(u => ({
        nombre:    u.nombre    ?? u.Nombre    ?? u.name      ?? u.Name      ?? "",
        pin:       String(u.pin ?? u.Pin ?? u.PIN ?? ""),
        admin:     parseBool(u.admin ?? u.Admin ?? u.isAdmin),
        secciones: u.secciones ?? u.Secciones ?? {},
      }))
      .filter(u => u.nombre !== "");
  } catch { return []; }
  finally { clearTimeout(timer); }
}

// ── CONFIG (productos activos/inactivos) ──────────────────────────────────────
export function invalidateConfigCache() { localStorage.removeItem("lila_config"); }
function _getCachedConfig() {
  try {
    const s = JSON.parse(localStorage.getItem("lila_config") || "null");
    if (s && s.exp > Date.now()) return s.config;
  } catch {}
  return null;
}
export async function fetchConfig() {
  const cached = _getCachedConfig();
  if (cached) return cached;
  if (!APPS_SCRIPT_URL) return {};
  try {
    const res  = await fetch(APPS_SCRIPT_URL + "?action=getConfig", { redirect: "follow" });
    const data = await res.json();
    const config = data.config || {};
    localStorage.setItem("lila_config", JSON.stringify({ config, exp: Date.now() + 5 * 60 * 1000 }));
    return config;
  } catch { return {}; }
}
export async function saveConfig(config) {
  invalidateConfigCache();
  if (!APPS_SCRIPT_URL) return null;
  try {
    const res  = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ type: "config", config }),
      redirect: "follow",
    });
    return await res.json();
  } catch { return null; }
}

// ── NIVELES ───────────────────────────────────────────────────────────────────
export async function saveNiveles(payload) {
  if (!APPS_SCRIPT_URL) return;
  try { await fetch(APPS_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ type: "niveles", ...payload }) }); } catch (_) {}
}
export async function fetchLastNiveles() {
  if (!APPS_SCRIPT_URL) return {};
  try {
    const res  = await fetch(APPS_SCRIPT_URL + "?action=getLastNiveles", { redirect: "follow" });
    const data = await res.json();
    return data.niveles || {};
  } catch { return {}; }
}

// ── DOSIFICACIONES ────────────────────────────────────────────────────────────
export async function saveDosificacion(payload) {
  if (!APPS_SCRIPT_URL) return;
  try { await fetch(APPS_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ type: "dosificacion", ...payload }) }); } catch (_) {}
}
export async function fetchDosificaciones() {
  if (!APPS_SCRIPT_URL) return [];
  try {
    const res  = await fetch(APPS_SCRIPT_URL + "?action=getDosificaciones", { redirect: "follow" });
    const data = await res.json();
    return data.dosificaciones || [];
  } catch { return []; }
}

// ── SKU ACTIVO (persiste en localStorage) ────────────────────────────────────
export function saveSku(sku)  { localStorage.setItem("lila_sku", sku || ""); }
export function loadSku()     { return localStorage.getItem("lila_sku") || ""; }

// ── CENTERLINES (proxy vía Apps Script → hoja "Calculadora dosificación") ────
const CL_CACHE_KEY = "lila_centerlines";
const CL_CACHE_TTL = 15 * 60 * 1000; // 15 min

function _getCachedCenterlines() {
  try {
    const s = JSON.parse(localStorage.getItem(CL_CACHE_KEY) || "null");
    if (s && s.exp > Date.now()) return s.data;
  } catch {}
  return null;
}
export async function fetchCenterlines() {
  const cached = _getCachedCenterlines();
  if (cached) return cached;
  if (!APPS_SCRIPT_URL) return { rows: [], skus: [] };
  try {
    const res  = await fetch(APPS_SCRIPT_URL + "?action=getCenterlines", { redirect: "follow" });
    const data = await res.json();
    const result = { rows: data.rows || [], skus: data.skus || [] };
    localStorage.setItem(CL_CACHE_KEY, JSON.stringify({ data: result, exp: Date.now() + CL_CACHE_TTL }));
    return result;
  } catch { return { rows: [], skus: [] }; }
}
export function invalidateCenterlineCache() { localStorage.removeItem(CL_CACHE_KEY); }
export async function saveCenterlines(rows) {
  invalidateCenterlineCache();
  if (!APPS_SCRIPT_URL) return null;
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ type: "centerlines", rows }),
      redirect: "follow",
    });
    return await res.json();
  } catch { return null; }
}

// ── CSV HELPERS (Dashboard — lee desde BBDD MP03 vía Apps Script proxy) ───────
export async function fetchConsumoRows(days = 30) {
  if (!APPS_SCRIPT_URL) return { headers: [], rows: [] };
  try {
    const res  = await fetch(`${APPS_SCRIPT_URL}?action=getConsumos&days=${days}`, { redirect: "follow" });
    const data = await res.json();
    return data; // { headers: [...], rows: [[...], ...] }
  } catch { return { headers: [], rows: [] }; }
}
export async function fetchNivelesRows(days = 7) {
  if (!APPS_SCRIPT_URL) return { headers: [], rows: [] };
  try {
    const res  = await fetch(`${APPS_SCRIPT_URL}?action=getNivelesHistory&days=${days}`, { redirect: "follow" });
    const data = await res.json();
    return data;
  } catch { return { headers: [], rows: [] }; }
}
