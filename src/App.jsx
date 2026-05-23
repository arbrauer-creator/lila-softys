import { useState, useEffect, useCallback } from "react";

// ── DATA ──────────────────────────────────────────────────────────────────────

const TECNICOS = [
  "Bastián Erazo",
  "Cristián Álvarez",
  "Francisco Toro",
  "Jonathan Vargas",
  "Marco Chacón",
  "Rodrigo Peña",
];

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
  // ── 1. Sala Aditivos MP3 y Sala Azul ───────────────────────────────────────
  {
    id: "mp3",
    label: "Sala Aditivos MP3 y Sala Azul",
    equipos: [
      {
        n: 1, id: "ecowash", label: "Ecowash", accion: "I,L",
        epp: "Linterna, aire comprimido, línea de agua, careta, guantes de nitrilo",
        lavadosFields: true,
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar y limpiar zona de Ecowash: bombas, sector de tablero y sector de bomba de alta presión" },
          { s: 2, f: 1, desc: "Verificar lectura y registrar presión en manómetros de agua 1,2,3,4,N, manómetros de vapor 1 y 2 y temperatura de salida en termómetro" },
          {
            s: 3, f: 2,
            desc: "Inspeccionar bombas y líneas, verificar fugas, sonidos extraños y validar por probeta dosificación correcta durante un lavado (21:00 y 4:00)",
            probeta: true,
            productos: ["Lavador alcalino", "Lavador ácido"],
          },
          { s: 4, f: 1, desc: "Verificar correcta posición de válvulas de alimentación de bombas, vapor y agua" },
          { s: 5, f: 1, desc: "Validar en pantalla HDMI configuración de parámetros: Tiempo, frecuencia de lavados, flujos de bombas, Presión, Temperatura" },
          { s: 6, f: 1, desc: "Validar nivel en IBC de lavador alcalino, ácido y solvente (mín. 200L), verificar válvula abierta, sin fugas, marcar nivel actual" },
        ],
      },
      {
        n: 2, id: "polimero_mp3", label: "Preparador de polímero MP3", accion: "I,L",
        epp: "Linterna, aire comprimido, línea de agua",
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar y limpiar zona del preparador de polímero y bombas de tornillo del floculante a Floodaf y Saturno" },
          { s: 2, f: 2, desc: "Verificar lectura de frecuencia (Hz) de ambos VF, presión en manómetros de línea de dosificación y agua de arrastre (21:00 y 4:00)" },
          { s: 3, f: 1, desc: "Verificar stock de producto y cantidad de polímero en tolva (mínimo 50% de nivel)" },
          { s: 4, f: 1, desc: "Inspeccionar estado de motores agitadores, tornillo dosificador, ruidos extraños y temperatura de reductores y motores" },
          { s: 5, f: 1, desc: "Validar nivel del preparador de polímero: viscosidad correcta, sin presencia de grumos" },
        ],
      },
      {
        n: 3, id: "bombas_sala", label: "Bombas dosificadoras sala aditivo", accion: "I,L",
        epp: "Linterna, aire comprimido, línea de agua",
        consolidado: true,
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar y limpiar zona de bombas dosificadoras, validar que estén encendidas en modo correspondiente (continuo/batch)" },
          { s: 2, f: 1, desc: "Limpiar la carcasa y pantalla de cada una de las bombas" },
          { s: 3, f: 1, desc: "Inspeccionar cada bomba: funcionamiento, sonido, vibración, salida en tubing transparente, partida al 100% por 60 seg" },
          { s: 4, f: 1, desc: "Revisar válvula agua de arrastre y verificar presión (Ecopart al Tq Cabecero: 2 a 2,5 bar)" },
          {
            s: 5, f: 2,
            desc: "Verificar por probeta dosificación real (kg/t) vs setpoint de todas las bombas excepto Biocida (21:00 y 4:00)",
            probeta: true,
            productos: ["Ecopart Tq Cabecero", "Ecofix 507", "Ecofix 102 Floodaf", "Ecopart Floodaf"],
          },
          { s: 6, f: 1, desc: "Inspeccionar estado de IBCs: limpios, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥6 horas" },
          {
            s: 7, f: 1,
            desc: "Verificar y registrar flujo seteado, nivel de cada IBC, variación esperada y condición visual del producto",
            tiempos: true,
            productos_tiempo: ["Ecopart PU 40", "Ecopart PU 12", "Ecoenz C PU 40", "Ecoenz RF 200 PU 12", "Ecoenz RF 200 PU 40", "Eco PC 105 PU 12", "Eco PC 105 PU 40"],
          },
        ],
      },
    ],
  },

  // ── 2. MP3 ─────────────────────────────────────────────────────────────────
  {
    id: "mp3b",
    label: "MP3",
    equipos: [
      {
        n: 4, id: "regadera_tela", label: "Regadera móvil Tela", accion: "I,L",
        epp: "Linterna",
        subtareas: [
          { s: 1, f: 1, desc: "Verificar que el esprayado de la regadera sea adecuado" },
          { s: 2, f: 1, desc: "Asegurar que no existan sonidos extraños ni fugas en la regadera y líneas" },
          { s: 3, f: 4, desc: "Asegurar que el movimiento de la regadera es fluido y sin vibraciones anormales" },
          { s: 4, f: 4, desc: "Observar un recorrido completo de la regadera y validar que no pase por sobre los topes de la tela LM y LA" },
          { s: 5, f: 1, desc: "Verificar lectura de presión en manómetro de bomba (80 a 120 bar)" },
          { s: 6, f: 1, desc: "Inspeccionar y realizar aseo a bomba de alta presión" },
          { s: 7, f: 1, desc: "Revisar correcta selección de parámetros en pantalla HDMI" },
        ],
      },
      {
        n: 5, id: "acond_vest", label: "Acondicionamiento vestimentas", accion: "I",
        epp: "Linterna",
        subtareas: [
          { s: 1, f: 2, desc: "Inspeccionar regaderas de acondicionamiento de vestimentas tela (1) y paño (2): sprayeado correcto, cobertura adecuada en cada tobera (22:00 y 5:00)" },
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
          { s: 4, f: 1, desc: "Limpiar pretil de rack y de IBC, retirar objetos extraños (tapas, herramientas, amarras)" },
          { s: 5, f: 1, desc: "Inspeccionar estado de IBCs: limpios, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
          { s: 6, f: 1, desc: "Verificar y registrar nivel de cada IBC, variación esperada y condición visual del producto" },
          {
            s: 7, f: 2,
            desc: "Validar por probeta flujo real y comparar con pantalla y dosis específica por tonelada (21:00 y 4:00)",
            probeta: true,
            productos: ["Ecodisp 594 07TqP01", "Ecodisp 594 DNT", "Ecofix 102 07TqP04", "Ecofix 102 Saturno"],
          },
        ],
      },
    ],
  },

  // ── 3. Clarificadores ──────────────────────────────────────────────────────
  {
    id: "clar",
    label: "Clarificadores",
    equipos: [
      {
        n: 7, id: "filtro_grav", label: "Filtro gravitacional", accion: "I,L",
        epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Malla completa debe estar limpia y sin roturas" },
          { s: 2, f: 1, desc: "Limpiar malla filtro gravitacional", soloAM: true },
        ],
      },
      {
        n: 8, id: "floodaf", label: "Floodaf", accion: "I",
        epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Barredores operativos y en condición básica, limpiar paletas de barredor, superficie de salida de lodo y de agua clarificada", soloAM: true },
          { s: 2, f: 1, desc: "Inspeccionar correcta formación de floc en escotillas" },
          { s: 3, f: 1, desc: "Asegurar calidad de lodo, espesor del colchón, ausencia de espuma" },
          { s: 4, f: 1, desc: "Inspeccionar correcto funcionamiento de bombas de Airsolver y flujómetro de aire (debe estar entre 10 y 15 Nm³/h)" },
          { s: 5, f: 1, desc: "Inspeccionar calidad del agua clarificada: baja/nula presencia de fibra, medir turbidez (máx. 70, std < 50)", turbidez: true },
          { s: 6, f: 1, desc: "Revisar velocidad de barredores, altura del último barredor para asegurar remoción correcta del lodo" },
        ],
      },
      {
        n: 9, id: "saturno", label: "Saturno", accion: "I",
        epp: "",
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

  // ── 4. Sector MP2 y MP1 ────────────────────────────────────────────────────
  {
    id: "mp12",
    label: "Sector MP2 y MP1",
    equipos: [
      {
        n: 10, id: "bba_enzima", label: "BBA Enzima refinador sala aditivo MP2", accion: "I,L",
        epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Limpiar la carcasa y pantalla de la bomba" },
          { s: 2, f: 1, desc: "Limpiar pretil de tambor y rack, retirar objetos extraños (tapas, herramientas, amarras)" },
          { s: 3, f: 1, desc: "Validar que bomba se encuentre detenida y medir nivel del tambor, en caso de estar en servicio consultar el motivo a encargado MP02 e indicarlo en la observación" },
        ],
      },
      {
        n: 11, id: "prp1", label: "PRP1", accion: "I,L",
        epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" },
          { s: 2, f: 1, desc: "Limpiar la carcasa y pantalla de cada una de las bombas" },
          { s: 3, f: 1, desc: "Limpiar pretil de rack y de IBC, retirar objetos extraños" },
          { s: 4, f: 1, desc: "Inspeccionar cada bomba: funcionamiento, sonido y vibración" },
          {
            s: 5, f: 1,
            desc: "Verificar y registrar el tiempo de dosificación de cada bomba y el flujo",
            tiempos: true,
            productos_tiempo: [
              "Eco PC 105 PU1 MP1", "Eco PC 105 PU1 MP2", "Eco PC 105 PU2 Celulosa",
              "Eco Enz RF 200 PU 1 MP1", "Eco Enz RF 200 PU1 MP2", "Eco Enz RF 200 PU2 Celulosa", "Eco Enz RF 200 PU2 Reciclado",
            ],
          },
          {
            s: 6, f: 1,
            desc: "Validar por probeta flujo real de enzima de refinación y comparar con pantalla y dosis específica por tonelada",
            probeta: true,
            productos: ["Eco Enz RF 200 PU 1", "Eco Enz RF 200 PU 2"],
          },
          { s: 7, f: 1, desc: "Inspeccionar estado de IBCs: limpios, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
          { s: 8, f: 1, desc: "Verificar y registrar nivel de cada IBC y condición visual del producto" },
        ],
      },
      {
        n: 12, id: "ecosan431", label: "Ecosan 431 Tq 502", accion: "I,L",
        epp: "",
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

  // ── 5. Sector Efluente ─────────────────────────────────────────────────────
  {
    id: "eflu",
    label: "Sector Efluente",
    equipos: [
      {
        n: 13, id: "polimero_clar", label: "Preparador de polímero clarificación primaria", accion: "I,L",
        epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar y limpiar zona del preparador de polímero y bombas de tornillo del floculante a Floodaf y Saturno" },
          { s: 2, f: 1, desc: "Verificar lectura de frecuencia (Hz) de ambos VF, presión en manómetros de línea de dosificación y agua de arrastre" },
          { s: 3, f: 1, desc: "Verificar stock de producto y cantidad de polímero en tolva (mínimo 50% de nivel)" },
          { s: 4, f: 1, desc: "Inspeccionar estado de motores de cada etapa, tornillo dosificador, ruidos extraños y temperatura de reductores y motores" },
          { s: 5, f: 1, desc: "Validar nivel del preparador de polímero: viscosidad correcta, sin grumos en los compartimientos" },
        ],
      },
      {
        n: 14, id: "ecofix098", label: "Ecofix 098p Cuba", accion: "I,L",
        epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Revisar nivel de la cuba. Si está bajo 20%, llenar con agua y añadir un saco lentamente a la solución" },
          { s: 2, f: 1, desc: "Inspeccionar y limpiar zona, retirar cualquier objeto que no corresponda" },
        ],
      },
      {
        n: 15, id: "polimero_lodo", label: "Preparador de polímero desaguado de lodo", accion: "I,L",
        epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Verificar nivel de tolva de preparador de polímero" },
          { s: 2, f: 1, desc: "Verificar correcta preparación de floculante" },
          { s: 3, f: 1, desc: "Limpiar cascada de agua del preparador" },
          { s: 4, f: 1, desc: "Limpiar bomba y verificar flujo de esta" },
          { s: 5, f: 1, desc: "Verificar que las 3 cubas del preparador se encuentren al mismo nivel" },
        ],
      },
      {
        n: 16, id: "rack_coag", label: "Rack coagulante, Ecopart y Ecofix 098p", accion: "I,L",
        epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" },
          { s: 2, f: 1, desc: "Limpiar la carcasa y pantalla de cada una de las bombas" },
          { s: 3, f: 1, desc: "Limpiar pretil de rack y de IBC, retirar objetos extraños" },
          { s: 4, f: 1, desc: "Inspeccionar cada bomba: funcionamiento, sonido y vibración" },
          { s: 5, f: 1, desc: "Verificar y registrar el flujo en las bombas" },
          { s: 6, f: 1, desc: "Inspeccionar estado de IBCs: limpios, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
          { s: 7, f: 1, desc: "Verificar dosificación por probeta de Ecopart y Ecofix 102", probeta: true, productos: ["Ecopart", "Ecofix 102"] },
          { s: 8, f: 1, desc: "Verificar y registrar nivel de cada IBC y condición visual del producto" },
        ],
      },
      {
        n: 17, id: "rack_olor", label: "Rack control de olor", accion: "I,L",
        epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" },
          { s: 2, f: 1, desc: "Limpiar la carcasa y pantalla de cada una de las bombas" },
          { s: 3, f: 1, desc: "Inspeccionar cada bomba: funcionamiento, sonido y vibración" },
          { s: 4, f: 1, desc: "Verificar y registrar el flujo en las bombas" },
          { s: 5, f: 1, desc: "Inspeccionar estado de IBC: limpio, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
          { s: 6, f: 1, desc: "Verificar dosificación por probeta de cada bomba", probeta: true, productos: ["Bomba 1", "Bomba 2"] },
          { s: 7, f: 1, desc: "Verificar y registrar nivel del IBC y condición visual del producto" },
        ],
      },
      {
        n: 18, id: "rack_biocida", label: "Rack biocida filtros de arena", accion: "I,L",
        epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" },
          { s: 2, f: 1, desc: "Limpiar la carcasa y pantalla de cada una de las bombas" },
          { s: 3, f: 1, desc: "Inspeccionar cada bomba: funcionamiento, sonido y vibración" },
          { s: 4, f: 1, desc: "Inspeccionar estado de IBC: limpio, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
          { s: 5, f: 1, desc: "Verificar y registrar el flujo en las bombas" },
          { s: 6, f: 1, desc: "Verificar y registrar nivel del IBC y condición visual del producto" },
        ],
      },
      {
        n: 19, id: "rack_nutri", label: "Rack nutrientes bioreactor", accion: "I,L",
        epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" },
          { s: 2, f: 1, desc: "Limpiar la carcasa y pantalla de cada una de las bombas" },
          { s: 3, f: 1, desc: "Inspeccionar cada bomba: funcionamiento, sonido y vibración" },
          { s: 4, f: 1, desc: "Inspeccionar estado de IBC: limpio, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
          { s: 5, f: 1, desc: "Validar por probeta flujo real y comparar con pantalla y dosis específica por tonelada", probeta: true, productos: ["Nutriente 1", "Nutriente 2"] },
          { s: 6, f: 1, desc: "Verificar y registrar el flujo en las bombas" },
          { s: 7, f: 1, desc: "Verificar y registrar nivel del IBC y condición visual del producto" },
        ],
      },
      {
        n: 20, id: "rack_antiespuma", label: "Rack antiespumante y biocida", accion: "I,L",
        epp: "",
        subtareas: [
          { s: 1, f: 1, desc: "Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" },
          { s: 2, f: 1, desc: "Limpiar la carcasa y pantalla de cada una de las bombas" },
          { s: 3, f: 1, desc: "Inspeccionar cada bomba: funcionamiento, sonido y vibración" },
          { s: 4, f: 1, desc: "Inspeccionar estado de IBC: limpio, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
          { s: 5, f: 1, desc: "Verificar y registrar el flujo en las bombas" },
          { s: 6, f: 1, desc: "Verificar y registrar nivel del IBC y condición visual del producto" },
        ],
      },
    ],
  },
];

// ── LILA 2 — selección explícita de equipos y subtareas ──────────────────────
function getSectoresLila2() {
  // Qué incluir por id de equipo:
  //   allSubtareas: true  → todas las subtareas
  //   excludeS: [...]     → excluir subtareas por número s
  //   onlyS: [...]        → incluir solo esas subtareas
  //   noLavados: true     → ocultar sección Datos de lavado
  const CFG = {
    ecowash:       { allSubtareas: true, noLavados: true },          // T1 sin datos de lavado
    polimero_mp3:  { onlyS: [1, 2] },                                // T2 solo s:1 y s:2
    // T3 bombas_sala → NO incluir
    regadera_tela: { allSubtareas: true },                           // T4 completa
    acond_vest:    { allSubtareas: true, excludeS: [3] },            // T5 sin vacíos sifones
    // T6 disp_coag → NO incluir
    filtro_grav:   { allSubtareas: true },                           // T7 completa
    floodaf:       { allSubtareas: true },                           // T8 completa
    saturno:       { allSubtareas: true },                           // T9 completa
    // T10 bba_enzima → NO incluir
    prp1:          { onlyS: [4, 6] },                                // T11 solo s:4 y s:6
    // T12+ → NO incluir
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

async function sendToSheets(reg) {
  if (!APPS_SCRIPT_URL) return;
  try {
    await fetch(APPS_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(reg) });
  } catch (_) {}
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Santiago" });
}
function nowSantiago() {
  return new Date().toLocaleString("sv-SE", { timeZone: "America/Santiago" }).replace(" ", "T");
}
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
  tab: (active) => ({
    flex: 1, padding: "11px 4px", textAlign: "center", fontSize: 12, fontWeight: active ? 700 : 500,
    color: active ? "#1A2744" : "#94A3B8",
    borderBottom: active ? "2.5px solid #1A2744" : "2.5px solid transparent",
    cursor: "pointer", background: "none", border: "none", letterSpacing: 0.2,
  }),
  page: { padding: "12px 12px 80px" },
  card: { background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 12, overflow: "hidden" },
  cardPad: { padding: "14px 14px" },
  sectionHdr: (color) => ({
    padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
    background: color.bg, borderBottom: `1.5px solid ${color.border}`, cursor: "pointer",
  }),
  sectionHdrText: (color) => ({ fontSize: 13, fontWeight: 700, color: color.text, flex: 1 }),
  equipoHdr: { padding: "11px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", borderBottom: "1px solid #F1F5F9" },
  equipoNum: { width: 24, height: 24, borderRadius: 6, background: "#1A2744", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" },
  equipoLabel: { fontSize: 13, fontWeight: 600, color: "#1E293B", flex: 1, lineHeight: 1.3 },
  stRow: { borderBottom: "1px solid #F1F5F9", padding: "10px 14px" },
  stDesc: { fontSize: 13, color: "#334155", lineHeight: 1.5, marginBottom: 8 },
  stFreq: { fontSize: 11, color: "#94A3B8", marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" },
  stateBar: { display: "flex", gap: 6, marginBottom: 8 },
  stateBtn: (active, color) => ({
    flex: 1, padding: "7px 4px", borderRadius: 8, fontSize: 12, fontWeight: 600,
    border: `1.5px solid ${active ? color.border : "#E2E8F0"}`,
    background: active ? color.bg : "#F8FAFC",
    color: active ? color.text : "#94A3B8",
    cursor: "pointer",
  }),
  fieldLabel: { fontSize: 11, color: "#64748B", marginBottom: 4, display: "block", fontWeight: 500 },
  input: { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "8px 10px", fontSize: 14, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit", boxSizing: "border-box" },
  select: { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "8px 10px", fontSize: 14, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit" },
  textarea: { width: "100%", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "8px 10px", fontSize: 13, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit", resize: "vertical", minHeight: 56, boxSizing: "border-box" },
  // Probeta
  probetaBox: { background: "#FFFBEB", border: "1.5px solid #FCD34D", borderRadius: 10, padding: 10, marginBottom: 8 },
  probetaTitle: { fontSize: 11, fontWeight: 700, color: "#92400E", marginBottom: 8 },
  prodRow: { background: "#fff", borderRadius: 8, padding: "8px 10px", marginBottom: 6, border: "1px solid #FEF3C7" },
  prodName: { fontSize: 12, fontWeight: 600, color: "#78350F", marginBottom: 6 },
  inlineRow: { display: "flex", gap: 6 },
  inlineField: { flex: 1 },
  unitSel: { width: 80, border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "7px 6px", fontSize: 13, background: "#F8FAFC", color: "#1E293B", fontFamily: "inherit" },
  // Tiempos
  tiempoBox: { background: "#F0F9FF", border: "1.5px solid #7DD3FC", borderRadius: 10, padding: 10, marginBottom: 8 },
  tiempoTitle: { fontSize: 11, fontWeight: 700, color: "#075985", marginBottom: 8 },
  // Lavados Paño/Tela
  lavadosBox: { background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 10, padding: 12, margin: "0 14px 12px" },
  lavadosTitle: { fontSize: 11, fontWeight: 700, color: "#166534", marginBottom: 10 },
  lavadosSec: { background: "#fff", borderRadius: 8, padding: 10, marginBottom: 8, border: "1px solid #D1FAE5" },
  lavadosSecTitle: { fontSize: 12, fontWeight: 700, color: "#15803D", marginBottom: 8 },
  // Vacíos
  vaciosBox: { background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 10, padding: 10, marginBottom: 8 },
  vaciosNote: { fontSize: 11, fontWeight: 700, color: "#C2410C", background: "#FFEDD5", borderRadius: 6, padding: "5px 10px", marginBottom: 10, display: "block" },
  // Turbidez
  turbidezBox: { background: "#F0F9FF", border: "1.5px solid #BAE6FD", borderRadius: 8, padding: "8px 10px", marginBottom: 8 },
  // Niveles (Saturno)
  nivelesBox: { background: "#F5F3FF", border: "1.5px solid #C4B5FD", borderRadius: 10, padding: 10, marginBottom: 8 },
  nivelesTitle: { fontSize: 11, fontWeight: 700, color: "#5B21B6", marginBottom: 8 },
  // Progress
  progBar: () => ({ height: 4, borderRadius: 2, background: "#E2E8F0", overflow: "hidden" }),
  progFill: (pct) => ({ height: "100%", width: `${pct}%`, background: pct === 100 ? "#22C55E" : "#3B82F6", borderRadius: 2, transition: "width 0.3s" }),
  badge: (color) => ({ display: "inline-block", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: color.bg, color: color.text }),
  primaryBtn: { width: "100%", padding: "14px", borderRadius: 12, background: "#1A2744", color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", letterSpacing: 0.2 },
  // Version selector
  versionBtn: (active) => ({
    flex: 1, padding: "11px 8px", borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: "center",
    border: `2px solid ${active ? "#1A2744" : "#E2E8F0"}`,
    background: active ? "#1A2744" : "#F8FAFC",
    color: active ? "#fff" : "#94A3B8",
    cursor: "pointer",
  }),
  versionBadge: (v) => ({
    display: "inline-block", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
    background: v === "lila2" ? "#FEF3C7" : "#EFF6FF",
    color: v === "lila2" ? "#92400E" : "#1D4ED8",
    marginLeft: 6,
  }),
  metricCard: (color) => ({ background: color, borderRadius: 12, padding: "14px 12px", textAlign: "center" }),
  metricVal: { fontSize: 28, fontWeight: 800, color: "#1E293B" },
  metricLbl: { fontSize: 11, color: "#64748B", marginTop: 2 },
  toast: (show) => ({
    position: "fixed", bottom: 20, left: "50%", transform: `translateX(-50%) translateY(${show ? 0 : 80}px)`,
    background: "#1A2744", color: "#fff", padding: "10px 20px", borderRadius: 20, fontSize: 13, fontWeight: 600,
    zIndex: 999, transition: "transform 0.3s", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
  }),
  histCard: { background: "#fff", borderRadius: 12, padding: "12px 14px", marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  chip: (bg, color) => ({ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: bg, color }),
};

const STATE_COLORS = {
  "Hecho":     { bg: "#DCFCE7", border: "#4ADE80", text: "#15803D" },
  "No OK":     { bg: "#FEE2E2", border: "#F87171", text: "#B91C1C" },
  "Pendiente": { bg: "#FEF9C3", border: "#FBBF24", text: "#92400E" },
  "N/A":       { bg: "#F1F5F9", border: "#CBD5E1", text: "#64748B" },
};
const STATE_LABELS = ["Hecho", "No OK", "Pendiente", "N/A"];

// ── COMPONENTS ────────────────────────────────────────────────────────────────

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
              <div style={S.inlineField}>
                <label style={S.fieldLabel}>Flujo teórico</label>
                <input style={{ ...S.input, padding: "7px 8px", fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0"
                  value={v.flujo_teo} onChange={e => onChange(prod, { ...v, flujo_teo: e.target.value })} />
              </div>
              <div style={S.inlineField}>
                <label style={S.fieldLabel}>Flujo real</label>
                <input style={{ ...S.input, padding: "7px 8px", fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0"
                  value={v.flujo_real} onChange={e => onChange(prod, { ...v, flujo_real: e.target.value })} />
              </div>
              <div>
                <label style={S.fieldLabel}>Unidad</label>
                <select style={S.unitSel} value={v.unidad} onChange={e => onChange(prod, { ...v, unidad: e.target.value })}>
                  {FLOW_UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
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
              <div style={{ flex: 1 }}>
                <input style={{ ...S.input, padding: "7px 8px", fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0"
                  value={v.valor} onChange={e => onChange(prod, { ...v, valor: e.target.value })} />
              </div>
              <div>
                <select style={S.unitSel} value={v.unidad} onChange={e => onChange(prod, { ...v, unidad: e.target.value })}>
                  {TIME_UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
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
            <div style={{ marginBottom: 6 }}>
              <label style={S.fieldLabel}>N° Lavados</label>
              <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" placeholder="0"
                value={v.n_lavados} onChange={e => onChange(key, { ...v, n_lavados: e.target.value })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <div>
                <label style={S.fieldLabel}>Flujo Alcalino</label>
                <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0"
                  value={v.flujo_alc} onChange={e => onChange(key, { ...v, flujo_alc: e.target.value })} />
              </div>
              <div>
                <label style={S.fieldLabel}>Flujo Ácido</label>
                <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0"
                  value={v.flujo_ac} onChange={e => onChange(key, { ...v, flujo_ac: e.target.value })} />
              </div>
              <div>
                <label style={S.fieldLabel}>Tiempo Alcalino</label>
                <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0"
                  value={v.t_alc} onChange={e => onChange(key, { ...v, t_alc: e.target.value })} />
              </div>
              <div>
                <label style={S.fieldLabel}>Tiempo Ácido</label>
                <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0"
                  value={v.t_ac} onChange={e => onChange(key, { ...v, t_ac: e.target.value })} />
              </div>
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
          <div key={k}>
            <label style={S.fieldLabel}>{lbl}</label>
            <input style={{ ...S.input, fontSize: 13 }} type="number" step="0.01" placeholder="0.00"
              value={v[k]} onChange={e => onChange({ ...v, [k]: e.target.value })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SubtaskRow({ st, eqId, vals, onChange }) {
  const key = `${eqId}_${st.s}`;
  const v = vals[key] || { estado: "", obs: "", probeta: {}, tiempos: {}, vacios: {}, turbidez: "", niveles: {} };

  return (
    <div style={S.stRow}>
      <div style={S.stDesc}>{st.desc}</div>
      <div style={S.stFreq}>
        <span>{st.f > 1 ? `🔁 ${st.f}x por turno` : "1x por turno"}</span>
        {st.soloAM   && <span style={S.chip("#FEF9C3", "#854D0E")}>☀️ Solo AM</span>}
        {st.probeta  && <span style={S.chip("#FEF3C7", "#92400E")}>🧪 Probeta</span>}
        {st.tiempos  && <span style={S.chip("#E0F2FE", "#075985")}>⏱ Tiempos</span>}
        {st.vacios   && <span style={S.chip("#FFEDD5", "#C2410C")}>📊 Vacíos</span>}
        {st.turbidez && <span style={S.chip("#E0F2FE", "#0369A1")}>💧 Turbidez</span>}
        {st.niveles  && <span style={S.chip("#EDE9FE", "#5B21B6")}>📈 Niveles</span>}
      </div>

      <div style={S.stateBar}>
        {STATE_LABELS.map(lbl => (
          <button key={lbl} style={S.stateBtn(v.estado === lbl, STATE_COLORS[lbl])}
            onClick={() => onChange(key, { ...v, estado: v.estado === lbl ? "" : lbl })}>
            {lbl === "Hecho" ? "✓" : lbl === "No OK" ? "✗" : lbl === "Pendiente" ? "⏳" : "—"} {lbl}
          </button>
        ))}
      </div>

      {st.probeta && (
        <ProbetaFields productos={st.productos} vals={v.probeta}
          onChange={(prod, pv) => onChange(key, { ...v, probeta: { ...v.probeta, [prod]: pv } })} />
      )}
      {st.tiempos && (
        <TiempoFields productos={st.productos_tiempo} vals={v.tiempos}
          onChange={(prod, tv) => onChange(key, { ...v, tiempos: { ...v.tiempos, [prod]: tv } })} />
      )}
      {st.vacios && (
        <VaciosFields vals={v.vacios}
          onChange={(vv) => onChange(key, { ...v, vacios: vv })} />
      )}

      {/* Turbidez */}
      {st.turbidez && (
        <div style={S.turbidezBox}>
          <label style={{ ...S.fieldLabel, color: "#0369A1", fontWeight: 700 }}>💧 Valor de turbidez (NTU)</label>
          <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0"
            value={v.turbidez || ""}
            onChange={e => onChange(key, { ...v, turbidez: e.target.value })} />
        </div>
      )}

      {/* Niveles — Saturno s:5 */}
      {st.niveles && (
        <div style={S.nivelesBox}>
          <div style={S.nivelesTitle}>📈 Valores de operación</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div>
              <label style={S.fieldLabel}>Nivel (0–100)</label>
              <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" max="100" step="0.1" placeholder="0.0"
                value={(v.niveles || {}).nivel || ""}
                onChange={e => onChange(key, { ...v, niveles: { ...(v.niveles || {}), nivel: e.target.value } })} />
            </div>
            <div>
              <label style={S.fieldLabel}>Flujo de aire</label>
              <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0"
                value={(v.niveles || {}).flujo_aire || ""}
                onChange={e => onChange(key, { ...v, niveles: { ...(v.niveles || {}), flujo_aire: e.target.value } })} />
            </div>
            <div>
              <label style={S.fieldLabel}>Flujo de entrada</label>
              <input style={{ ...S.input, fontSize: 13 }} type="number" min="0" step="0.1" placeholder="0.0"
                value={(v.niveles || {}).flujo_entrada || ""}
                onChange={e => onChange(key, { ...v, niveles: { ...(v.niveles || {}), flujo_entrada: e.target.value } })} />
            </div>
          </div>
        </div>
      )}

      <textarea style={S.textarea} placeholder="Observación (opcional)..."
        value={v.obs} onChange={e => onChange(key, { ...v, obs: e.target.value })} />
    </div>
  );
}

function EquipoBlock({ eq, vals, onChange, version, turno }) {
  const [open, setOpen] = useState(false);
  // Filtrar tareas soloAM cuando el turno es PM
  const visibleSubtareas = eq.subtareas.filter(st => !st.soloAM || turno === "AM");
  const total = visibleSubtareas.length;
  const done = visibleSubtareas.filter(st => (vals[`${eq.id}_${st.s}`] || {}).estado).length;
  const pct = total > 0 ? Math.round(done / total * 100) : 0;
  const lavadosKey = `${eq.id}_lavados`;

  return (
    <div style={{ borderBottom: "1px solid #F1F5F9" }}>
      <div style={S.equipoHdr} onClick={() => setOpen(o => !o)}>
        <div style={S.equipoNum}>{eq.n}</div>
        <div style={{ flex: 1 }}>
          <div style={S.equipoLabel}>{eq.label}</div>
          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
            {eq.accion} · {done}/{total} tareas
            {eq.epp && <span> · {eq.epp.substring(0, 30)}{eq.epp.length > 30 ? "…" : ""}</span>}
          </div>
          <div style={{ ...S.progBar(), marginTop: 4 }}>
            <div style={S.progFill(pct)} />
          </div>
        </div>
        <span style={{ fontSize: 18, color: "#94A3B8", marginLeft: 6, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "block" }}>▾</span>
      </div>

      {open && (
        <div>
          {eq.consolidado && (
            <div style={{ background: "#EFF6FF", padding: "6px 14px", fontSize: 11, color: "#1D4ED8", borderBottom: "1px solid #DBEAFE" }}>
              📌 Sección consolidada: incluye Sala azul Eco PC 105 + Costado cadena PRP3
            </div>
          )}
          {visibleSubtareas.map(st => (
            <SubtaskRow key={st.s} st={st} eqId={eq.id} vals={vals} onChange={onChange} />
          ))}
          {eq.lavadosFields && version === "lila1" && (
            <LavadosFields
              vals={vals[lavadosKey] || {}}
              onChange={(sec, v) => onChange(lavadosKey, { ...(vals[lavadosKey] || {}), [sec]: v })}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SectorBlock({ sec, vals, onChange, version, turno }) {
  const [open, setOpen] = useState(true);
  const style = SECTOR_STYLES[sec.id];
  const allVisible = sec.equipos.flatMap(e => e.subtareas.filter(st => !st.soloAM || turno === "AM"));
  const done = allVisible.filter(st => {
    const eq = sec.equipos.find(e => e.subtareas.includes(st));
    return eq && (vals[`${eq.id}_${st.s}`] || {}).estado;
  }).length;

  return (
    <div style={S.card}>
      <div style={S.sectionHdr(style)} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 18 }}>{style.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={S.sectionHdrText(style)}>{sec.label}</div>
          <div style={{ fontSize: 10, color: style.text, opacity: 0.7 }}>{done}/{allVisible.length} tareas completadas</div>
        </div>
        <span style={{ color: style.text, fontSize: 16, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "block" }}>▾</span>
      </div>
      {open && sec.equipos.map(eq => (
        <EquipoBlock key={eq.id} eq={eq} vals={vals} onChange={onChange} version={version} turno={turno} />
      ))}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────

export default function LilaApp() {
  const [tab, setTab]           = useState("form");
  const [version, setVersion]   = useState("lila1");
  const [tecnico, setTecnico]   = useState("");
  const [turno, setTurno]       = useState("AM");
  const [fecha, setFecha]       = useState(todayStr());
  const [obsGen, setObsGen]     = useState("");
  const [vals, setVals]         = useState({});
  const [registros, setRegistros] = useState([]);
  const [toast, setToast]       = useState("");
  const [filTec, setFilTec]     = useState("");
  const [filTurno, setFilTurno] = useState("");

  useEffect(() => {
    window.storage?.get("lila_registros").then(r => {
      if (r?.value) { try { setRegistros(JSON.parse(r.value)); } catch {} }
    }).catch(() => {});
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const handleVal = useCallback((key, v) => setVals(prev => ({ ...prev, [key]: v })), []);

  const activeSectores = version === "lila2" ? getSectoresLila2() : SECTORES;

  // Progreso considerando filtro soloAM
  const allSt = activeSectores.flatMap(s =>
    s.equipos.flatMap(e =>
      e.subtareas
        .filter(st => !st.soloAM || turno === "AM")
        .map(st => ({ eqId: e.id, st }))
    )
  );
  const doneCount = allSt.filter(({ eqId, st }) => (vals[`${eqId}_${st.s}`] || {}).estado).length;
  const total = allSt.length;
  const pctGlobal = total > 0 ? Math.round(doneCount / total * 100) : 0;

  const guardar = () => {
    if (!tecnico) { showToast("⚠️ Selecciona el técnico"); return; }
    const tasks = [];
    activeSectores.forEach(sec => sec.equipos.forEach(eq => {
      eq.subtareas
        .filter(st => !st.soloAM || turno === "AM")
        .forEach(st => {
          const v = vals[`${eq.id}_${st.s}`] || {};
          tasks.push({
            sector: sec.label, equipo: eq.label, n_equipo: eq.n,
            subtarea: st.s, desc: st.desc, estado: v.estado || "Pendiente",
            obs: v.obs || "", probeta: v.probeta || {}, tiempos: v.tiempos || {},
            vacios: v.vacios || {}, turbidez: v.turbidez || "", niveles: v.niveles || {},
          });
        });
    }));
    const reg = { id: Date.now(), ts: nowSantiago(), fecha, turno, tecnico, version, obs_gen: obsGen, tasks };
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
      [r.ts, r.fecha, r.turno, r.version || "lila1", r.tecnico, r.obs_gen,
       t.sector, t.equipo, t.n_equipo, t.subtarea, t.desc, t.estado, t.obs]
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

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={S.headerTitle}>
              LILA · Softys Talagante
              <span style={S.versionBadge(version)}>{version === "lila2" ? "LILA 2" : "Completa"}</span>
            </div>
            <div style={S.headerSub}>
              {tab === "form" ? `${doneCount}/${total} tareas · ${pctGlobal}%` : tab === "dash" ? "Dashboard de turno" : "Historial de registros"}
            </div>
          </div>
          {tab === "form" && doneCount > 0 && (
            <div style={{ fontSize: 22, fontWeight: 800, color: pctGlobal === 100 ? "#4ADE80" : "#60A5FA" }}>{pctGlobal}%</div>
          )}
        </div>
        {tab === "form" && (
          <div style={{ marginTop: 8, height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pctGlobal}%`, background: pctGlobal === 100 ? "#4ADE80" : "#60A5FA", borderRadius: 2, transition: "width 0.4s" }} />
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={S.tabBar}>
        {[["form", "📋 Registro"], ["dash", "📊 Dashboard"], ["hist", "🕓 Historial"]].map(([v, l]) => (
          <button key={v} style={S.tab(tab === v)} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>

      {/* ── FORMULARIO ── */}
      {tab === "form" && (
        <div style={S.page}>
          {/* Selector versión */}
          <div style={S.card}>
            <div style={S.cardPad}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Versión de ronda</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={S.versionBtn(version === "lila1")} onClick={() => setVersion("lila1")}>📋 LILA Completa</button>
                <button style={S.versionBtn(version === "lila2")} onClick={() => setVersion("lila2")}>⚡ LILA 2 · Turno rápido</button>
              </div>
              {version === "lila2" && (
                <div style={{ fontSize: 11, color: "#92400E", background: "#FEF9C3", borderRadius: 8, padding: "6px 10px", marginTop: 8 }}>
                  Equipos 3 y 10 completos + subtareas de 2x por turno
                </div>
              )}
            </div>
          </div>

          {/* Datos del turno */}
          <div style={S.card}>
            <div style={S.cardPad}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={S.fieldLabel}>Técnico *</label>
                  <select style={S.select} value={tecnico} onChange={e => setTecnico(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {TECNICOS.map(t => <option key={t}>{t}</option>)}
                  </select>
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
              {turno === "PM" && (
                <div style={{ fontSize: 11, color: "#0369A1", background: "#E0F2FE", borderRadius: 8, padding: "6px 10px", marginTop: 10 }}>
                  🌙 Turno PM: se ocultan las tareas marcadas como "Solo AM"
                </div>
              )}
            </div>
          </div>

          {/* Sectores */}
          {activeSectores.map(sec => (
            <SectorBlock key={sec.id} sec={sec} vals={vals} onChange={handleVal} version={version} turno={turno} />
          ))}

          {/* Observación general al final */}
          <div style={S.card}>
            <div style={S.cardPad}>
              <label style={{ ...S.fieldLabel, fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 8, display: "block" }}>
                💬 Observación general del turno
              </label>
              <textarea style={{ ...S.textarea, minHeight: 100 }}
                placeholder="Novedades del turno, incidentes, condiciones especiales, anomalías relevantes..."
                value={obsGen} onChange={e => setObsGen(e.target.value)} />
            </div>
          </div>

          <button style={S.primaryBtn} onClick={guardar}>💾 Guardar registro LILA</button>
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
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {r.turno === "AM" ? "🌅" : "🌙"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>
                      {r.tecnico}
                      <span style={S.versionBadge(r.version || "lila1")}>{r.version === "lila2" ? "LILA 2" : "Completa"}</span>
                    </div>
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
              {TECNICOS.map(t => <option key={t}>{t}</option>)}
            </select>
            <select style={{ ...S.select, width: 110 }} value={filTurno} onChange={e => setFilTurno(e.target.value)}>
              <option value="">Todos</option>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
            <button onClick={exportCSV} style={{ padding: "8px 12px", background: "#1A2744", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              📥 CSV
            </button>
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 14, padding: "40px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>Sin registros aún
            </div>
          ) : filtered.map(r => {
            const ok = r.tasks.filter(t => t.estado === "Hecho").length;
            const nok = r.tasks.filter(t => t.estado === "No OK").length;
            const pend = r.tasks.filter(t => t.estado === "Pendiente").length;
            const pct = r.tasks.length > 0 ? Math.round(ok / r.tasks.length * 100) : 0;
            return (
              <div key={r.id} style={S.histCard}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: r.turno === "AM" ? "#FEF9C3" : "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {r.turno === "AM" ? "🌅" : "🌙"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>
                        {r.tecnico}
                        <span style={S.versionBadge(r.version || "lila1")}>{r.version === "lila2" ? "LILA 2" : "Completa"}</span>
                      </div>
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
          })}
        </div>
      )}

      <div style={S.toast(!!toast)}>{toast}</div>
    </div>
  );
}
