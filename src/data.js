// ── PRODUCTOS NIVELES ─────────────────────────────────────────────────────────
// Orden exacto = orden de columnas en hoja BBDD MP03 · Niveles (gid=1163712205)
export const PRODUCTOS_NIVELES = [
  { id:"p01", label:"Lavador alcalino CONN 5132 ES",     zona:"Sala Aditivos",   unit:"cm"   },
  { id:"p02", label:"Lavador ácido CONN 5074 ET",         zona:"Sala Aditivos",   unit:"cm"   },
  { id:"p03", label:"Pasivante CONN 1050 AP",            zona:"Sala Aditivos",   unit:"cm"   },
  { id:"p04", label:"Detacktificante CONN 1012 CT",      zona:"Sala Aditivos",   unit:"cm"   },
  { id:"p05", label:"Dispersante CONN 5518 MA CT",       zona:"Sala Aditivos",   unit:"cm"   },
  { id:"p06", label:"Ecopart-T PRP",                     zona:"PRP",             unit:"cm"   },
  { id:"p07", label:"Ecopart-T Máquina",                 zona:"Sala Aditivos",   unit:"cm"   },
  { id:"p08", label:"Ecoenz-C sala aditivo",             zona:"Sala Aditivos",   unit:"cm"   },
  { id:"p09", label:"Ecoenz-C PRP",                      zona:"PRP",             unit:"cm"   },
  { id:"p10", label:"Ecofor 751",                        zona:"Sala Aditivos",   unit:"cm"   },
  { id:"p11", label:"EcoSolv sala aditivo arriba",       zona:"Sala Aditivos",   unit:"cm"   },
  { id:"p12", label:"EcoSolv sala aditivo abajo",        zona:"Sala Aditivos",   unit:"cm"   },
  { id:"p13", label:"Ecoenz REF 200 PRP",                zona:"PRP",             unit:"cm"   },
  { id:"p14", label:"Ecoenz REF 200 Máquina",            zona:"Máquina",         unit:"cm"   },
  { id:"p15", label:"Microbiocida 431",                  zona:"PRP",             unit:"cm"   },
  { id:"p16", label:"Ecofor 771",                        zona:"Sala Aditivos",   unit:"cm"   },
  { id:"p17", label:"Coagulante EcoFix 102",             zona:"Sala Aditivos",   unit:"cm"   },
  { id:"p18", label:"Floculante EcoFix 108",             zona:"Sala Aditivos",   unit:"sacos"},
  { id:"p19", label:"ECO PC 105",                        zona:"PRP",             unit:"cm"   },
  { id:"p20", label:"Ecofor 752",                        zona:"Sala Aditivos",   unit:"cm"   },
  { id:"p21", label:"EcoFix 507",                        zona:"Sala Aditivos",   unit:"cm"   },
  { id:"p22", label:"Coagulante EcoFix 102 Dispersión", zona:"Dispersión",      unit:"cm"   },
  { id:"p23", label:"Dispersante Eco Disp 594",          zona:"Dispersión",      unit:"cm"   },
  { id:"p24", label:"Microbiocida Ecosan 403",           zona:"Sala Aditivos",   unit:"cm"   },
  { id:"p25", label:"EcoenzB sala aditivos",             zona:"Sala Aditivos",   unit:"cm"   },
  { id:"p26", label:"Coagulante Glue Pulp",              zona:"Eco Fibra",           unit:"cm"   },
  { id:"p27", label:"Dispersante Glue Pulp",             zona:"Eco Fibra",           unit:"cm"   },
];

export const ZONAS_NIVELES = [
  { id:"Sala Aditivos",  bg:"#E8F5E9", border:"#4CAF50", text:"#1B5E20", icon:"🧪" },
  { id:"PRP",            bg:"#E0F2F7", border:"#0097A7", text:"#006064", icon:"🔬" },
  { id:"Máquina",    bg:"#E3F2FD", border:"#2196F3", text:"#0D47A1", icon:"⚙️" },
  { id:"Dispersión", bg:"#F3E5F5", border:"#9C27B0", text:"#4A148C", icon:"🔀" },
  { id:"Eco Fibra",          bg:"#FFFDE7", border:"#FFC107", text:"#795548", icon:"📦" },
];

// ── DOSIFICACIONES ────────────────────────────────────────────────────────────
export const TIPOS_DOSIS    = ["Continuo", "Batch", "Ciclos por tiempo"];

/**
 * Deriva el Tipo de dosificación automáticamente según reglas de negocio:
 * 1. Punto PU 12 o PU 40 → "Batch"
 * 2. Producto contiene "ecosan" (sin distinguir mayúsculas) → "Ciclos por tiempo"
 * 3. Resto → "Continuo"
 */
export function getTipo(producto, punto) {
  if (punto === "PU 12" || punto === "PU 40") return "Batch";
  if (String(producto || "").toLowerCase().includes("ecosan")) return "Ciclos por tiempo";
  return "Continuo";
}
export const USOS_DOSIS     = ["Acondicionador","Dispersante","Detacktificante","Biocida","Refinación","Coagulante","Floculante","Antiespumante","pH Control","Otro"];
export const PUNTOS_DOSIS   = ["Tela","07TqP01","07TqP04","DNT","PU 12","PU 40","Silo","Tq Cabecero","Canoa Silo","Floodaf","Saturno","Tq Mezcla","Tq P04","TQ07BB06","Fan pump","Agua clarificada","Entrada clarificador","Succión fanpump","Agua bajo tela","Otro"];

// ── COMBINACIONES PRODUCTO+PUNTO (desde hoja Dosificaciones BBDD MP03) ────────
// Fuente: gid=727307735 — se usan como referencia fija en CenterlineAdmin
export const COMBOS_DOSIS = [
  { producto: "Pasivante_1050",       punto: "Tela"                },
  { producto: "Dispersante_5518",     punto: "07TqP01"             },
  { producto: "Dispersante_5518",     punto: "DNT"                 },
  { producto: "Ecopart_T",            punto: "PU 12"               },
  { producto: "Ecopart_T",            punto: "PU 40"               },
  { producto: "Ecopart_T",            punto: "Tq Cabecero"         },
  { producto: "Ecopart_T",            punto: "Floodaf"             },
  { producto: "Ecopart_T",            punto: "Saturno"             },
  { producto: "Ecoenz_REF_200",       punto: "PU 12"               },
  { producto: "Ecoenz_REF_200",       punto: "PU 40"               },
  { producto: "Ecoenz_C",             punto: "PU 12"               },
  { producto: "Ecoenz_C",             punto: "Silo"                },
  { producto: "Ecoenz_C",             punto: "Agua clarificada"    },
  { producto: "Detacktificante_1012", punto: "Tq Cabecero"         },
  { producto: "Ecosan_431",           punto: "Canoa Silo"          },
  { producto: "Ecosan_431",           punto: "Entrada clarificador"},
  { producto: "Ecosan_431",           punto: "Succión fanpump"     },
  { producto: "Ecosan_431",           punto: "Agua bajo tela"      },
  { producto: "Ecofix_102",           punto: "Floodaf"             },
  { producto: "Ecofix_102",           punto: "Saturno"             },
  { producto: "Ecofix_102",           punto: "Tq P04"              },
  { producto: "Ecofix_102",           punto: "TQ07BB06"            },
  { producto: "Ecofix_108",           punto: "Floodaf"             },
  { producto: "Ecofix_108",           punto: "Saturno"             },
  { producto: "Eco_PC_105",           punto: "PU 12"               },
  { producto: "Eco_PC_105",           punto: "PU 40"               },
  { producto: "Ecofor_751",           punto: "Tq Mezcla"           },
  { producto: "Ecofor_752",           punto: "Tq Mezcla"           },
  { producto: "Ecofix_507",           punto: "Fan pump"            },
];
export const PRODUCTOS_DOSIS = [
  "Pasivante_1050","Dispersante_5518","Ecopart_T","Ecoenz_REF_200","Ecoenz_C",
  "Detacktificante_1012","Ecosan_431","Ecofor751","Ecofor752","Ecofor771",
  "EcoSolv","EcoFix_102","EcoFix_507","EcoFix_108","ECO_PC105",
  "EcoDisp_594","Ecosan_403","EcoenzB","Coag_GluePulp","Disp_GluePulp",
];

// ── SECTORES LILA ─────────────────────────────────────────────────────────────
export const FLOW_UNITS = ["ml/min","ml/h","l/min","l/h"];
export const TIME_UNITS = ["s","min"];

export const SECTORES = [
  {
    id:"mp3", label:"Sala Aditivos MP3 y Sala Azul",
    equipos:[
      {
        n:1, id:"ecowash", label:"Ecowash", accion:"I,L",
        epp:"Linterna, aire comprimido, línea de agua, careta, guantes de nitrilo",
        lavadosFields:true,
        subtareas:[
          { s:1, f:1, desc:"Inspeccionar y limpiar zona de Ecowash: bombas, sector de tablero y sector de bomba de alta presión", fotos:true },
          { s:2, f:1, desc:"Verificar lectura y registrar presión en manómetros de agua 1,2,3,4,N, manómetros de vapor 1 y 2 y temperatura de salida en termómetro" },
          { s:3, f:2, desc:"Inspeccionar bombas y líneas, verificar fugas, sonidos extraños y validar por probeta dosificación correcta durante un lavado (21:00 y 4:00)", probeta:true, productos:["Lavador alcalino","Lavador ácido"] },
          { s:4, f:1, desc:"Verificar correcta posición de válvulas de alimentación de bombas, vapor y agua" },
          { s:7, f:1, desc:"Verificar posición de válvulas en la llegada de las regaderas" },
          { s:5, f:1, desc:"Validar en pantalla HDMI configuración de parámetros: Tiempo, frecuencia de lavados, flujos de bombas, Presión, Temperatura" },
          { s:6, f:1, desc:"Validar nivel en IBC de lavador alcalino, ácido y solvente (mín. 200L), verificar válvula abierta, sin fugas, marcar nivel actual" },
        ],
      },
      {
        n:2, id:"polimero_mp3", label:"Preparador de polímero MP3", accion:"I,L",
        epp:"Linterna, aire comprimido, línea de agua",
        subtareas:[
          { s:1, f:1, desc:"Inspeccionar y limpiar zona del preparador de polímero y bombas de tornillo del floculante a Floodaf y Saturno registrar presión de maómetro de cada bomba", fotos:true, presionBombas:true },
          { s:2, f:2, desc:"Verificar lectura de frecuencia (Hz) de ambos VF, presión en manómetros de línea de dosificación y agua de arrastre (21:00 y 4:00)", frecuenciasVF:true },
          { s:6, f:1, desc:"Verificar índice de concentración del preparador de polímero", indiceConcentracion:true },
          { s:3, f:1, desc:"Verificar stock de producto y cantidad de polímero en tolva (mínimo 50% de nivel)" },
          { s:4, f:1, desc:"Inspeccionar estado de motores agitadores, tornillo dosificador, ruidos extraños y temperatura de reductores y motores" },
          { s:5, f:1, desc:"Validar nivel del preparador de polímero: viscosidad correcta, sin presencia de grumos" },
        ],
      },
      {
        n:3, id:"bombas_sala", label:"Bombas dosificadoras sala aditivo", accion:"I,L",
        epp:"Linterna, aire comprimido, línea de agua", consolidado:true,
        subtareas:[
          { s:1, f:1, desc:"Inspeccionar y limpiar zona de bombas dosificadoras, validar que estén encendidas en modo correspondiente (continuo/batch)", fotos:true },
          { s:2, f:1, desc:"Limpiar la carcasa y pantalla de cada una de las bombas" },
          { s:3, f:1, desc:"Inspeccionar cada bomba: funcionamiento, sonido, vibración, salida en tubing transparente, partida al 100% por 60 seg" },
          { s:4, f:1, desc:"Revisar válvula agua de arrastre y verificar presión (Ecopart al Tq Cabecero: 2 a 2,5 bar)" },
          { s:5, f:2, desc:"Verificar por probeta dosificación real (kg/t) vs setpoint de todas las bombas excepto Biocida (21:00 y 4:00)", probeta:true, productos:["Ecopart Tq Cabecero","Ecofix 507","Ecofix 102 Floodaf","Ecopart Floodaf"] },
          { s:6, f:1, desc:"Inspeccionar estado de IBCs: limpios, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥6 horas" },
          { s:7, f:1, desc:"Verificar y registrar flujo seteado, nivel de cada IBC, variación esperada y condición visual del producto", tiempos:true, productos_tiempo:["Ecopart PU 40","Ecopart PU 12","Ecoenz C PU 40","Ecoenz RF 200 PU 12","Ecoenz RF 200 PU 40","Eco PC 105 PU 12","Eco PC 105 PU 40"] },
          { s:8, f:1, desc:"Validar correcta llegada de químico al PU 12 y PU 40" },
          { s:9, f:1, desc:"Medir pH de PU 12 y PU 40", soloAM:true },
        ],
      },
    ],
  },
  {
    id:"mp3b", label:"MP3",
    equipos:[
      {
        n:4, id:"regadera_tela", label:"Regadera móvil Tela", accion:"I,L", epp:"Linterna",
        subtareas:[
          { s:1, f:1, desc:"Verificar que el esprayado de la regadera sea adecuado" },
          { s:2, f:1, desc:"Asegurar que no existan sonidos extraños ni fugas en la regadera y líneas" },
          { s:3, f:4, desc:"Asegurar que el movimiento de la regadera es fluido y sin vibraciones anormales" },
          { s:4, f:4, desc:"Observar un recorrido completo de la regadera y validar que no pase por sobre los dopes de la tela LM y LA" },
          { s:5, f:1, desc:"Verificar lectura de presión en manómetro de bomba (80 a 200 bar)" },
          { s:6, f:1, desc:"Inspeccionar y realizar aseo a bomba de alta presión" },
          { s:7, f:1, desc:"Revisar correcta selección de parámetros en pantalla HDMI" },
        ],
      },
      {
        n:5, id:"acond_vest", label:"Acondicionamiento vestimentas", accion:"I", epp:"Linterna",
        subtareas:[
          { s:1, f:2, desc:"Inspeccionar regaderas de acondicionamiento de vestimentas tela (1) y paño (2): sprayeado correcto, cobertura adecuada en cada tobera (22:00 y 5:00)", toberas:true },
          { s:4, f:1, desc:"Inspeccionar correcto estado de manguera/flexible entrada a las cuatro regaderas" },
          { s:5, f:1, desc:"Medir y registrar pH de lavado ácido y alcalino en la regadera de Tela y Paño", phLavado:true },
          { s:2, f:2, desc:"Inspeccionar correcto funcionamiento de RAP Tela y Paño: oscilación, flujo laminar del chorro aguja y registrar presión de trabajo" },
          { s:3, f:1, desc:"Registrar valores de vacío en vacuómetros de los sifones y de la prensa", vacios:true },
        ],
      },
      {
        n:6, id:"disp_coag", label:"Dispersante y coagulante zona Dispersión", accion:"I,L",
        epp:"Linterna, aire comprimido, línea de agua",
        subtareas:[
          { s:1, f:1, desc:"Inspeccionar y limpiar zona de bombas dosificadoras, validar encendidas si hay reciclado, detenidas en caso contrario" },
          { s:2, f:1, desc:"Limpiar la carcasa y pantalla de cada una de las bombas" },
          { s:3, f:1, desc:"Inspeccionar cada bomba: funcionamiento, sonido, vibración, salida en tubing transparente, partida al 100% por 60 seg" },
          { s:4, f:1, desc:"Limpiar pretil de rack y de IBC, retirar objetos extraños (tapas, herramientas, amarras)", fotos:true },
          { s:5, f:1, desc:"Inspeccionar estado de IBCs: limpios, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
          { s:6, f:1, desc:"Verificar y registrar nivel de cada IBC, variación esperada y condición visual del producto" },
          { s:7, f:2, desc:"Validar por probeta flujo real y comparar con pantalla y dosis específica por tonelada (21:00 y 4:00)", probeta:true, productos:["Ecodisp 594 07TqP01","Ecodisp 594 DNT","Ecofix 102 07TqP04","Ecofix 102 Saturno"] },
        ],
      },
    ],
  },
  {
    id:"clar", label:"Clarificadores",
    equipos:[
      {
        n:7, id:"filtro_grav", label:"Filtro gravitacional", accion:"I,L", epp:"",
        subtareas:[
          { s:1, f:1, desc:"Malla completa debe estar limpia y sin roturas" },
          { s:2, f:1, desc:"Limpiar malla filtro gravitacional", soloAM:true },
        ],
      },
      {
        n:8, id:"floodaf", label:"Floodaf", accion:"I", epp:"",
        subtareas:[
          { s:1, f:1, desc:"Barredores operativos y en condición básica, limpiar paletas de barredor, superficie de salida de lodo y de agua clarificada", soloAM:true, fotos:true },
          { s:2, f:1, desc:"Inspeccionar correcta formación de floc en escotillas" },
          { s:3, f:1, desc:"Asegurar calidad de lodo, espesor del colchón, ausencia de espuma" },
          { s:4, f:1, desc:"Inspeccionar correcto funcionamiento de bombas de Airsolver y flujómetro de aire (debe estar entre 10 y 15 Nm³/h)" },
          { s:5, f:1, desc:"Inspeccionar calidad del agua clarificada: baja/nula presencia de fibra, medir turbidez (máx. 70, std < 50)", turbidez:true },
          { s:6, f:1, desc:"Revisar velocidad de barredores, altura del último barredor para asegurar remoción correcta del lodo" },
          { s:7, f:1, desc:"Registrar parámetros de proceso", parametrosProceso:true },
        ],
      },
      {
        n:9, id:"saturno", label:"Saturno", accion:"I", epp:"",
        subtareas:[
          { s:1, f:1, desc:"Inspeccionar correcta formación de floc" },
          { s:2, f:1, desc:"Asegurar calidad de lodo, espesor del colchón, ausencia de espuma" },
          { s:3, f:1, desc:"Inspeccionar calidad del agua clarificada: turbidez (máx. 200, std < 100)", turbidez:true },
          { s:4, f:1, desc:"Verificar rango de operación de UDS" },
          { s:5, f:1, desc:"Revisar flujo de aire, nivel del clarificador y flujo de entrada", niveles:true },
          { s:6, f:1, desc:"Validar correcta llegada de floculante y coagulante" },
        ],
      },
    ],
  },
  {
    id:"mp12", label:"Sector MP2 y MP1",
    equipos:[
      {
        n:10, id:"bba_enzima", label:"BBA Enzima refinador sala aditivo MP2", accion:"I,L", epp:"",
        subtareas:[
          { s:1, f:1, desc:"Limpiar la carcasa y pantalla de la bomba" },
          { s:2, f:1, desc:"Limpiar pretil de tambor y rack, retirar objetos extraños (tapas, herramientas, amarras)" },
          { s:3, f:1, desc:"Validar que bomba se encuentre detenida y medir nivel del tambor, en caso de estar en servicio consultar el motivo a encargado MP02 e indicarlo en la observación" },
          { s:4, f:1, desc:"Verificar llegada de químico y medir flujo por probeta" },
        ],
      },
      {
        n:11, id:"prp1", label:"PRP1", accion:"I,L", epp:"",
        subtareas:[
          { s:1, f:1, desc:"Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan", fotos:true },
          { s:2, f:1, desc:"Limpiar la carcasa y pantalla de cada una de las bombas" },
          { s:3, f:1, desc:"Limpiar pretil de rack y de IBC, retirar objetos extraños" },
          { s:4, f:1, desc:"Inspeccionar cada bomba: funcionamiento, sonido y vibración" },
          { s:5, f:1, desc:"Verificar y registrar el tiempo de dosificación de cada bomba y el flujo", tiempos:true, productos_tiempo:["Eco PC 105 PU1 MP1","Eco PC 105 PU1 MP2","Eco PC 105 PU2 Celulosa","Eco Enz RF 200 PU 1 MP1","Eco Enz RF 200 PU1 MP2","Eco Enz RF 200 PU2 Celulosa","Eco Enz RF 200 PU2 Reciclado"] },
          { s:6, f:1, desc:"Validar por probeta flujo real de enzima de refinación y comparar con pantalla y dosis específica por tonelada", probeta:true, productos:["Eco Enz RF 200 PU 1","Eco Enz RF 200 PU 2"] },
          { s:7, f:1, desc:"Inspeccionar estado de IBCs: limpios, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
          { s:8, f:1, desc:"Verificar y registrar nivel de cada IBC y condición visual del producto" },
        ],
      },
      {
        n:12, id:"ecosan431", label:"Ecosan 431 Tq 502", accion:"I,L", epp:"",
        subtareas:[
          { s:1, f:1, desc:"Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" },
          { s:2, f:1, desc:"Limpiar la carcasa y pantalla de la bomba" },
          { s:3, f:1, desc:"Verificar y registrar tiempo de dosificación de la bomba y su flujo" },
          { s:4, f:1, desc:"Inspeccionar estado de IBC: limpio, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
          { s:5, f:1, desc:"Verificar y registrar nivel del IBC y condición visual del producto" },
        ],
      },
    ],
  },
  {
    id:"eflu", label:"Sector Efluente",
    equipos:[
      { n:13, id:"polimero_clar", label:"Preparador de polímero clarificación primaria", accion:"I,L", epp:"", subtareas:[
        { s:1, f:1, desc:"Inspeccionar y limpiar zona del preparador de polímero y bombas de tornillo del floculante a parshall" },
        { s:2, f:1, desc:"Verificar lectura de frecuencia (Hz) de ambos VF, presión en manómetros de línea de dosificación y agua de arrastre", frecuenciasBomba:true },
        { s:3, f:1, desc:"Verificar stock de producto y cantidad de polímero en tolva (mínimo 50% de nivel)" },
        { s:4, f:1, desc:"Inspeccionar estado de motores de cada etapa, tornillo dosificador, ruidos extraños y temperatura de reductores y motores" },
        { s:5, f:1, desc:"Validar nivel del preparador de polímero: viscosidad correcta, sin grumos en los compartimientos" },
      ]},
      { n:14, id:"ecofix098", label:"Ecofix 098p Cuba", accion:"I,L", epp:"", subtareas:[
        { s:1, f:1, desc:"Revisar nivel de la cuba. Si está bajo 20%, llenar con agua y añadir un saco lentamente a la solución" },
        { s:2, f:1, desc:"Inspeccionar y limpiar zona, retirar cualquier objeto que no corresponda" },
      ]},
      { n:15, id:"polimero_lodo", label:"Preparador de polímero desaguado de lodo", accion:"I,L", epp:"", subtareas:[
        { s:1, f:1, desc:"Verificar nivel de tolva de preparador de polímero" },
        { s:2, f:1, desc:"Verificar correcta preparación de floculante" },
        { s:3, f:1, desc:"Limpiar cascada de agua del preparador" },
        { s:4, f:1, desc:"Limpiar bomba y verificar flujo de esta" },
        { s:5, f:1, desc:"Verificar que las 3 cubas del preparador se encuentren al mismo nivel" },
      ]},
      { n:16, id:"rack_coag", label:"Rack coagulante, Ecopart y Ecofix 098p", accion:"I,L", epp:"", subtareas:[
        { s:1, f:1, desc:"Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" },
        { s:2, f:1, desc:"Limpiar la carcasa y pantalla de cada una de las bombas" },
        { s:3, f:1, desc:"Limpiar pretil de rack y de IBC, retirar objetos extraños" },
        { s:4, f:1, desc:"Inspeccionar cada bomba: funcionamiento, sonido y vibración" },
        { s:5, f:1, desc:"Verificar y registrar el flujo en las bombas" },
        { s:6, f:1, desc:"Inspeccionar estado de IBCs: limpios, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
        { s:7, f:1, desc:"Verificar dosificación por probeta de Ecopart y Ecofix 102", probeta:true, productos:["Ecopart","Ecofix 102"] },
        { s:8, f:1, desc:"Verificar y registrar nivel de cada IBC y condición visual del producto" },
      ]},
      { n:17, id:"rack_olor", label:"Rack control de olor", accion:"I,L", epp:"", subtareas:[
        { s:1, f:1, desc:"Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" },
        { s:2, f:1, desc:"Limpiar la carcasa y pantalla de cada una de las bombas" },
        { s:3, f:1, desc:"Inspeccionar cada bomba: funcionamiento, sonido y vibración" },
        { s:4, f:1, desc:"Verificar y registrar el flujo en las bombas" },
        { s:5, f:1, desc:"Inspeccionar estado de IBC: limpio, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
        { s:6, f:1, desc:"Verificar dosificación por probeta de cada bomba", probeta:true, productos:["Bomba 1","Bomba 2"] },
        { s:7, f:1, desc:"Verificar y registrar nivel del IBC y condición visual del producto" },
      ]},
      { n:18, id:"rack_biocida", label:"Rack biocida filtros de arena", accion:"I,L", epp:"", subtareas:[
        { s:1, f:1, desc:"Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" },
        { s:2, f:1, desc:"Limpiar la carcasa y pantalla de cada una de las bombas" },
        { s:3, f:1, desc:"Inspeccionar cada bomba: funcionamiento, sonido y vibración" },
        { s:4, f:1, desc:"Inspeccionar estado de IBC: limpio, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
        { s:5, f:1, desc:"Verificar y registrar el flujo en las bombas" },
        { s:6, f:1, desc:"Verificar y registrar nivel del IBC y condición visual del producto" },
      ]},
      { n:19, id:"rack_nutri", label:"Rack nutrientes bioreactor", accion:"I,L", epp:"", subtareas:[
        { s:1, f:1, desc:"Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" },
        { s:2, f:1, desc:"Limpiar la carcasa y pantalla de cada una de las bombas" },
        { s:3, f:1, desc:"Inspeccionar cada bomba: funcionamiento, sonido y vibración" },
        { s:4, f:1, desc:"Inspeccionar estado de IBC: limpio, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
        { s:5, f:1, desc:"Validar por probeta flujo real y comparar con pantalla y dosis específica por tonelada", probeta:true, productos:["Nutriente 1","Nutriente 2"] },
        { s:6, f:1, desc:"Verificar y registrar el flujo en las bombas" },
        { s:7, f:1, desc:"Verificar y registrar nivel del IBC y condición visual del producto" },
      ]},
      { n:20, id:"rack_antiespuma", label:"Rack antiespumante y biocida", accion:"I,L", epp:"", subtareas:[
        { s:1, f:1, desc:"Inspeccionar y limpiar zona de bombas dosificadoras, retirar objetos que no correspondan" },
        { s:2, f:1, desc:"Limpiar la carcasa y pantalla de cada una de las bombas" },
        { s:3, f:1, desc:"Inspeccionar cada bomba: funcionamiento, sonido y vibración" },
        { s:4, f:1, desc:"Inspeccionar estado de IBC: limpio, mangueras en buen estado, válvulas abiertas, sin fuga, nivel ≥12 horas" },
        { s:5, f:1, desc:"Verificar y registrar el flujo en las bombas" },
        { s:6, f:1, desc:"Verificar y registrar nivel del IBC y condición visual del producto" },
      ]},
    ],
  },
];

export function getSectoresLila2() {
  const CFG = {
    ecowash:       { allSubtareas:true, noLavados:true },
    polimero_mp3:  { onlyS:[1,2] },
    regadera_tela: { allSubtareas:true },
    acond_vest:    { allSubtareas:true, excludeS:[3] },
    filtro_grav:   { allSubtareas:true },
    floodaf:       { allSubtareas:true },
    saturno:       { allSubtareas:true },
    prp1:          { onlyS:[4,6] },
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
