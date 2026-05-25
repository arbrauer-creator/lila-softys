import { useState, useEffect, useCallback, useRef } from "react";

// ── DATA ──────────────────────────────────────────────────────────────────────

const FLOW_UNITS = ["ml/min", "ml/h", "l/min", "l/h"];
const TIME_UNITS = ["s", "min"];

const SECTOR_STYLES = {
  mp3:  { bg: "#E8F5E9", border: "#4CAF50", text: "#1B5E20", icon: "🧪" },
  mp3b: { bg: "#E0F2F7", border: "#0097A7", text: "#006064", icon: "🔧" },
  clar: { bg: "#E3F2FD", border: "#2196F3", text: "#0D47A1", icon: "💧" },
  mp12: { bg: "#FFF8E1", border: "#FFC107", text: "#E65100", icon: "⚙️" },
  eflu: { bg: "#FCE4EC", border: "#E91E63", text: "#880E4F", icon: "♻️" },
};

const SECTORES = [
  {
    id: "mp3", label: "Sala Aditivos MP3 y Sala Azul",
    equipos: [
      {
        n: 1, id: "ecowash", label: "Ecowash", accion: "I,L",
        epp: "Linterna, aire comprimido, línea de agua, careta, guantes de nitrilo",
        lavadosFields: true,
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar y limpiar zona de Ecowash: bombas, sector de tablero y sector de bomba de alta presión", fotos: true },
          { s: 2, f: 1, desc: "Verificar lectura y registrar presión en manómetros de agua 1,2,3,4,N, manómetros de vapor 1 y 2 y temperatura de salida en termómetro" },
          { s: 3, f: 2, desc: "Inspeccionar bombas y líneas, verificar fugas, sonidos extraños y validar por probeta dosificación correcta durante un lavado (21:00 y 4:00)", probeta: true, productos: ["Lavador alcalino", "Lavador ácido"] },
          { s: 4, f: 1, desc: "Verificar correcta posición de válvulas de alimentación de bombas, vapor y agua" },
          { s: 7, f: 1, desc: "Verificar posición de válvulas en la llegada de las regaderas" },
          { s: 5, f: 1, desc: "Validar en pantalla HDMI configuración de parámetros: Tiempo, frecuencia de lavados, flujos de bombas, Presión, Temperatura" },
          { s: 6, f: 1, desc: "Validar nivel en IBC de lavador alcalino, ácido y solvente (mín. 200L), verificar válvula abierta, sin fugas, marcar nivel actual" },
        ],
      },
      {
        n: 2, id: "polimero_mp3", label: "Preparador de polímero MP3", accion: "I,L",
        epp: "Linterna, aire comprimido, línea de agua",
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar y limpiar zona del preparador de polímero y bombas de tornillo del floculante a Floodaf y Saturno registrar presión de maómetro de cada bomba", fotos: true, presionBombas: true },
          { s: 2, f: 2, desc: "Verificar lectura de frecuencia (Hz) de ambos VF, presión en manómetros de línea de dosificación y agua de arrastre (21:00 y 4:00)", frecuenciasVF: true },
          { s: 6, f: 1, desc: "Verificar índice de concentración del preparador de polímero", indiceConcentracion: true },
          { s: 3, f: 1, desc: "Verificar stock de producto y cantidad de polímero en tolva (mínimo 50% de nivel)" },
          { s: 4, f: 1, desc: "Inspeccionar estado de motores agitadores, tornillo dosificador, ruidos extraños y temperatura de reductores y motores" },
          { s: 5, f: 1, desc: "Validar nivel del preparador de polímero: viscosidad correcta, sin presencia de grumos" },
        ],
      },
      {
        n: 3, id: "bombas_sala", label: "Bombas dosificadoras sala aditivo", accion: "I,L",
        epp: "Linterna, aire comprimido, línea de agua", consolidado: true,
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar y limpiar zona de bombas dosificadoras, validar que estén encendidas en modo correspondiente (continuo/batch)", fotos: true },
          { s: 2, f: 1, desc: "Limpiar la carcasa y pantalla de cada una de las bombas" },
          { s: 3, f: 1, desc: "Inspeccionar cada bomba: funcionamiento, sonido, vibración, salida en tubing transparente, partida al 100% por 60 seg" },
          { s: 4, f: 1, desc: "Revisar válvula agua de arrastre y verificar presión (Ecopart al Tq Cabecero: 2 a 2,5 bar)" },
          { s: 5, f: 2, desc: "Verificar por probeta dosificación real (kg/t) vs setpoint de todas las bombas excepto Biocida (21:00 y 4:00)", probeta: true, productos: ["Ecopart Tq Cabecero", "Ecofix 507", "Ecofix 102 Floodaf", "Ecopart Floodaf"] },
          { s: 6, f: 1, desc: "Inspeccionar estado de IBCs: limpios, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥6 horas" },
          { s: 7, f: 1, desc: "Verificar y registrar flujo seteado, nivel de cada IBC, variación esperada y condición visual del producto", tiempos: true, productos_tiempo: ["Ecopart PU 40", "Ecopart PU 12", "Ecoenz C PU 40", "Ecoenz RF 200 PU 12", "Ecoenz RF 200 PU 40", "Eco PC 105 PU 12", "Eco PC 105 PU 40"] },
          { s: 8, f: 1, desc: "Validar correcta llegada de químico al PU 12 y PU 40" },
          { s: 9, f: 1, desc: "Medir pH de PU 12 y PU 40", soloAM: true },
        ],
      },
    ],
  },
  {
    id: "mp3b", label: "MP3",
    equipos: [
      {
        n: 4, id: "regadera_tela", label: "Regadera móvil Tela", accion: "I,L", epp: "Linterna",
        subtareas: [
          { s: 1, f: 1, desc: "Verificar que el esprayado de la regadera sea adecuado" },
          { s: 2, f: 1, desc: "Asegurar que no existan sonidos extraños ni fugas en la regadera y líneas" },
          { s: 3, f: 4, desc: "Asegurar que el movimiento de la regadera es fluido y sin vibraciones anormales" },
          { s: 4, f: 4, desc: "Observar un recorrido completo de la regadera y validar que no pase por sobre los dopes de la tela LM y LA" },
          { s: 5, f: 1, desc: "Verificar lectura de presión en manómetro de bomba (80 a 200 bar)" },
          { s: 6, f: 1, desc: "Inspeccionar y realizar aseo a bomba de alta presión" },
          { s: 7, f: 1, desc: "Revisar correcta selección de parámetros en pantalla HDMI" },
        ],
      },
      {
        n: 5, id: "acond_vest", label: "Acondicionamiento vestimentas", accion: "I", epp: "Linterna",
        subtareas: [
          { s: 1, f: 2, desc: "Inspeccionar regaderas de acondicionamiento de vestimentas tela (1) y paño (2): sprayeado correcto, cobertura adecuada en cada tobera (22:00 y 5:00)", toberas: true },
          { s: 4, f: 1, desc: "Inspeccionar correcto estado de manguera/flexible entrada a las cuatro regaderas" },
          { s: 5, f: 1, desc: "Medir y registrar pH de lavado ácido y alcalino en la regadera de Tela y Paño", phLavado: true },
          { s: 2, f: 2, desc: "Inspeccionar correcto funcionamiento de RAP Tela y Paño: oscilación, flujo laminar del chorro aguja y registrar presión de trabajo" },
          { s: 3, f: 1, desc: "Registrar valores de vacío en vacuómetros de los sifones y de la prensa", vacios: true },
        ],
      },
      {
        n: 6, id: "disp_coag", label: "Dispersante y coagulante zona Dispersión", accion: "I,L",
        epp: "Linterna, aire comprimido, línea de agua",
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar y limpiar zona de bombas dosificadoras, validar encendidas si hay reciclado, detenidas en caso contrario" },
          { s: 2, f: 1, desc: "Limpiar la carcasa y pantalla de cada una de las bombas" },
          { s: 3, f: 1, desc: "Inspeccionar cada bomba: funcionamiento, sonido, vibración, salida en tubing transparente, partida al 100% por 60 seg" },
          { s: 4, f: 1, desc: "Limpiar pretil de rack y de IBC, retirar objetos extraños (tapas, herramientas, amarras)", fotos: true },
          { s: 5, f: 1, desc: "Inspeccionar estado de IBCs: limpios, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
          { s: 6, f: 1, desc: "Verificar y registrar nivel de cada IBC, variación esperada y condición visual del producto" },
          { s: 7, f: 2, desc: "Validar por probeta flujo real y comparar con pantalla y dosis específica por tonelada (21:00 y 4:00)", probeta: true, productos: ["Ecodisp 594 07TqP01", "Ecodisp 594 DNT", "Ecofix 102 07TqP04", "Ecofix 102 Saturno"] },
        ],
      },
    ],
  },
  {
    id: "clar", label: "Clarificadores",
    equipos: [
      {
        n: 7, id: "filtro_grav", label: "Filtro gravitacional", accion: "I,L", epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Malla completa debe estar limpia y sin roturas" },
          { s: 2, f: 1, desc: "Limpiar malla filtro gravitacional", soloAM: true },
        ],
      },
      {
        n: 8, id: "floodaf", label: "Floodaf", accion: "I", epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Barredores operativos y en condición básica, limpiar paletas de barredor, superficie de salida de lodo y de agua clarificada", soloAM: true, fotos: true },
          { s: 2, f: 1, desc: "Inspeccionar correcta formación de floc en escotillas" },
          { s: 3, f: 1, desc: "Asegurar calidad de lodo, espesor del colchón, ausencia de espuma" },
          { s: 4, f: 1, desc: "Inspeccionar correcto funcionamiento de bombas de Airsolver y flujómetro de aire (debe estar entre 10 y 15 Nm³/h)" },
          { s: 5, f: 1, desc: "Inspeccionar calidad del agua clarificada: baja/nula presencia de fibra, medir turbidez (máx. 70, std < 50)", turbidez: true },
          { s: 6, f: 1, desc: "Revisar velocidad de barredores, altura del último barredor para asegurar remoción correcta del lodo" },
          { s: 7, f: 1, desc: "Registrar parámetros de proceso", parametrosProceso: true },
        ],
      },
      {
        n: 9, id: "saturno", label: "Saturno", accion: "I", epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar correcta formación de floc" },
          { s: 2, f: 1, desc: "Asegurar calidad de lodo, espesor del colchón, ausencia de espuma" },
          { s: 3, f: 1, desc: "Inspeccionar calidad del agua clarificada: turbidez (máx. 200, std < 100)", turbidez: true },
          { s: 4, f: 1, desc: "Verificar rango de operación de UDS" },
          { s: 5, f: 1, desc: "Revisar flujo de aire, nivel del clarificador y flujo de entrada", niveles: true },
          { s: 6, f: 1, desc: "Validar correcta llegada de floculante y coagulante" },
        ],
      },
    ],
  },
  {
    id: "mp12", label: "Sector MP2 y MP1",
    equipos: [
      {
        n: 10, id: "bba_enzima", label: "BBA Enzima refinador sala aditivo MP2", accion: "I,L", epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Limpiar la carcasa y pantalla de la bomba" },
          { s: 2, f: 1, desc: "Limpiar pretil de tambor y rack, retirar objetos extraños (tapas, herramientas, amarras)" },
          { s: 3, f: 1, desc: "Validar que bomba se encuentre detenida y medir nivel del tambor, en caso de estar en servicio consultar el motivo a encargado MP02 e indicarlo en la observación" },
          { s: 4, f: 1, desc: "Verificar llegada de químico y medir flujo por probeta" },
        ],
      },
      {
        n: 11, id: "prp1", label: "PRP1", accion: "I,L", epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan", fotos: true },
          { s: 2, f: 1, desc: "Limpiar la carcasa y pantalla de cada una de las bombas" },
          { s: 3, f: 1, desc: "Limpiar pretil de rack y de IBC, retirar objetos extraños" },
          { s: 4, f: 1, desc: "Inspeccionar cada bomba: funcionamiento, sonido y vibración" },
          { s: 5, f: 1, desc: "Verificar y registrar el tiempo de dosificación de cada bomba y el flujo", tiempos: true, productos_tiempo: ["Eco PC 105 PU1 MP1", "Eco PC 105 PU1 MP2", "Eco PC 105 PU2 Celulosa", "Eco Enz RF 200 PU 1 MP1", "Eco Enz RF 200 PU1 MP2", "Eco Enz RF 200 PU2 Celulosa", "Eco Enz RF 200 PU2 Reciclado"] },
          { s: 6, f: 1, desc: "Validar por probeta flujo real de enzima de refinación y comparar con pantalla y dosis específica por tonelada", probeta: true, productos: ["Eco Enz RF 200 PU 1", "Eco Enz RF 200 PU 2"] },
          { s: 7, f: 1, desc: "Inspeccionar estado de IBCs: limpios, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
          { s: 8, f: 1, desc: "Verificar y registrar nivel de cada IBC y condición visual del producto" },
        ],
      },
      {
        n: 12, id: "ecosan431", label: "Ecosan 431 Tq 502", accion: "I,L", epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" },
          { s: 2, f: 1, desc: "Limpiar la carcasa y pantalla de la bomba" },
          { s: 3, f: 1, desc: "Verificar y registrar tiempo de dosificación de la bomba y su flujo" },
          { s: 4, f: 1, desc: "Inspeccionar estado de IBC: limpio, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
          { s: 5, f: 1, desc: "Verificar y registrar nivel del IBC y condición visual del producto" },
        ],
      },
    ],
  },
  {
    id: "eflu", label: "Sector Efluente",
    equipos: [
      { n: 13, id: "polimero_clar", label: "Preparador de polímero clarificación primaria", accion: "I,L", epp: "", subtareas: [
        { s: 1, f: 1, desc: "Inspeccionar y limpiar zona del preparador de polímero y bombas de tornillo del floculante a parshall" },
        { s: 2, f: 1, desc: "Verificar lectura de frecuencia (Hz) de ambos VF, presión en manómetros de línea de dosificación y agua de arrastre", frecuenciasBomba: true },
        { s: 3, f: 1, desc: "Verificar stock de producto y cantidad de polímero en tolva (mínimo 50% de nivel)" },
        { s: 4, f: 1, desc: "Inspeccionar estado de motores de cada etapa, tornillo dosificador, ruidos extraños y temperatura de reductores y motores" },
        { s: 5, f: 1, desc: "Validar nivel del preparador de polímero: viscosidad correcta, sin grumos en los compartimientos" },
      ]},
      { n: 14, id: "ecofix098", label: "Ecofix 098p Cuba", accion: "I,L", epp: "", subtareas: [{ s: 1, f: 1, desc: "Revisar nivel de la cuba. Si está bajo 20%, llenar con agua y añadir un saco lentamente a la solución" }, { s: 2, f: 1, desc: "Inspeccionar y limpiar zona, retirar cualquier objeto que no corresponda" }] },
      { n: 15, id: "polimero_lodo", label: "Preparador de polímero desaguado de lodo", accion: "I,L", epp: "", subtareas: [{ s: 1, f: 1, desc: "Verificar nivel de tolva de preparador de polímero" }, { s: 2, f: 1, desc: "Verificar correcta preparación de floculante" }, { s: 3, f: 1, desc: "Limpiar cascada de agua del preparador" }, { s: 4, f: 1, desc: "Limpiar bomba y verificar flujo de esta" }, { s: 5, f: 1, desc: "Verificar que las 3 cubas del preparador se encuentren al mismo nivel" }] },
      { n: 16, id: "rack_coag", label: "Rack coagulante, Ecopart y Ecofix 098p", accion: "I,L", epp: "", subtareas: [{ s: 1, f: 1, desc: "Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" }, { s: 2, f: 1, desc: "Limpiar la carcasa y pantalla de cada una de las bombas" }, { s: 3, f: 1, desc: "Limpiar pretil de rack y de IBC, retirar objetos extraños" }, { s: 4, f: 1, desc: "Inspeccionar cada bomba: funcionamiento, sonido y vibración" }, { s: 5, f: 1, desc: "Verificar y registrar el flujo en las bombas" }, { s: 6, f: 1, desc: "Inspeccionar estado de IBCs: limpios, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" }, { s: 7, f: 1, desc: "Verificar dosificación por probeta de Ecopart y Ecofix 102", probeta: true, productos: ["Ecopart", "Ecofix 102"] }, { s: 8, f: 1, desc: "Verificar y registrar nivel de cada IBC y condición visual del producto" }] },
      { n: 17, id: "rack_olor", label: "Rack control de olor", accion: "I,L", epp: "", subtareas: [{ s: 1, f: 1, desc: "Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" }, { s: 2, f: 1, desc: "Limpiar la carcasa y pantalla de cada una de las bombas" }, { s: 3, f: 1, desc: "Inspeccionar cada bomba: funcionamiento, sonido y vibración" }, { s: 4, f: 1, desc: "Verificar y registrar el flujo en las bombas" }, { s: 5, f: 1, desc: "Inspeccionar estado de IBC: limpio, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" }, { s: 6, f: 1, desc: "Verificar dosificación por probeta de cada bomba", probeta: true, productos: ["Bomba 1", "Bomba 2"] }, { s: 7, f: 1, desc: "Verificar y registrar nivel del IBC y condición visual del producto" }] },
      { n: 18, id: "rack_biocida", label: "Rack biocida filtros de arena", accion: "I,L", epp: "", subtareas: [{ s: 1, f: 1, desc: "Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" }, { s: 2, f: 1, desc: "Limpiar la carcasa y pantalla de cada una de las bombas" }, { s: 3, f: 1, desc: "Inspeccionar cada bomba: funcionamiento, sonido y vibración" }, { s: 4, f: 1, desc: "Inspeccionar estado de IBC: limpio, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" }, { s: 5, f: 1, desc: "Verificar y registrar el flujo en las bombas" }, { s: 6, f: 1, desc: "Verificar y registrar nivel del IBC y condición visual del producto" }] },
      { n: 19, id: "rack_nutri", label: "Rack nutrientes bioreactor", accion: "I,L", epp: "", subtareas: [{ s: 1, f: 1, desc: "Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" }, { s: 2, f: 1, desc: "Limpiar la carcasa y pantalla de cada una de las bombas" }, { s: 3, f: 1, desc: "Inspeccionar cada bomba: funcionamiento, sonido y vibración" }, { s: 4, f: 1, desc: "Inspeccionar estado de IBC: limpio, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" }, { s: 5, f: 1, desc: "Validar por probeta flujo real y comparar con pantalla y dosis específica por tonelada", probeta: true, productos: ["Nutriente 1", "Nutriente 2"] }, { s: 6, f: 1, desc: "Verificar y registrar el flujo en las bombas" }, { s: 7, f: 1, desc: "Verificar y registrar nivel del IBC y condición visual del producto" }] },
      { n: 20, id: "rack_antiespuma", label: "Rack antiespumante y biocida", accion: "I,L", epp: "", subtareas: [{ s: 1, f: 1, desc: "Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" }, { s: 2, f: 1, desc: "Limpiar la carcasa y pantalla de cada una de las bombas" }, { s: 3, f: 1, desc: "Inspeccionar cada bomba: funcionamiento, sonido y vibración" }, { s: 4, f: 1, desc: "Inspeccionar estado de IBC: limpio, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" }, { s: 5, f: 1, desc: "Verificar y registrar el flujo en las bombas" }, { s: 6, f: 1, desc: "Verificar y registrar nivel del IBC y condición visual del producto" }] },
    ],
  },
];

// ── LILA 2 ────────────────────────────────────────────────────────────────────
function getSectoresLila2() {
  const CFG = {
    ecowash:       { allSubtareas: true, noLavados: true },
    polimero_mp3:  { onlyS: [1, 2] },
    regadera_tela: { allSubtareas: true },
    acond_vest:    { allSubtareas: true, excludeS: [3] },
    filtro_grav:   { allSubtareas: true },
    floodaf:       { allSubtareas: true },
    saturno:       { allSubtareas: true },
    prp1:          { onlyS: [4, 6] },
  };
  const result = [];
  for (const sec of SECTORES) {
    const equipos = [];
    for (const eq of sec.equipos) {
      const cfg = CFG[eq.id];
      if (!cfg) continue;
      const subtareas = cfg.allSubtareas
        ? eq.subtareas.filter(st => !(cfg.excludeS || []).includes(st.s))
        : eq.subtareas.filter(st => (cfg.onlyS || []).includes(st.s));
      if (!subtareas.length) continue;
      equipos.push({ ...eq, subtareas, lavadosFields: cfg.noLavados ? false : eq.lavadosFields });
    }
    if (equipos.length) result.push({ ...sec, equipos });
  }
  return result;
}

// ── GOOGLE SHEETS ─────────────────────────────────────────────────────────────
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby4JKZ7ry6TqNM3vGRLu7kjdPVN3Ck0Pss0WbWYTFutVVow2PhByCLVbZjuV0CbdY8S/exec";

// ── PHOTO UPLOAD ──────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function compressImage(dataUrl, maxPx = 1200, quality = 0.72) {
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

async function uploadPhotoToDrive({ imageBase64, mimeType, filename, fechaFolder, equipoFolder }) {
  if (!APPS_SCRIPT_URL) return null;
  const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    fetch(APPS_SCRIPT_URL, {
      method: "POST", mode: "no-cors",
      body: JSON.stringify({ type: "photo", uploadId, imageBase64, mimeType, filename, fechaFolder, equipoFolder }),
    });
  } catch (_) {}
  // Esperar que el script procese, luego pollear por el URL
  await sleep(3000);
  for (let i = 0; i < 10; i++) {
    try {
      const res  = await fetch(`${APPS_SCRIPT_URL}?action=getPhoto&id=${uploadId}`, { redirect: "follow" });
      const data = await res.json();
      if (data.url) return { url: data.url, thumbnail: data.thumbnail };
    } catch (_) {}
    await sleep(1500);
  }
  return null;
}

async function sendToSheets(reg) {
  if (!APPS_SCRIPT_URL) return;
  try {
    await fetch(APPS_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(reg) });
  } catch (_) {}
}

async function fetchUsuarios() {
  if (!APPS_SCRIPT_URL) return [];
  try {
    const res = await fetch(APPS_SCRIPT_URL + "?action=getUsers", { redirect: "follow" });
    const data = await res.json();
    return data.users || [];
  } catch (_) { return []; }
}

// ── SESIÓN (12 h) ─────────────────────────────────────────────────────────────
const SESSION_KEY = "lila_session";
const SESSION_TTL = 12 * 60 * 60 * 1000;

function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, exp: Date.now() + SESSION_TTL }));
}
function loadSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (s && s.exp > Date.now()) return s.user;
    localStorage.removeItem(SESSION_KEY);
  } catch {}
  return null;
}
function clearSession() { localStorage.removeItem(SESSION_KEY); }

// ── HELPERS ───────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Santiago" }); }
function nowSantiago() { return new Date().toLocaleString("sv-SE", { timeZone: "America/Santiago" }).replace(" ", "T"); }
function fmtDate(d) {
  if (!d) return "";
  return new Date(d + "T12:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const S = {
  app: { minHeight: "100vh", background: "#F5F7FA", fontFamily: "'DM Sans', sans-serif", fontSize: 15 },
  header: { background: "#1A2744", color: "#fff", padding: "14px 16px 10px", position: "sticky", top: 0, zIndex: 100 },
  headerTitle: { fontSize: 17, fontWeight: 700, letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  tabBar: { display: "flex", background: "#fff", borderBottom: "1.5px solid #E2E8F0", position: "sticky", top: 58, zIndex: 99 },
  tab: (active) => ({ flex: 1, padding: "11px 4px", textAlign: "center", fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "#1A2744" : "#94A3B8", borderBottom: active ? "2.5px solid #1A2744" : "2.5px solid transparent", cursor: "pointer", background: "none", border: "none", letterSpacing: 0.2 }),
  page: { padding: "12px 12px 80px" },
  card: { background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 12, overflow: "hidden" },
  cardPad: { padding: "14px 14px" },
  sectionHdr: (c) => ({ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, background: c.bg, borderBottom: `1.5px solid ${c.border}`, cursor: "pointer" }),
  sectionHdrText: (c) => ({ fontSize: 13, fontWeight: 700, color: c.text, flex: 1 }),
  equipoHdr: { padding: "11px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", borderBottom: "1px solid #F1F5F9" },
  equipoNum: { width: 24, height: 24, borderRadius: 6, background: "#1A2744", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" },
  equipoLabel: { fontSize: 13, fontWeight: 600, color: "#1E293B", flex: 1, lineHeight: 1.3 },
  stRow: { borderBottom: "1px solid #F1F5F9", padding: "10px 14px" },
  stDesc: { fontSize: 13, color: "#334155", lineHeight: 1.5, marginBottom: 8 },
  stFreq: { fontSize: 11, color: "#94A3B8", marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" },
  stateBar: { display: "flex", gap: 6, marginBottom: 8 },
  stateBtn: (active, c) => ({ flex: 1, padding: "7px 4px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1.5px solid ${active ? c.border : "#E2E8F0"}`, background: active ? c.bg : "#F8FAFC", color: active ? c.text : "#94A3B8", cursor: "pointer" }),
  fieldLabel: { fontSize: 11, color: "#64748B", marginBottom: 4, display: "block", fontWeight: 500 },
  input: { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "8px 10px", fontSize: 14, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit", boxSizing: "border-box" },
  select: { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "8px 10px", fontSize: 14, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit" },
  textarea: { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "8px 10px", fontSize: 13, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit", resize: "vertical", minHeight: 56, boxSizing: "border-box" },
  probetaBox: { background: "#FFFBEB", border: "1.5px solid #FCD34D", borderRadius: 10, padding: 10, marginBottom: 8 },
  probetaTitle: { fontSize: 11, fontWeight: 700, color: "#92400E", marginBottom: 8 },
  prodRow: { background: "#fff", borderRadius: 8, padding: "8px 10px", marginBottom: 6, border: "1px solid #FEF3C7" },
  prodName: { fontSize: 12, fontWeight: 600, color: "#78350F", marginBottom: 6 },
  inlineRow: { display: "flex", gap: 6 },
  inlineField: { flex: 1 },
  unitSel: { width: 80, border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "7px 6px", fontSize: 13, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit" },
  tiempoBox: { background: "#F0F9FF", border: "1.5px solid #7DD3FC", borderRadius: 10, padding: 10, marginBottom: 8 },
  tiempoTitle: { fontSize: 11, fontWeight: 700, color: "#075985", marginBottom: 8 },
  lavadosBox: { background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 10, padding: 12, margin: "0 14px 12px" },
  lavadosTitle: { fontSize: 11, fontWeight: 700, color: "#166534", marginBottom: 10 },
  lavadosSec: { background: "#fff", borderRadius: 8, padding: 10, marginBottom: 8, border: "1px solid #D1FAE5" },
  lavadosSecTitle: { fontSize: 12, fontWeight: 700, color: "#15803D", marginBottom: 8 },
  vaciosBox: { background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 10, padding: 10, marginBottom: 8 },
  vaciosNote: { fontSize: 11, fontWeight: 700, color: "#C2410C", background: "#FFEDD5", borderRadius: 6, padding: "5px 10px", marginBottom: 10, display: "block" },
  turbidezBox: { background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: 8, padding: "8px 10px", marginBottom: 8 },
  nivelesBox: { background: "#F5F3FF", border: "1.5px solid #C4B5FD", borderRadius: 10, padding: 10, marginBottom: 8 },
  nivelesTitle: { fontSize: 11, fontWeight: 700, color: "#5B21B6", marginBottom: 8 },
  progBar: () => ({ height: 4, borderRadius: 2, background: "#E2E8F0", overflow: "hidden" }),
  progFill: (pct) => ({ height: "100%", width: `${pct}%`, background: pct === 100 ? "#22C55E" : "#3B82F6", borderRadius: 2, transition: "width 0.3s" }),
  badge: (c) => ({ display: "inline-block", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: c.bg, color: c.text }),
  primaryBtn: { width: "100%", padding: "14px", borderRadius: 12, background: "#1A2744", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", letterSpacing: 0.2 },
  versionBtn: (active) => ({ flex: 1, padding: "11px 8px", borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: "center", border: `2px solid ${active ? "#1A2744" : "#E2E8F0"}`, background: active ? "#1A2744" : "#F8FAFC", color: active ? "#fff" : "#94A3B8", cursor: "pointer" }),
  versionBadge: (v) => ({ display: "inline-block", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: v === "lila2" ? "#FEF3C7" : "#EFF6FF", color: v === "lila2" ? "#92400E" : "#1D4ED8", marginLeft: 6 }),
  chip: (bg, color) => ({ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: bg, color }),
  metricCard: (c) => ({ background: c, borderRadius: 12, padding: "14px 12px", textAlign: "center" }),
  metricVal: { fontSize: 28, fontWeight: 800, color: "#1E293B" },
  metricLbl: { fontSize: 11, color: "#64748B", marginTop: 2 },
  toast: (show) => ({ position: "fixed", bottom: 20, left: "50%", transform: `translateX(-50%) translateY(${show ? 0 : 80}px)`, background: "#1A2744", color: "#fff", padding: "10px 20px", borderRadius: 20, fontSize: 13, fontWeight: 600, zIndex: 999, transition: "transform 0.3s", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }),
  histCard: { background: "#fff", borderRadius: 12, padding: "12px 14px", marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  loginWrap: { minHeight: "100vh", background: "#F5F7FA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" },
  loginCard: { width: "100%", maxWidth: 360, background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 8px 32px rgba(0,0,0,0.10)" },
  loginTitle: { fontSize: 24, fontWeight: 800, color: "#1A2744", textAlign: "center", marginBottom: 4 },
  loginSub: { fontSize: 13, color: "#64748B", textAlign: "center", marginBottom: 28 },
  loginLabel: { fontSize: 11, fontWeight: 700, color: "#64748B", letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 6 },
  loginInput: { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "11px 14px", fontSize: 15, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 14 },
  loginBtn: (disabled) => ({ width: "100%", padding: "13px", borderRadius: 12, background: disabled ? "#CBD5E1" : "#1A2744", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: disabled ? "not-allowed" : "pointer", marginTop: 4 }),
  loginError: { fontSize: 13, color: "#B91C1C", background: "#FEE2E2", borderRadius: 8, padding: "8px 12px", marginBottom: 14, textAlign: "center" },
};

const STATE_COLORS = {
  "Hecho":     { bg: "#DCFCE7", border: "#4ADE80", text: "#15803D" },
  "No OK":     { bg: "#FEE2E2", border: "#F87171", text: "#B91C1C" },
  "Pendiente": { bg: "#FEF9C3", border: "#FBBF24", text: "#92400E" },
  "N/A":       { bg: "#F1F5F9", border: "#CBD5E1", text: "#64748B" },
};
const STATE_LABELS = ["Hecho", "No OK", "Pendiente", "N/A"];

// ── LOGIN ──────────────────────────────────────────────────────────────────────
function LoginScreen({ usuarios, onLogin, error, loading }) {
  const [nombre, setNombre] = useState("");
  const [pin, setPin] = useState("");
  const submit = () => { if (nombre && pin) onLogin(nombre, pin); };
  return (
    <div style={S.loginWrap}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏭</div>
        <div style={S.loginTitle}>LILA</div>
        <div style={S.loginSub}>Softys Talagante</div>
      </div>
      <div style={S.loginCard}>
        <label style={S.loginLabel}>Usuario</label>
        <select style={S.loginInput} value={nombre} onChange={e => setNombre(e.target.value)}>
          <option value="">Seleccionar usuario...</option>
          {usuarios.map(u => <option key={u.nombre} value={u.nombre}>{u.nombre}{u.admin ? " ★" : ""}</option>)}
        </select>
        <label style={S.loginLabel}>PIN</label>
        <input style={{ ...S.loginInput, fontSize: 24, letterSpacing: 10, textAlign: "center" }}
          type="password" inputMode="numeric" maxLength={6} placeholder="••••"
          value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
        {error && <div style={S.loginError}>⚠️ {error}</div>}
        {loading
          ? <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 13, padding: "8px 0" }}>Cargando usuarios…</div>
          : <button style={S.loginBtn(!nombre || !pin)} onClick={submit} disabled={!nombre || !pin}>Ingresar →</button>}
      </div>
    </div>
  );
}

// ── FIELD COMPONENTS ──────────────────────────────────────────────────────────

function PhotoFields({ vals, onChange, eqId, stS }) {
  const valsRef = useRef(vals);
  useEffect(() => { valsRef.current = vals; }, [vals]);

  const [uploading, setUploading] = useState({}); // { "anterior_0": true }
  const [driveOk,  setDriveOk]   = useState({}); // { "anterior_0": true/false }

  const grupos = [
    { key: "anterior",  label: "📷 Foto estado anterior"  },
    { key: "posterior", label: "📷 Foto estado posterior" },
  ];

  const handleFile = async (grupo, idx, e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    const slotKey = `${grupo}_${idx}`;

    // Leer y comprimir imagen
    const rawUrl = await new Promise(resolve => {
      const r = new FileReader();
      r.onload = ev => resolve(ev.target.result);
      r.readAsDataURL(file);
    });
    const compressed = await compressImage(rawUrl);

    // Mostrar preview local inmediatamente
    {
      const cur = valsRef.current || {};
      const arr = [...(cur[grupo] || [null, null, null])];
      arr[idx] = { preview: compressed, driveUrl: null, thumbnail: null };
      onChange({ ...cur, [grupo]: arr });
    }

    setUploading(p => ({ ...p, [slotKey]: true }));
    setDriveOk(p => ({ ...p, [slotKey]: null }));

    // Subir a Drive
    try {
      const [header, imageBase64] = compressed.split(",");
      const mimeType = header.match(/:(.*?);/)[1];
      const fechaFolder = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Santiago" }).slice(0, 7);
      const equipoFolder = eqId ? `${eqId}_s${stS}` : "general";
      const filename = `${equipoFolder}_${slotKey}_${Date.now()}.jpg`;

      const result = await uploadPhotoToDrive({ imageBase64, mimeType, filename, fechaFolder, equipoFolder });

      setUploading(p => ({ ...p, [slotKey]: false }));
      setDriveOk(p => ({ ...p, [slotKey]: !!result }));

      if (result) {
        const cur = valsRef.current || {};
        const arr = [...(cur[grupo] || [null, null, null])];
        arr[idx] = { preview: compressed, driveUrl: result.url, thumbnail: result.thumbnail };
        onChange({ ...cur, [grupo]: arr });
      }
    } catch (_) {
      setUploading(p => ({ ...p, [slotKey]: false }));
      setDriveOk(p => ({ ...p, [slotKey]: false }));
    }
  };

  const handleRemove = (grupo, idx) => {
    const cur = valsRef.current || {};
    const arr = [...(cur[grupo] || [null, null, null])];
    arr[idx] = null;
    onChange({ ...cur, [grupo]: arr });
    const slotKey = `${grupo}_${idx}`;
    setUploading(p => ({ ...p, [slotKey]: false }));
    setDriveOk(p => ({ ...p, [slotKey]: null }));
  };

  return (
    <div style={{ background: "#EEF2FF", border: "1.5px solid #C7D7FD", borderRadius: 10, padding: 10, marginBottom: 8 }}>
      {grupos.map(({ key, label }, gi) => (
        <div key={key} style={{ marginBottom: gi === 0 ? 10 : 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#3730A3", marginBottom: 6 }}>{label}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1, 2].map(idx => {
              const slot     = (vals?.[key] || [])[idx];
              const slotKey  = `${key}_${idx}`;
              const isUp     = uploading[slotKey];
              const ok       = driveOk[slotKey];
              const preview  = slot?.preview || (typeof slot === "string" ? slot : null);
              const driveUrl = slot?.driveUrl;

              return (
                <div key={idx} style={{ position: "relative", width: 80, height: 80, borderRadius: 10, border: preview ? "2px solid #6366F1" : "1.5px dashed #A5B4FC", background: preview ? "transparent" : "#F5F3FF", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {preview ? (
                    <>
                      <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {/* Badge Drive */}
                      <div style={{ position: "absolute", bottom: 2, left: 2, right: 2 }}>
                        {isUp && (
                          <div style={{ background: "rgba(0,0,0,0.65)", borderRadius: 4, padding: "1px 4px", fontSize: 9, color: "#FCD34D", textAlign: "center" }}>⏳ Subiendo…</div>
                        )}
                        {!isUp && ok === true && (
                          <a href={driveUrl} target="_blank" rel="noreferrer" style={{ display: "block", background: "rgba(21,128,61,0.85)", borderRadius: 4, padding: "1px 4px", fontSize: 9, color: "#fff", textAlign: "center", textDecoration: "none" }}>✓ Drive</a>
                        )}
                        {!isUp && ok === false && (
                          <div style={{ background: "rgba(185,28,28,0.8)", borderRadius: 4, padding: "1px 4px", fontSize: 9, color: "#fff", textAlign: "center" }}>⚠ Error</div>
                        )}
                      </div>
                      <button onClick={() => handleRemove(key, idx)} style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, lineHeight: 1 }}>✕</button>
                    </>
                  ) : (
                    <label style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#818CF8", fontSize: 10, width: "100%", height: "100%" }}>
                      <span style={{ fontSize: 22 }}>📷</span>
                      <span style={{ marginTop: 2 }}>Foto {idx + 1}</span>
                      <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => handleFile(key, idx, e)} />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function PresionBombasFields({ vals, onChange }) {
  const v = vals || {};
  const bombas = [
    { key: "floodaf", label: "Presión bomba Floodaf (bar)" },
    { key: "saturno", label: "Presión bomba Saturno (bar)" },
  ];
  const getAlert = (val) => {
    const n = parseFloat(val);
    if (isNaN(n) || val === "") return null;
    if (n < 2.5) return { msg: "⚠️ Por debajo del mínimo (2,5 bar)", ok: false };
    if (n > 5)   return { msg: "⚠️ Por encima del máximo (5 bar)", ok: false };
    return { msg: "✓ Valor en rango (2,5 – 5 bar)", ok: true };
  };
  return (
    <div style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 10, padding: 10, marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#C2410C", marginBottom: 8 }}>🔧 Presión manómetros de bomba</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {bombas.map(({ key, label }) => {
          const alert = getAlert(v[key] || "");
          return (
            <div key={key}>
              <label style={S.fieldLabel}>{label}</label>
              <input
                style={{ ...S.input, fontSize: 13, borderColor: alert ? (alert.ok ? "#86EFAC" : "#FCA5A5") : "#E2E8F0" }}
                type="number" min="0" max="11" step="0.1" placeholder="0.0"
                value={v[key] || ""}
                onChange={e => onChange({ ...v, [key]: e.target.value })} />
              {alert && (
                <div style={{ fontSize: 10, fontWeight: 600, marginTop: 3, padding: "2px 6px", borderRadius: 5, background: alert.ok ? "#F0FDF4" : "#FEF2F2", color: alert.ok ? "#15803D" : "#B91C1C" }}>
                  {alert.msg}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FrecuenciasVFFields({ vals, onChange }) {
  const v = vals || {};
  return (
    <div style={{ background: "#F0F9FF", border: "1.5px solid #7DD3FC", borderRadius: 10, padding: 10, marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#075985", marginBottom: 8 }}>⚡ Frecuencia VF (Hz)</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[["floodaf", "Frecuencia (Hz) Floodaf"], ["saturno", "Frecuencia (Hz) Saturno"]].map(([key, label]) => (
          <div key={key}>
            <label style={S.fieldLabel}>{label}</label>
            <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" max="50" step="0.1" placeholder="0.0"
              value={v[key] || ""} onChange={e => onChange({ ...v, [key]: e.target.value })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FrecuenciasBombaFields({ vals, onChange }) {
  const v = vals || {};
  return (
    <div style={{ background: "#FFF1F2", border: "1.5px solid #FECDD3", borderRadius: 10, padding: 10, marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#BE123C", marginBottom: 8 }}>📊 Parámetros de frecuencia</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        <div>
          <label style={S.fieldLabel}>Frecuencia bomba (Hz)</label>
          <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" max="50" step="0.1" placeholder="0.0"
            value={v.hz || ""} onChange={e => onChange({ ...v, hz: e.target.value })} />
        </div>
        <div>
          <label style={S.fieldLabel}>Presión manómetro</label>
          <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" max="11" step="0.1" placeholder="0.0"
            value={v.presion || ""} onChange={e => onChange({ ...v, presion: e.target.value })} />
        </div>
        <div>
          <label style={S.fieldLabel}>Índice preparador</label>
          <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0"
            value={v.indice || ""} onChange={e => onChange({ ...v, indice: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

function ParametrosProceso({ vals, onChange }) {
  const v = vals || {};
  return (
    <div style={{ background: "#F5F3FF", border: "1.5px solid #C4B5FD", borderRadius: 10, padding: 10, marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#5B21B6", marginBottom: 8 }}>📊 Parámetros de proceso</div>
      <div style={{ marginBottom: 6 }}>
        <label style={S.fieldLabel}>Flujo de entrada</label>
        <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0"
          value={v.flujo_entrada || ""} onChange={e => onChange({ ...v, flujo_entrada: e.target.value })} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {[1, 2, 3].map(n => (
          <div key={n}>
            <label style={S.fieldLabel}>Vel. barredor {n}</label>
            <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0"
              value={v[`vel_barredor${n}`] || ""} onChange={e => onChange({ ...v, [`vel_barredor${n}`]: e.target.value })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ToberasFields({ vals, onChange }) {
  const v = vals || {};
  return (
    <div style={{ background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 10, padding: 10, marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#C2410C", marginBottom: 8 }}>🚿 N° Toberas obstruidas</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {[["tela", "Regadera Tela"], ["pano_sup", "Regadera Paño sup."], ["pano_inf", "Regadera Paño inf."]].map(([key, label]) => (
          <div key={key}>
            <label style={S.fieldLabel}>{label}</label>
            <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="1" placeholder="0"
              value={v[key] || ""} onChange={e => onChange({ ...v, [key]: e.target.value })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PhLavadoFields({ vals, onChange }) {
  const v = vals || {};
  return (
    <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 10, padding: 10, marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", marginBottom: 8 }}>🧪 pH lavado — Tela y Paño</div>
      {[["tela", "Tela"], ["pano", "Paño"]].map(([prefix, lbl]) => (
        <div key={prefix} style={{ background: "#fff", borderRadius: 8, padding: 8, marginBottom: 6, border: "1px solid #BBF7D0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#15803D", marginBottom: 6 }}>{lbl}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div>
              <label style={S.fieldLabel}>pH lavado alcalino</label>
              <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" max="14" step="0.1" placeholder="0.0"
                value={v[`${prefix}_alc`] || ""} onChange={e => onChange({ ...v, [`${prefix}_alc`]: e.target.value })} />
            </div>
            <div>
              <label style={S.fieldLabel}>pH lavado ácido</label>
              <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" max="14" step="0.1" placeholder="0.0"
                value={v[`${prefix}_ac`] || ""} onChange={e => onChange({ ...v, [`${prefix}_ac`]: e.target.value })} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProbetaFields({ productos, vals, onChange }) {
  return (
    <div style={S.probetaBox}>
      <div style={S.probetaTitle}>🧪 Medición por probeta</div>
      {productos.map(prod => {
        const v = vals[prod] || { flujo_teo: "", flujo_real: "", unidad: "ml/min" };
        return (
          <div key={prod} style={S.prodRow}>
            <div style={S.prodName}>{prod}</div>
            <div style={S.inlineRow}>
              <div style={S.inlineField}><label style={S.fieldLabel}>Flujo teórico</label><input style={{ ...S.input, padding: "7px 8px", fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0" value={v.flujo_teo} onChange={e => onChange(prod, { ...v, flujo_teo: e.target.value })} /></div>
              <div style={S.inlineField}><label style={S.fieldLabel}>Flujo real</label><input style={{ ...S.input, padding: "7px 8px", fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0" value={v.flujo_real} onChange={e => onChange(prod, { ...v, flujo_real: e.target.value })} /></div>
              <div><label style={S.fieldLabel}>Unidad</label><select style={S.unitSel} value={v.unidad} onChange={e => onChange(prod, { ...v, unidad: e.target.value })}>{FLOW_UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TiempoFields({ productos, vals, onChange }) {
  return (
    <div style={S.tiempoBox}>
      <div style={S.tiempoTitle}>⏱ Tiempos de dosificación</div>
      {productos.map(prod => {
        const v = vals[prod] || { valor: "", unidad: "s" };
        return (
          <div key={prod} style={{ ...S.prodRow, border: "1px solid #BAE6FD", marginBottom: 6 }}>
            <div style={{ ...S.prodName, color: "#075985" }}>{prod}</div>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}><input style={{ ...S.input, padding: "7px 8px", fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0" value={v.valor} onChange={e => onChange(prod, { ...v, valor: e.target.value })} /></div>
              <div><select style={S.unitSel} value={v.unidad} onChange={e => onChange(prod, { ...v, unidad: e.target.value })}>{TIME_UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LavadosFields({ vals, onChange }) {
  const secciones = [{ key: "paño", label: "1 Paño" }, { key: "tela", label: "2 Tela" }];
  const empty = { n_lavados: "", flujo_alc: "", flujo_ac: "", t_alc: "", t_ac: "" };
  return (
    <div style={S.lavadosBox}>
      <div style={S.lavadosTitle}>🧺 Datos de lavado por vestimenta</div>
      {secciones.map(({ key, label }) => {
        const v = (vals || {})[key] || empty;
        return (
          <div key={key} style={S.lavadosSec}>
            <div style={S.lavadosSecTitle}>{label}</div>
            <div style={{ marginBottom: 6 }}><label style={S.fieldLabel}>N° Lavados</label><input style={{ ...S.input, fontSize: 13 }} type="number" min="0" placeholder="0" value={v.n_lavados} onChange={e => onChange(key, { ...v, n_lavados: e.target.value })} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <div><label style={S.fieldLabel}>Flujo Alcalino</label><input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0" value={v.flujo_alc} onChange={e => onChange(key, { ...v, flujo_alc: e.target.value })} /></div>
              <div><label style={S.fieldLabel}>Flujo Ácido</label><input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0" value={v.flujo_ac} onChange={e => onChange(key, { ...v, flujo_ac: e.target.value })} /></div>
              <div><label style={S.fieldLabel}>Tiempo Alcalino</label><input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0" value={v.t_alc} onChange={e => onChange(key, { ...v, t_alc: e.target.value })} /></div>
              <div><label style={S.fieldLabel}>Tiempo Ácido</label><input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0" value={v.t_ac} onChange={e => onChange(key, { ...v, t_ac: e.target.value })} /></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VaciosFields({ vals, onChange }) {
  const v = vals || { sifon1: "", sifon2: "", prensa: "" };
  return (
    <div style={S.vaciosBox}>
      <span style={S.vaciosNote}>⚠️ Valores deben ser obtenidos de terreno</span>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[["sifon1", "Vacío Sifón 1"], ["sifon2", "Vacío Sifón 2"], ["prensa", "Vacío Prensa"]].map(([k, lbl]) => (
          <div key={k}><label style={S.fieldLabel}>{lbl}</label><input style={{ ...S.input, fontSize: 13 }} type="number" step="0.01" placeholder="0.00" value={v[k]} onChange={e => onChange({ ...v, [k]: e.target.value })} /></div>
        ))}
      </div>
    </div>
  );
}

// ── SUBTASK ROW ───────────────────────────────────────────────────────────────
function SubtaskRow({ st, eqId, vals, onChange }) {
  const key = `${eqId}_${st.s}`;
  const v = vals[key] || {
    estado: "", obs: "",
    probeta: {}, tiempos: {}, vacios: {}, turbidez: "", niveles: {},
    fotos: {}, presionBombas: {}, frecuenciasVF: {}, indiceConcentracion: "",
    parametrosProceso: {}, toberas: {}, phLavado: {}, frecuenciasBomba: {},
  };
  return (
    <div style={S.stRow}>
      <div style={S.stDesc}>{st.desc}</div>
      <div style={S.stFreq}>
        <span>{st.f > 1 ? `🔁 ${st.f}x por turno` : "1x por turno"}</span>
        {st.soloAM          && <span style={S.chip("#FEF9C3", "#854D0E")}>☀️ Solo AM</span>}
        {st.fotos           && <span style={S.chip("#EEF2FF", "#3730A3")}>📷 Fotos</span>}
        {st.presionBombas   && <span style={S.chip("#FFF7ED", "#C2410C")}>🔧 Presión</span>}
        {st.frecuenciasVF   && <span style={S.chip("#F0F9FF", "#075985")}>⚡ Hz VF</span>}
        {st.indiceConcentracion && <span style={S.chip("#F0FDF4", "#166534")}>📏 Índice</span>}
        {st.probeta         && <span style={S.chip("#FEF3C7", "#92400E")}>🧪 Probeta</span>}
        {st.tiempos         && <span style={S.chip("#E0F2FE", "#075985")}>⏱ Tiempos</span>}
        {st.vacios          && <span style={S.chip("#FFEDD5", "#C2410C")}>📊 Vacíos</span>}
        {st.turbidez        && <span style={S.chip("#E0F2FE", "#0369A1")}>💧 Turbidez</span>}
        {st.niveles         && <span style={S.chip("#EDE9FE", "#5B21B6")}>📈 Niveles</span>}
        {st.parametrosProceso && <span style={S.chip("#F5F3FF", "#5B21B6")}>📊 Parámetros</span>}
        {st.toberas         && <span style={S.chip("#FFF7ED", "#C2410C")}>🚿 Toberas</span>}
        {st.phLavado        && <span style={S.chip("#F0FDF4", "#166534")}>🧪 pH</span>}
        {st.frecuenciasBomba && <span style={S.chip("#FFF1F2", "#BE123C")}>📊 Frecuencias</span>}
      </div>

      <div style={S.stateBar}>
        {STATE_LABELS.map(lbl => (
          <button key={lbl} style={S.stateBtn(v.estado === lbl, STATE_COLORS[lbl])}
            onClick={() => onChange(key, { ...v, estado: v.estado === lbl ? "" : lbl })}>
            {lbl === "Hecho" ? "✓" : lbl === "No OK" ? "✗" : lbl === "Pendiente" ? "⏳" : "—"} {lbl}
          </button>
        ))}
      </div>

      {st.fotos           && <PhotoFields vals={v.fotos} onChange={fv => onChange(key, { ...v, fotos: fv })} eqId={eqId} stS={st.s} />}
      {st.presionBombas   && <PresionBombasFields vals={v.presionBombas} onChange={pv => onChange(key, { ...v, presionBombas: pv })} />}
      {st.frecuenciasVF   && <FrecuenciasVFFields vals={v.frecuenciasVF} onChange={fv => onChange(key, { ...v, frecuenciasVF: fv })} />}
      {st.indiceConcentracion && (
        <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 10, padding: 10, marginBottom: 8 }}>
          <label style={{ ...S.fieldLabel, fontWeight: 700, color: "#166534" }}>📏 Índice de concentración (0–40)</label>
          <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" max="40" step="0.1" placeholder="0.0"
            value={v.indiceConcentracion || ""}
            onChange={e => onChange(key, { ...v, indiceConcentracion: e.target.value })} />
        </div>
      )}
      {st.probeta         && <ProbetaFields productos={st.productos} vals={v.probeta} onChange={(p, pv) => onChange(key, { ...v, probeta: { ...v.probeta, [p]: pv } })} />}
      {st.tiempos         && <TiempoFields productos={st.productos_tiempo} vals={v.tiempos} onChange={(p, tv) => onChange(key, { ...v, tiempos: { ...v.tiempos, [p]: tv } })} />}
      {st.vacios          && <VaciosFields vals={v.vacios} onChange={vv => onChange(key, { ...v, vacios: vv })} />}
      {st.turbidez && (
        <div style={S.turbidezBox}>
          <label style={{ ...S.fieldLabel, color: "#0369A1", fontWeight: 700 }}>💧 Valor de turbidez (NTU)</label>
          <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0"
            value={v.turbidez || ""} onChange={e => onChange(key, { ...v, turbidez: e.target.value })} />
        </div>
      )}
      {st.niveles && (
        <div style={S.nivelesBox}>
          <div style={S.nivelesTitle}>📈 Valores de operación</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div><label style={S.fieldLabel}>Nivel (0–100)</label><input style={{ ...S.input, fontSize: 13 }} type="number" min="0" max="100" step="0.1" placeholder="0.0" value={(v.niveles || {}).nivel || ""} onChange={e => onChange(key, { ...v, niveles: { ...(v.niveles || {}), nivel: e.target.value } })} /></div>
            <div><label style={S.fieldLabel}>Flujo de aire</label><input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0" value={(v.niveles || {}).flujo_aire || ""} onChange={e => onChange(key, { ...v, niveles: { ...(v.niveles || {}), flujo_aire: e.target.value } })} /></div>
            <div><label style={S.fieldLabel}>Flujo de entrada</label><input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0" value={(v.niveles || {}).flujo_entrada || ""} onChange={e => onChange(key, { ...v, niveles: { ...(v.niveles || {}), flujo_entrada: e.target.value } })} /></div>
          </div>
        </div>
      )}
      {st.parametrosProceso && <ParametrosProceso vals={v.parametrosProceso} onChange={pv => onChange(key, { ...v, parametrosProceso: pv })} />}
      {st.toberas         && <ToberasFields vals={v.toberas} onChange={tv => onChange(key, { ...v, toberas: tv })} />}
      {st.phLavado        && <PhLavadoFields vals={v.phLavado} onChange={phv => onChange(key, { ...v, phLavado: phv })} />}
      {st.frecuenciasBomba && <FrecuenciasBombaFields vals={v.frecuenciasBomba} onChange={fbv => onChange(key, { ...v, frecuenciasBomba: fbv })} />}

      <textarea style={S.textarea} placeholder="Observación (opcional)..." value={v.obs}
        onChange={e => onChange(key, { ...v, obs: e.target.value })} />
    </div>
  );
}

function EquipoBlock({ eq, vals, onChange, version, turno }) {
  const [open, setOpen] = useState(false);
  const visibleSt = eq.subtareas.filter(st => !st.soloAM || turno === "AM");
  const done = visibleSt.filter(st => (vals[`${eq.id}_${st.s}`] || {}).estado).length;
  const pct = visibleSt.length > 0 ? Math.round(done / visibleSt.length * 100) : 0;
  const lavKey = `${eq.id}_lavados`;
  return (
    <div style={{ borderBottom: "1px solid #F1F5F9" }}>
      <div style={S.equipoHdr} onClick={() => setOpen(o => !o)}>
        <div style={S.equipoNum}>{eq.n}</div>
        <div style={{ flex: 1 }}>
          <div style={S.equipoLabel}>{eq.label}</div>
          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{eq.accion} · {done}/{visibleSt.length} tareas{eq.epp ? ` · ${eq.epp.substring(0, 30)}${eq.epp.length > 30 ? "…" : ""}` : ""}</div>
          <div style={{ ...S.progBar(), marginTop: 4 }}><div style={S.progFill(pct)} /></div>
        </div>
        <span style={{ fontSize: 18, color: "#94A3B8", marginLeft: 6, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "block" }}>▾</span>
      </div>
      {open && (
        <div>
          {eq.consolidado && (
            <div style={{ background: "#EFF6FF", padding: "6px 14px", fontSize: 11, color: "#1D4ED8", borderBottom: "1px solid #DBEAFE" }}>
              📌 Sección incluye bombas de sala aditivos y sala azul
            </div>
          )}
          {visibleSt.map(st => <SubtaskRow key={st.s} st={st} eqId={eq.id} vals={vals} onChange={onChange} />)}
          {eq.lavadosFields && version === "lila1" && (
            <LavadosFields vals={vals[lavKey] || {}} onChange={(sec, v) => onChange(lavKey, { ...(vals[lavKey] || {}), [sec]: v })} />
          )}
        </div>
      )}
    </div>
  );
}

function SectorBlock({ sec, vals, onChange, version, turno }) {
  const [open, setOpen] = useState(true);
  const style = SECTOR_STYLES[sec.id];
  const allVis = sec.equipos.flatMap(e => e.subtareas.filter(st => !st.soloAM || turno === "AM"));
  const done = allVis.filter(st => {
    const eq = sec.equipos.find(e => e.subtareas.includes(st));
    return eq && (vals[`${eq.id}_${st.s}`] || {}).estado;
  }).length;
  return (
    <div style={S.card}>
      <div style={S.sectionHdr(style)} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 18 }}>{style.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={S.sectionHdrText(style)}>{sec.label}</div>
          <div style={{ fontSize: 10, color: style.text, opacity: 0.7 }}>{done}/{allVis.length} tareas completadas</div>
        </div>
        <span style={{ color: style.text, fontSize: 16, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "block" }}>▾</span>
      </div>
      {open && sec.equipos.map(eq => <EquipoBlock key={eq.id} eq={eq} vals={vals} onChange={onChange} version={version} turno={turno} />)}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function LilaApp() {
  const [usuario, setUsuario]       = useState(() => loadSession());
  const [usuarios, setUsuarios]     = useState([]);
  const [loadingU, setLoadingU]     = useState(true);
  const [loginError, setLoginError] = useState("");
  const [tab, setTab]               = useState("form");
  const [version, setVersion]       = useState("lila1");
  const [turno, setTurno]           = useState("AM");
  const [fecha, setFecha]           = useState(todayStr());
  const [obsGen, setObsGen]         = useState("");
  const [vals, setVals]             = useState({});
  const [registros, setRegistros]   = useState([]);
  const [toast, setToast]           = useState("");
  const [filTec, setFilTec]         = useState("");
  const [filTurno, setFilTurno]     = useState("");

  useEffect(() => {
    fetchUsuarios().then(u => {
      setUsuarios(u);
      if (u.length > 0) {
        const sess = loadSession();
        if (sess) {
          const actualizado = u.find(x => x.nombre === sess.nombre);
          if (actualizado) { saveSession(actualizado); setUsuario(actualizado); }
        }
      }
    }).finally(() => setLoadingU(false));
  }, []);

  useEffect(() => {
    window.storage?.get("lila_registros").then(r => {
      if (r?.value) { try { setRegistros(JSON.parse(r.value)); } catch {} }
    }).catch(() => {});
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const handleVal = useCallback((key, v) => setVals(prev => ({ ...prev, [key]: v })), []);

  const handleLogin = (nombre, pin) => {
    const user = usuarios.find(u => u.nombre === nombre && String(u.pin) === String(pin));
    if (user) { saveSession(user); setUsuario(user); setLoginError(""); }
    else { setLoginError("PIN incorrecto. Intenta de nuevo."); }
  };

  const handleLogout = () => {
    clearSession(); setUsuario(null); setVals({}); setObsGen(""); setTab("form"); setLoginError("");
  };

  if (!usuario && (loadingU || usuarios.length > 0)) {
    return <LoginScreen usuarios={usuarios} onLogin={handleLogin} error={loginError} loading={loadingU} />;
  }

  const filtrarPorPermiso = (secs) => {
    if (!usuario || usuario.admin) return secs;
    return secs.filter(sec => usuario.secciones?.[sec.id] === true);
  };

  const baseSectores = version === "lila2" ? getSectoresLila2() : SECTORES;
  const activeSectores = filtrarPorPermiso(baseSectores);

  const allSt = activeSectores.flatMap(s =>
    s.equipos.flatMap(e => e.subtareas.filter(st => !st.soloAM || turno === "AM").map(st => ({ eqId: e.id, st })))
  );
  const doneCount = allSt.filter(({ eqId, st }) => (vals[`${eqId}_${st.s}`] || {}).estado).length;
  const total = allSt.length;
  const pctGlobal = total > 0 ? Math.round(doneCount / total * 100) : 0;

  const guardar = () => {
    const tasks = [];
    activeSectores.forEach(sec => sec.equipos.forEach(eq => {
      eq.subtareas.filter(st => !st.soloAM || turno === "AM").forEach(st => {
        const v = vals[`${eq.id}_${st.s}`] || {};
        const fotosAnt  = (v.fotos?.anterior  || []).filter(Boolean);
        const fotosPost = (v.fotos?.posterior || []).filter(Boolean);
        tasks.push({
          sector: sec.label, equipo: eq.label, n_equipo: eq.n, subtarea: st.s, desc: st.desc,
          estado: v.estado || "Pendiente", obs: v.obs || "",
          probeta: v.probeta || {}, tiempos: v.tiempos || {}, vacios: v.vacios || {},
          turbidez: v.turbidez || "", niveles: v.niveles || {},
          fotos_anterior:      fotosAnt.length,
          fotos_posterior:     fotosPost.length,
          fotos_anterior_urls:  fotosAnt.map(p => p?.driveUrl).filter(Boolean),
          fotos_posterior_urls: fotosPost.map(p => p?.driveUrl).filter(Boolean),
          presionBombas: v.presionBombas || {},
          frecuenciasVF: v.frecuenciasVF || {},
          indiceConcentracion: v.indiceConcentracion || "",
          parametrosProceso: v.parametrosProceso || {},
          toberas: v.toberas || {},
          phLavado: v.phLavado || {},
          frecuenciasBomba: v.frecuenciasBomba || {},
        });
      });
    }));
    const reg = { id: Date.now(), ts: nowSantiago(), fecha, turno, tecnico: usuario?.nombre || "", version, obs_gen: obsGen, tasks };
    const newRegs = [reg, ...registros];
    setRegistros(newRegs);
    window.storage?.set("lila_registros", JSON.stringify(newRegs)).catch(() => {});
    sendToSheets(reg);
    setVals({}); setObsGen(""); setFecha(todayStr());
    showToast("✅ Registro guardado" + (APPS_SCRIPT_URL ? " · enviando a Sheets…" : ""));
    setTab("hist");
  };

  const exportCSV = () => {
    if (!registros.length) { showToast("Sin registros para exportar"); return; }
    const header = "Timestamp,Fecha,Turno,Version,Tecnico,Obs_General,Sector,Equipo,N_Equipo,Subtarea,Descripcion,Estado,Observacion_Tarea";
    const rows = registros.flatMap(r => r.tasks.map(t =>
      [r.ts, r.fecha, r.turno, r.version || "lila1", r.tecnico, r.obs_gen, t.sector, t.equipo, t.n_equipo, t.subtarea, t.desc, t.estado, t.obs]
        .map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(",")
    ));
    const csv = [header, ...rows].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8,﻿" + encodeURIComponent(csv);
    a.download = `LILA_Softys_${todayStr()}.csv`;
    a.click();
    showToast("📥 CSV exportado");
  };

  const filtered = registros.filter(r => (!filTec || r.tecnico === filTec) && (!filTurno || r.turno === filTurno));
  const allTasks = registros.flatMap(r => r.tasks);
  const stats = STATE_LABELS.reduce((acc, l) => { acc[l] = allTasks.filter(t => t.estado === l).length; return acc; }, {});
  const tecnicosList = usuarios.length > 0 ? usuarios.map(u => u.nombre) : [];

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={S.headerTitle}>
              LILA · Softys
              <span style={S.versionBadge(version)}>{version === "lila2" ? "LILA 2" : "Completa"}</span>
            </div>
            <div style={S.headerSub}>
              {usuario && <span>{usuario.nombre}{usuario.admin ? " ★" : ""} · </span>}
              {tab === "form" ? `${doneCount}/${total} tareas · ${pctGlobal}%` : tab === "dash" ? "Dashboard" : "Historial"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {tab === "form" && doneCount > 0 && <div style={{ fontSize: 22, fontWeight: 800, color: pctGlobal === 100 ? "#4ADE80" : "#60A5FA" }}>{pctGlobal}%</div>}
            <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#94A3B8", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8, cursor: "pointer" }}>Salir</button>
          </div>
        </div>
        {tab === "form" && (
          <div style={{ marginTop: 8, height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pctGlobal}%`, background: pctGlobal === 100 ? "#4ADE80" : "#60A5FA", borderRadius: 2, transition: "width 0.4s" }} />
          </div>
        )}
      </div>

      <div style={S.tabBar}>
        {[["form", "📋 Registro"], ["dash", "📊 Dashboard"], ["hist", "🕓 Historial"]].map(([v, l]) => (
          <button key={v} style={S.tab(tab === v)} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {/* ── FORMULARIO ── */}
      {tab === "form" && (
        <div style={S.page}>
          <div style={S.card}>
            <div style={S.cardPad}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Versión de ronda</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={S.versionBtn(version === "lila1")} onClick={() => setVersion("lila1")}>📋 LILA Completa</button>
                <button style={S.versionBtn(version === "lila2")} onClick={() => setVersion("lila2")}>⚡ LILA 2 · Turno rápido</button>
              </div>
              {version === "lila2" && <div style={{ fontSize: 11, color: "#92400E", background: "#FEF9C3", borderRadius: 8, padding: "6px 10px", marginTop: 8 }}>Selección explícita de equipos y subtareas</div>}
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardPad}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={S.fieldLabel}>Técnico</label>
                  <div style={{ ...S.input, background: "#F1F5F9", color: "#475569", display: "flex", alignItems: "center" }}>{usuario?.nombre}</div>
                </div>
                <div>
                  <label style={S.fieldLabel}>Turno *</label>
                  <select style={S.select} value={turno} onChange={e => setTurno(e.target.value)}>
                    <option value="AM">Turno AM</option>
                    <option value="PM">Turno PM</option>
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={S.fieldLabel}>Fecha</label>
                  <input style={S.input} type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
                </div>
              </div>
              {turno === "PM" && <div style={{ fontSize: 11, color: "#0369A1", background: "#E0F2FE", borderRadius: 8, padding: "6px 10px", marginTop: 10 }}>🌙 Turno PM: tareas "Solo AM" ocultas</div>}
            </div>
          </div>

          {activeSectores.length === 0 && (
            <div style={{ textAlign: "center", color: "#94A3B8", padding: "40px 0", fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
              Sin secciones asignadas a tu perfil
            </div>
          )}

          {activeSectores.map(sec => <SectorBlock key={sec.id} sec={sec} vals={vals} onChange={handleVal} version={version} turno={turno} />)}

          {activeSectores.length > 0 && (
            <>
              <div style={S.card}>
                <div style={S.cardPad}>
                  <label style={{ ...S.fieldLabel, fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 8, display: "block" }}>💬 Observación general del turno</label>
                  <textarea style={{ ...S.textarea, minHeight: 100 }} placeholder="Novedades del turno, incidentes, condiciones especiales…" value={obsGen} onChange={e => setObsGen(e.target.value)} />
                </div>
              </div>
              <button style={S.primaryBtn} onClick={guardar}>💾 Guardar registro LILA</button>
            </>
          )}
        </div>
      )}

      {/* ── DASHBOARD ── */}
      {tab === "dash" && (
        <div style={S.page}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={S.metricCard("#EFF6FF")}><div style={S.metricVal}>{registros.length}</div><div style={S.metricLbl}>Registros</div></div>
            <div style={S.metricCard("#F0FDF4")}><div style={{ ...S.metricVal, color: "#15803D" }}>{stats["Hecho"] || 0}</div><div style={S.metricLbl}>Hechos</div></div>
            <div style={S.metricCard("#FEF2F2")}><div style={{ ...S.metricVal, color: "#B91C1C" }}>{stats["No OK"] || 0}</div><div style={S.metricLbl}>No OK</div></div>
            <div style={S.metricCard("#FFFBEB")}><div style={{ ...S.metricVal, color: "#92400E" }}>{stats["Pendiente"] || 0}</div><div style={S.metricLbl}>Pendientes</div></div>
          </div>
          <div style={S.card}>
            <div style={{ ...S.cardPad, paddingBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 12 }}>Progreso por sector</div>
              {SECTORES.map(sec => {
                const secTasks = registros.flatMap(r => r.tasks.filter(t => t.sector === sec.label));
                const secDone = secTasks.filter(t => t.estado === "Hecho" || t.estado === "N/A").length;
                const pct = secTasks.length > 0 ? Math.round(secDone / secTasks.length * 100) : 0;
                const st = SECTOR_STYLES[sec.id];
                return (
                  <div key={sec.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "#334155", fontWeight: 500 }}>{st.icon} {sec.label}</span>
                      <span style={{ color: "#94A3B8" }}>{secDone}/{secTasks.length}</span>
                    </div>
                    <div style={S.progBar()}><div style={S.progFill(pct)} /></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={S.card}>
            <div style={S.cardPad}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 12 }}>Actividad reciente</div>
              {registros.slice(0, 5).map(r => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{r.turno === "AM" ? "🌅" : "🌙"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{r.tecnico}<span style={S.versionBadge(r.version || "lila1")}>{r.version === "lila2" ? "LILA 2" : "Completa"}</span></div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{fmtDate(r.fecha)} · Turno {r.turno}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{r.tasks.filter(t => t.estado === "Hecho").length}/{r.tasks.length}</div>
                </div>
              ))}
              {!registros.length && <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 13, padding: "16px 0" }}>Sin registros aún</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORIAL ── */}
      {tab === "hist" && (
        <div style={S.page}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <select style={{ ...S.select, flex: 1 }} value={filTec} onChange={e => setFilTec(e.target.value)}>
              <option value="">Todos los técnicos</option>
              {tecnicosList.map(t => <option key={t}>{t}</option>)}
            </select>
            <select style={{ ...S.select, width: 110 }} value={filTurno} onChange={e => setFilTurno(e.target.value)}>
              <option value="">Todos</option><option value="AM">AM</option><option value="PM">PM</option>
            </select>
            <button onClick={exportCSV} style={{ padding: "8px 12px", background: "#1A2744", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>📥 CSV</button>
          </div>
          {filtered.length === 0
            ? <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 14, padding: "40px 0" }}><div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>Sin registros aún</div>
            : filtered.map(r => {
              const ok = r.tasks.filter(t => t.estado === "Hecho").length;
              const nok = r.tasks.filter(t => t.estado === "No OK").length;
              const pend = r.tasks.filter(t => t.estado === "Pendiente").length;
              const pct = r.tasks.length > 0 ? Math.round(ok / r.tasks.length * 100) : 0;
              return (
                <div key={r.id} style={S.histCard}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: r.turno === "AM" ? "#FEF9C3" : "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{r.turno === "AM" ? "🌅" : "🌙"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{r.tecnico}<span style={S.versionBadge(r.version || "lila1")}>{r.version === "lila2" ? "LILA 2" : "Completa"}</span></div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? "#15803D" : "#3B82F6" }}>{pct}%</div>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}>{fmtDate(r.fecha)} · Turno {r.turno}</div>
                      <div style={{ ...S.progBar(), marginBottom: 6 }}><div style={S.progFill(pct)} /></div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        <span style={S.badge(STATE_COLORS["Hecho"])}>✓ {ok} hechos</span>
                        {nok > 0 && <span style={S.badge(STATE_COLORS["No OK"])}>✗ {nok} no ok</span>}
                        {pend > 0 && <span style={S.badge(STATE_COLORS["Pendiente"])}>⏳ {pend} pend.</span>}
                      </div>
                      {r.obs_gen && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>💬 {r.obs_gen}</div>}
                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      <div style={S.toast(!!toast)}>{toast}</div>
    </div>
  );
}
