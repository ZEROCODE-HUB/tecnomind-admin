import { create } from "zustand";

// ─────────────────────────────────────────────────────────────
// Tipos compartidos del backoffice
// ─────────────────────────────────────────────────────────────

export type EstadoVerificacion = "Pendiente" | "En revisión" | "Aprobada" | "Rechazada";
export type EstadoCumplimiento = "Pendiente" | "En revisión" | "Pasa" | "No pasa";
export type EstadoPago = "Pendiente" | "En proceso" | "Aprobado" | "Rechazado";
export type EstadoOtc = "Pendiente" | "En revisión" | "Aprobada" | "Rechazada";
export type EstadoCuenta = "Pendiente de habilitación" | "Activa" | "Bloqueada";
export type EstadoValidacionComprobante = "Pendiente" | "Validado" | "Rechazado";

export type ProductoCliente = {
  tipo: string;
  referencia: string;
  estado: "Activo" | "Pendiente" | "Bloqueado";
};

export type Cliente = {
  id: string;
  nombre: string;
  tipoDocumento: string;
  documento: string;
  email: string;
  telefono: string;
  ciudad: string;
  fechaRegistro: string;
  estadoVerificacion: EstadoVerificacion;
  scoreTruora: number | null;
  estadoCumplimiento: EstadoCumplimiento;
  estadoCuenta: EstadoCuenta;
  productos: ProductoCliente[];
  observaciones: string;
};

export type RevisionIdentidad = {
  clienteId: string;
  fecha: string;
  proveedor: "Truora";
  estado: EstadoVerificacion;
  score: number;
  matchBiometrico: number;
  liveness: "Aprobado" | "Fallido" | "Revisión manual";
  validacionDocumento: "Consistente" | "Inconsistente" | "Revisión manual" | "No evaluado";
  tipoDocumento: string;
  numeroDocumento: string;
  flags: string[];
  observaciones: string;
};

export type ListaRestrictiva =
  | "OFAC (SDN)"
  | "Consejo de Seguridad ONU"
  | "Unión Europea"
  | "Unidad de Información (Colombia)"
  | "PEP / Funcionario público";

export type ResultadoListaCliente = {
  lista: ListaRestrictiva;
  resultado: "Sin coincidencia" | "Coincidencia" | "En revisión";
  detalle: string;
  fecha: string;
};

export type CumplimientoListas = {
  clienteId: string;
  estadoCumplimiento: EstadoCumplimiento;
  resultados: ResultadoListaCliente[];
  observaciones: string;
};

export type SolicitudPago = {
  id: string;
  clienteNombre: string;
  beneficiario: string;
  bancoBeneficiario: string;
  cuentaBeneficiario: string;
  bancoOrigen: string;
  monto: number;
  moneda: "USD" | "COP";
  concepto: string;
  factura: string;
  estado: EstadoPago;
  motivoEstado: string;
  comprobanteId: string | null;
  fecha: string;
};

export type Comprobante = {
  id: string;
  solicitudId: string | null;
  nombreArchivo: string;
  referencia: string;
  fechaCarga: string;
  validado: EstadoValidacionComprobante;
};

export type TipoOperacionOtc = "Compra USDT" | "Venta USDT";

export type OperacionOtc = {
  id: string;
  clienteNombre: string;
  tipo: TipoOperacionOtc;
  montoUSDT: number;
  montoCOP: number;
  tasaAplicada: number | null;
  montoFinalCOP: number | null;
  montoFinalUSDT: number | null;
  estado: EstadoOtc;
  motivoEstado: string;
  fecha: string;
};

// ─────────────────────────────────────────────────────────────
// Helpers de presentación
// ─────────────────────────────────────────────────────────────

export const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(v);

export const formatUSDT = (v: number) => `USDT ${v.toLocaleString("es-CO")}`;

export const formatTasa = (v: number) => `$ ${v.toLocaleString("es-CO")}`;

export function tonePorEstado(estado: string): "neutral" | "success" | "warn" | "danger" {
  if (/aprobad|pasa|activa|validado|activ$/i.test(estado)) return "success";
  if (/rechaz|no pasa|bloque|fallid|inconsist/i.test(estado)) return "danger";
  if (/pendiente/i.test(estado)) return "warn";
  return "neutral";
}

export const ESTADOS_VERIFICACION: EstadoVerificacion[] = [
  "Pendiente",
  "En revisión",
  "Aprobada",
  "Rechazada",
];
export const ESTADOS_CUMPLIMIENTO: EstadoCumplimiento[] = [
  "Pendiente",
  "En revisión",
  "Pasa",
  "No pasa",
];
export const ESTADOS_PAGO: EstadoPago[] = ["Pendiente", "En proceso", "Aprobado", "Rechazado"];
export const ESTADOS_OTC: EstadoOtc[] = ["Pendiente", "En revisión", "Aprobada", "Rechazada"];

// ─────────────────────────────────────────────────────────────
// Datos de demostración
// ─────────────────────────────────────────────────────────────

const clientesIniciales: Cliente[] = [
  {
    id: "CLI-0001",
    nombre: "Laura Gómez Restrepo",
    tipoDocumento: "CC",
    documento: "1.023.456.789",
    email: "laura.gomez@example.com",
    telefono: "+57 300 123 4567",
    ciudad: "Bogotá D.C.",
    fechaRegistro: "03/08/2026",
    estadoVerificacion: "Aprobada",
    scoreTruora: 94,
    estadoCumplimiento: "Pasa",
    estadoCuenta: "Activa",
    productos: [
      { tipo: "Cuenta digital", referencia: "CTA-1001", estado: "Activo" },
      { tipo: "Compra USDT", referencia: "OTC-2024-0012", estado: "Activo" },
    ],
    observaciones: "",
  },
  {
    id: "CLI-0002",
    nombre: "Andrés Felipe Rojas",
    tipoDocumento: "CC",
    documento: "1.114.567.321",
    email: "andres.rojas@example.com",
    telefono: "+57 320 987 6543",
    ciudad: "Medellín",
    fechaRegistro: "05/08/2026",
    estadoVerificacion: "Pendiente",
    scoreTruora: null,
    estadoCumplimiento: "Pendiente",
    estadoCuenta: "Pendiente de habilitación",
    productos: [],
    observaciones: "",
  },
  {
    id: "CLI-0003",
    nombre: "Mariana Cárdenas López",
    tipoDocumento: "CC",
    documento: "1.032.876.654",
    email: "mariana.cardenas@example.com",
    telefono: "+57 310 555 0199",
    ciudad: "Cali",
    fechaRegistro: "04/08/2026",
    estadoVerificacion: "En revisión",
    scoreTruora: 68,
    estadoCumplimiento: "En revisión",
    estadoCuenta: "Pendiente de habilitación",
    productos: [{ tipo: "Cuenta digital", referencia: "CTA-1003", estado: "Pendiente" }],
    observaciones: "Coincidencia parcial en apellidos con listado de control.",
  },
  {
    id: "CLI-0004",
    nombre: "Carlos Eduardo Mejía",
    tipoDocumento: "CC",
    documento: "71.234.908",
    email: "carlos.mejia@example.com",
    telefono: "+57 301 222 3344",
    ciudad: "Barranquilla",
    fechaRegistro: "01/08/2026",
    estadoVerificacion: "Rechazada",
    scoreTruora: 31,
    estadoCumplimiento: "Pasa",
    estadoCuenta: "Pendiente de habilitación",
    productos: [],
    observaciones:
      "Documento de identidad no coincide con biometría. Se solicita nueva validación.",
  },
  {
    id: "CLI-0005",
    nombre: "Comercializadora del Norte S.A.S.",
    tipoDocumento: "NIT",
    documento: "900.456.789-2",
    email: "contable@comercialnorte.com",
    telefono: "+57 601 444 5566",
    ciudad: "Bogotá D.C.",
    fechaRegistro: "30/07/2026",
    estadoVerificacion: "Aprobada",
    scoreTruora: 88,
    estadoCumplimiento: "Pasa",
    estadoCuenta: "Activa",
    productos: [
      { tipo: "Cuenta empresarial", referencia: "CTA-2001", estado: "Activo" },
      { tipo: "Pago internacional", referencia: "SOL-001", estado: "Activo" },
    ],
    observaciones: "",
  },
  {
    id: "CLI-0006",
    nombre: "Julián Andrade Pinzón",
    tipoDocumento: "CE",
    documento: "E-008112233",
    email: "julian.andrade@example.com",
    telefono: "+57 315 777 8899",
    ciudad: "Cartagena",
    fechaRegistro: "06/08/2026",
    estadoVerificacion: "Pendiente",
    scoreTruora: null,
    estadoCumplimiento: "En revisión",
    estadoCuenta: "Pendiente de habilitación",
    productos: [],
    observaciones: "Cruce manual requerido por lista de PEP.",
  },
  {
    id: "CLI-0007",
    nombre: "Diana Paola Ramírez",
    tipoDocumento: "CC",
    documento: "1.073.889.220",
    email: "diana.ramirez@example.com",
    telefono: "+57 302 400 1122",
    ciudad: "Bucaramanga",
    fechaRegistro: "29/07/2026",
    estadoVerificacion: "Aprobada",
    scoreTruora: 91,
    estadoCumplimiento: "No pasa",
    estadoCuenta: "Bloqueada",
    productos: [{ tipo: "Cuenta digital", referencia: "CTA-1007", estado: "Bloqueado" }],
    observaciones: "Coincidencia con listado nacional de control (Unidad de Información).",
  },
  {
    id: "CLI-0008",
    nombre: "Santiago Villaquirán",
    tipoDocumento: "CC",
    documento: "1.085.221.556",
    email: "santiago.v@example.com",
    telefono: "+57 311 890 7712",
    ciudad: "Pereira",
    fechaRegistro: "28/07/2026",
    estadoVerificacion: "Aprobada",
    scoreTruora: 82,
    estadoCumplimiento: "Pasa",
    estadoCuenta: "Activa",
    productos: [{ tipo: "Venta USDT", referencia: "OTC-2024-0098", estado: "Activo" }],
    observaciones: "",
  },
  {
    id: "CLI-0009",
    nombre: "Importadora Caribe Ltda.",
    tipoDocumento: "NIT",
    documento: "800.123.456-5",
    email: "finanzas@importadoracaribe.com",
    telefono: "+57 605 334 7788",
    ciudad: "Santa Marta",
    fechaRegistro: "25/07/2026",
    estadoVerificacion: "En revisión",
    scoreTruora: 59,
    estadoCumplimiento: "Pendiente",
    estadoCuenta: "Pendiente de habilitación",
    productos: [],
    observaciones: "Documentación corporativa incompleta.",
  },
  {
    id: "CLI-0010",
    nombre: "Valentina Ospina Vélez",
    tipoDocumento: "CC",
    documento: "1.128.456.990",
    email: "valentina.ospina@example.com",
    telefono: "+57 316 234 5678",
    ciudad: "Manizales",
    fechaRegistro: "07/08/2026",
    estadoVerificacion: "Rechazada",
    scoreTruora: 27,
    estadoCumplimiento: "Pasa",
    estadoCuenta: "Pendiente de habilitación",
    productos: [],
    observaciones: "Fotografía de documento ilegible. Se solicita reenvío.",
  },
  {
    id: "CLI-0011",
    nombre: "Miguel Ángel Torres",
    tipoDocumento: "CC",
    documento: "1.010.555.223",
    email: "miguel.torres@example.com",
    telefono: "+57 304 111 2233",
    ciudad: "Cúcuta",
    fechaRegistro: "02/08/2026",
    estadoVerificacion: "Aprobada",
    scoreTruora: 97,
    estadoCumplimiento: "Pasa",
    estadoCuenta: "Activa",
    productos: [{ tipo: "Pago internacional", referencia: "SOL-002", estado: "Activo" }],
    observaciones: "",
  },
  {
    id: "CLI-0012",
    nombre: "Esteban Rincón Palacios",
    tipoDocumento: "Pasaporte",
    documento: "AK-4455123",
    email: "esteban.rincon@example.com",
    telefono: "+57 317 555 0912",
    ciudad: "Bogotá D.C.",
    fechaRegistro: "31/07/2026",
    estadoVerificacion: "Pendiente",
    scoreTruora: null,
    estadoCumplimiento: "Pendiente",
    estadoCuenta: "Pendiente de habilitación",
    productos: [],
    observaciones: "",
  },
];

const revisionesIniciales: RevisionIdentidad[] = [
  {
    clienteId: "CLI-0001",
    fecha: "03/08/2026 10:24",
    proveedor: "Truora",
    estado: "Aprobada",
    score: 94,
    matchBiometrico: 98,
    liveness: "Aprobado",
    validacionDocumento: "Consistente",
    tipoDocumento: "CC",
    numeroDocumento: "1023456789",
    flags: [],
    observaciones: "",
  },
  {
    clienteId: "CLI-0002",
    fecha: "05/08/2026 14:02",
    proveedor: "Truora",
    estado: "Pendiente",
    score: 0,
    matchBiometrico: 0,
    liveness: "Revisión manual",
    validacionDocumento: "No evaluado",
    tipoDocumento: "CC",
    numeroDocumento: "1114567321",
    flags: ["Sin resultado biometría", "Pendiente captura comprobatoria"],
    observaciones: "",
  },
  {
    clienteId: "CLI-0003",
    fecha: "04/08/2026 09:41",
    proveedor: "Truora",
    estado: "En revisión",
    score: 68,
    matchBiometrico: 72,
    liveness: "Revisión manual",
    validacionDocumento: "Inconsistente",
    tipoDocumento: "CC",
    numeroDocumento: "1032876654",
    flags: ["Diferencia de apellidos", "Firmas de fecha divergentes"],
    observaciones: "Coincidencia parcial en apellidos con listado de control.",
  },
  {
    clienteId: "CLI-0004",
    fecha: "01/08/2026 16:55",
    proveedor: "Truora",
    estado: "Rechazada",
    score: 31,
    matchBiometrico: 44,
    liveness: "Fallido",
    validacionDocumento: "Inconsistente",
    tipoDocumento: "CC",
    numeroDocumento: "71234908",
    flags: ["Inconsistencia facial", "Documento no válido"],
    observaciones:
      "Documento de identidad no coincide con biometría. Se solicita nueva validación.",
  },
  {
    clienteId: "CLI-0005",
    fecha: "30/07/2026 11:10",
    proveedor: "Truora",
    estado: "Aprobada",
    score: 88,
    matchBiometrico: 94,
    liveness: "Aprobado",
    validacionDocumento: "Consistente",
    tipoDocumento: "NIT",
    numeroDocumento: "9004567892",
    flags: [],
    observaciones: "Representante legal verificado.",
  },
  {
    clienteId: "CLI-0006",
    fecha: "06/08/2026 08:30",
    proveedor: "Truora",
    estado: "Pendiente",
    score: 0,
    matchBiometrico: 0,
    liveness: "Revisión manual",
    validacionDocumento: "No evaluado",
    tipoDocumento: "CE",
    numeroDocumento: "E008112233",
    flags: ["Documento de extranjero pendiente"],
    observaciones: "",
  },
  {
    clienteId: "CLI-0007",
    fecha: "29/07/2026 12:18",
    proveedor: "Truora",
    estado: "Aprobada",
    score: 91,
    matchBiometrico: 96,
    liveness: "Aprobado",
    validacionDocumento: "Consistente",
    tipoDocumento: "CC",
    numeroDocumento: "1073889220",
    flags: [],
    observaciones: "",
  },
  {
    clienteId: "CLI-0008",
    fecha: "28/07/2026 15:47",
    proveedor: "Truora",
    estado: "Aprobada",
    score: 82,
    matchBiometrico: 90,
    liveness: "Aprobado",
    validacionDocumento: "Consistente",
    tipoDocumento: "CC",
    numeroDocumento: "1085221556",
    flags: [],
    observaciones: "",
  },
  {
    clienteId: "CLI-0009",
    fecha: "25/07/2026 10:00",
    proveedor: "Truora",
    estado: "En revisión",
    score: 59,
    matchBiometrico: 70,
    liveness: "Revisión manual",
    validacionDocumento: "Revisión manual",
    tipoDocumento: "NIT",
    numeroDocumento: "8001234565",
    flags: ["Estatutos sociales pendientes de cotejo"],
    observaciones: "Documentación corporativa incompleta.",
  },
  {
    clienteId: "CLI-0010",
    fecha: "07/08/2026 13:05",
    proveedor: "Truora",
    estado: "Rechazada",
    score: 27,
    matchBiometrico: 39,
    liveness: "Fallido",
    validacionDocumento: "Inconsistente",
    tipoDocumento: "CC",
    numeroDocumento: "1128456990",
    flags: ["Documento ilegible", "Captura frontal fuera de rango"],
    observaciones: "Fotografía de documento ilegible. Se solicita reenvío.",
  },
  {
    clienteId: "CLI-0011",
    fecha: "02/08/2026 09:52",
    proveedor: "Truora",
    estado: "Aprobada",
    score: 97,
    matchBiometrico: 99,
    liveness: "Aprobado",
    validacionDocumento: "Consistente",
    tipoDocumento: "CC",
    numeroDocumento: "1010555223",
    flags: [],
    observaciones: "",
  },
  {
    clienteId: "CLI-0012",
    fecha: "31/07/2026 17:20",
    proveedor: "Truora",
    estado: "Pendiente",
    score: 0,
    matchBiometrico: 0,
    liveness: "Revisión manual",
    validacionDocumento: "No evaluado",
    tipoDocumento: "Pasaporte",
    numeroDocumento: "AK4455123",
    flags: ["Pasaporte requiere validación manual"],
    observaciones: "",
  },
];

const cumplimientoInicial: CumplimientoListas[] = [
  {
    clienteId: "CLI-0001",
    estadoCumplimiento: "Pasa",
    resultados: [
      { lista: "OFAC (SDN)", resultado: "Sin coincidencia", detalle: "", fecha: "03/08/2026" },
      {
        lista: "Consejo de Seguridad ONU",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "03/08/2026",
      },
      { lista: "Unión Europea", resultado: "Sin coincidencia", detalle: "", fecha: "03/08/2026" },
      {
        lista: "Unidad de Información (Colombia)",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "03/08/2026",
      },
      {
        lista: "PEP / Funcionario público",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "03/08/2026",
      },
    ],
    observaciones: "",
  },
  {
    clienteId: "CLI-0002",
    estadoCumplimiento: "Pendiente",
    resultados: [
      { lista: "OFAC (SDN)", resultado: "Sin coincidencia", detalle: "", fecha: "05/08/2026" },
      {
        lista: "Consejo de Seguridad ONU",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "05/08/2026",
      },
      { lista: "Unión Europea", resultado: "Sin coincidencia", detalle: "", fecha: "05/08/2026" },
      {
        lista: "Unidad de Información (Colombia)",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "05/08/2026",
      },
      {
        lista: "PEP / Funcionario público",
        resultado: "En revisión",
        detalle: "",
        fecha: "05/08/2026",
      },
    ],
    observaciones: "",
  },
  {
    clienteId: "CLI-0003",
    estadoCumplimiento: "En revisión",
    resultados: [
      { lista: "OFAC (SDN)", resultado: "Sin coincidencia", detalle: "", fecha: "04/08/2026" },
      {
        lista: "Consejo de Seguridad ONU",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "04/08/2026",
      },
      { lista: "Unión Europea", resultado: "Sin coincidencia", detalle: "", fecha: "04/08/2026" },
      {
        lista: "Unidad de Información (Colombia)",
        resultado: "Coincidencia",
        detalle: "Coincidencia parcial de apellidos (Gómez). Cotejo manual.",
        fecha: "04/08/2026",
      },
      {
        lista: "PEP / Funcionario público",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "04/08/2026",
      },
    ],
    observaciones: "Coincidencia parcial en apellidos con listado de control.",
  },
  {
    clienteId: "CLI-0004",
    estadoCumplimiento: "Pasa",
    resultados: [
      { lista: "OFAC (SDN)", resultado: "Sin coincidencia", detalle: "", fecha: "01/08/2026" },
      {
        lista: "Consejo de Seguridad ONU",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "01/08/2026",
      },
      { lista: "Unión Europea", resultado: "Sin coincidencia", detalle: "", fecha: "01/08/2026" },
      {
        lista: "Unidad de Información (Colombia)",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "01/08/2026",
      },
      {
        lista: "PEP / Funcionario público",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "01/08/2026",
      },
    ],
    observaciones: "",
  },
  {
    clienteId: "CLI-0005",
    estadoCumplimiento: "Pasa",
    resultados: [
      { lista: "OFAC (SDN)", resultado: "Sin coincidencia", detalle: "", fecha: "30/07/2026" },
      {
        lista: "Consejo de Seguridad ONU",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "30/07/2026",
      },
      { lista: "Unión Europea", resultado: "Sin coincidencia", detalle: "", fecha: "30/07/2026" },
      {
        lista: "Unidad de Información (Colombia)",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "30/07/2026",
      },
      {
        lista: "PEP / Funcionario público",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "30/07/2026",
      },
    ],
    observaciones: "",
  },
  {
    clienteId: "CLI-0006",
    estadoCumplimiento: "En revisión",
    resultados: [
      { lista: "OFAC (SDN)", resultado: "Sin coincidencia", detalle: "", fecha: "06/08/2026" },
      {
        lista: "Consejo de Seguridad ONU",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "06/08/2026",
      },
      { lista: "Unión Europea", resultado: "Sin coincidencia", detalle: "", fecha: "06/08/2026" },
      {
        lista: "Unidad de Información (Colombia)",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "06/08/2026",
      },
      {
        lista: "PEP / Funcionario público",
        resultado: "Coincidencia",
        detalle: "PEP identificado en cargo público. Requiere declaración de origen de fondos.",
        fecha: "06/08/2026",
      },
    ],
    observaciones: "Cruce manual requerido por lista de PEP.",
  },
  {
    clienteId: "CLI-0007",
    estadoCumplimiento: "No pasa",
    resultados: [
      { lista: "OFAC (SDN)", resultado: "Sin coincidencia", detalle: "", fecha: "29/07/2026" },
      {
        lista: "Consejo de Seguridad ONU",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "29/07/2026",
      },
      { lista: "Unión Europea", resultado: "Sin coincidencia", detalle: "", fecha: "29/07/2026" },
      {
        lista: "Unidad de Información (Colombia)",
        resultado: "Coincidencia",
        detalle: "Coincidencia exacta en listado nacional de control.",
        fecha: "29/07/2026",
      },
      {
        lista: "PEP / Funcionario público",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "29/07/2026",
      },
    ],
    observaciones: "Coincidencia con listado nacional de control (Unidad de Información).",
  },
  {
    clienteId: "CLI-0008",
    estadoCumplimiento: "Pasa",
    resultados: [
      { lista: "OFAC (SDN)", resultado: "Sin coincidencia", detalle: "", fecha: "28/07/2026" },
      {
        lista: "Consejo de Seguridad ONU",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "28/07/2026",
      },
      { lista: "Unión Europea", resultado: "Sin coincidencia", detalle: "", fecha: "28/07/2026" },
      {
        lista: "Unidad de Información (Colombia)",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "28/07/2026",
      },
      {
        lista: "PEP / Funcionario público",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "28/07/2026",
      },
    ],
    observaciones: "",
  },
  {
    clienteId: "CLI-0009",
    estadoCumplimiento: "Pendiente",
    resultados: [
      { lista: "OFAC (SDN)", resultado: "Sin coincidencia", detalle: "", fecha: "25/07/2026" },
      {
        lista: "Consejo de Seguridad ONU",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "25/07/2026",
      },
      { lista: "Unión Europea", resultado: "Sin coincidencia", detalle: "", fecha: "25/07/2026" },
      {
        lista: "Unidad de Información (Colombia)",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "25/07/2026",
      },
      {
        lista: "PEP / Funcionario público",
        resultado: "En revisión",
        detalle: "",
        fecha: "25/07/2026",
      },
    ],
    observaciones: "",
  },
  {
    clienteId: "CLI-0010",
    estadoCumplimiento: "Pasa",
    resultados: [
      { lista: "OFAC (SDN)", resultado: "Sin coincidencia", detalle: "", fecha: "07/08/2026" },
      {
        lista: "Consejo de Seguridad ONU",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "07/08/2026",
      },
      { lista: "Unión Europea", resultado: "Sin coincidencia", detalle: "", fecha: "07/08/2026" },
      {
        lista: "Unidad de Información (Colombia)",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "07/08/2026",
      },
      {
        lista: "PEP / Funcionario público",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "07/08/2026",
      },
    ],
    observaciones: "",
  },
  {
    clienteId: "CLI-0011",
    estadoCumplimiento: "Pasa",
    resultados: [
      { lista: "OFAC (SDN)", resultado: "Sin coincidencia", detalle: "", fecha: "02/08/2026" },
      {
        lista: "Consejo de Seguridad ONU",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "02/08/2026",
      },
      { lista: "Unión Europea", resultado: "Sin coincidencia", detalle: "", fecha: "02/08/2026" },
      {
        lista: "Unidad de Información (Colombia)",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "02/08/2026",
      },
      {
        lista: "PEP / Funcionario público",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "02/08/2026",
      },
    ],
    observaciones: "",
  },
  {
    clienteId: "CLI-0012",
    estadoCumplimiento: "Pendiente",
    resultados: [
      { lista: "OFAC (SDN)", resultado: "Sin coincidencia", detalle: "", fecha: "31/07/2026" },
      {
        lista: "Consejo de Seguridad ONU",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "31/07/2026",
      },
      { lista: "Unión Europea", resultado: "Sin coincidencia", detalle: "", fecha: "31/07/2026" },
      {
        lista: "Unidad de Información (Colombia)",
        resultado: "Sin coincidencia",
        detalle: "",
        fecha: "31/07/2026",
      },
      {
        lista: "PEP / Funcionario público",
        resultado: "En revisión",
        detalle: "",
        fecha: "31/07/2026",
      },
    ],
    observaciones: "",
  },
];

const pagosIniciales: SolicitudPago[] = [
  {
    id: "SOL-001",
    clienteNombre: "Comercializadora del Norte S.A.S.",
    beneficiario: "Pacific Trade Ltd.",
    bancoBeneficiario: "Bank of America",
    cuentaBeneficiario: "US****4431",
    bancoOrigen: "Bancolombia",
    monto: 250000,
    moneda: "USD",
    concepto: "Importación de maquinaria cotización 1182",
    factura: "INV-1182.pdf",
    estado: "Pendiente",
    motivoEstado: "",
    comprobanteId: null,
    fecha: "07/08/2026",
  },
  {
    id: "SOL-002",
    clienteNombre: "Miguel Ángel Torres",
    beneficiario: "Gabriela Torres Díaz",
    bancoBeneficiario: "Chase",
    cuentaBeneficiario: "US****2090",
    bancoOrigen: "Banco de Bogotá",
    monto: 185000,
    moneda: "USD",
    concepto: "Sustento familiar mensual",
    factura: "SOP-FAM-001.pdf",
    estado: "En proceso",
    motivoEstado: "En espera de voucher bancario.",
    comprobanteId: "CMP-001",
    fecha: "06/08/2026",
  },
  {
    id: "SOL-003",
    clienteNombre: "Importadora Caribe Ltda.",
    beneficiario: "Green Valley Foods Inc.",
    bancoBeneficiario: "Wells Fargo",
    cuentaBeneficiario: "US****7781",
    bancoOrigen: "Banco Popular",
    monto: 320000,
    moneda: "USD",
    concepto: "Pago de proveedores internacionales agosto",
    factura: "INV-2026-0814.pdf",
    estado: "Aprobado",
    motivoEstado: "Transferencia confirmada por el banco corresponsal.",
    comprobanteId: "CMP-002",
    fecha: "05/08/2026",
  },
  {
    id: "SOL-004",
    clienteNombre: "Laura Gómez Restrepo",
    beneficiario: "Universidad Javeriana – Cuenta extranjera",
    bancoBeneficiario: "BBVA España",
    cuentaBeneficiario: "ES****5590",
    bancoOrigen: "Bancolombia",
    monto: 42000,
    moneda: "USD",
    concepto: "Pago de matrícula internacional",
    factura: "REC-MAT-2201.pdf",
    estado: "Pendiente",
    motivoEstado: "",
    comprobanteId: null,
    fecha: "08/08/2026",
  },
  {
    id: "SOL-005",
    clienteNombre: "Santiago Villaquirán",
    beneficiario: "Binance Custody S.A.",
    bancoBeneficiario: "Silvergate Bank",
    cuentaBeneficiario: "US****9912",
    bancoOrigen: "Banco de Occidente",
    monto: 150000,
    moneda: "USD",
    concepto: "Fonding de cuenta OTC",
    factura: "ORD-OTC-0098.pdf",
    estado: "Rechazado",
    motivoEstado: "Beneficiario no coincide con factura soporte. Se requiere actualización.",
    comprobanteId: null,
    fecha: "04/08/2026",
  },
  {
    id: "SOL-006",
    clienteNombre: "Valentina Ospina Vélez",
    beneficiario: "Oxford Publishing Ltd.",
    bancoBeneficiario: "HSBC UK",
    cuentaBeneficiario: "GB****3398",
    bancoOrigen: "Banco de Bogotá",
    monto: 78000,
    moneda: "USD",
    concepto: "Licencias de contenido académico",
    factura: "INV-LIC-667.pdf",
    estado: "Pendiente",
    motivoEstado: "",
    comprobanteId: null,
    fecha: "08/08/2026",
  },
  {
    id: "SOL-007",
    clienteNombre: "Mariana Cárdenas López",
    beneficiario: "TechStartup Partners VC",
    bancoBeneficiario: "JPMorgan",
    cuentaBeneficiario: "US****1189",
    bancoOrigen: "Daviplata",
    monto: 95000,
    moneda: "USD",
    concepto: "Inversión ronda semilla",
    factura: "TERM-ROUND-2026.pdf",
    estado: "En proceso",
    motivoEstado: "Validación de comprobante en curso.",
    comprobanteId: "CMP-004",
    fecha: "07/08/2026",
  },
  {
    id: "SOL-008",
    clienteNombre: "Andrés Felipe Rojas",
    beneficiario: "Medellín Motors LLC",
    bancoBeneficiario: "Citibank",
    cuentaBeneficiario: "US****6620",
    bancoOrigen: "Bancolombia",
    monto: 210000,
    moneda: "USD",
    concepto: "Importación de repuestos línea pesada",
    factura: "PR-2026-0777.jpg",
    estado: "Aprobado",
    motivoEstado: "",
    comprobanteId: "CMP-003",
    fecha: "03/08/2026",
  },
  {
    id: "SOL-009",
    clienteNombre: "Diana Paola Ramírez",
    beneficiario: "Jersey Trading Ltd.",
    bancoBeneficiario: "Barclays",
    cuentaBeneficiario: "GB****8834",
    bancoOrigen: "Banco Santander Colombia",
    monto: 64000,
    moneda: "USD",
    concepto: "Servicios de consultoría internacional",
    factura: "INV-CONS-334.pdf",
    estado: "Rechazado",
    motivoEstado: "Cliente bloqueado por cumplimiento. Solicitud anulada.",
    comprobanteId: null,
    fecha: "02/08/2026",
  },
  {
    id: "SOL-010",
    clienteNombre: "Comercializadora del Norte S.A.S.",
    beneficiario: "Andes Machinery S.A.",
    bancoBeneficiario: "Itaú Chile",
    cuentaBeneficiario: "CL****0817",
    bancoOrigen: "Bancolombia",
    monto: 132000,
    moneda: "USD",
    concepto: "Segunda cuota maquinaria pesada",
    factura: "INV-1182-2.pdf",
    estado: "Pendiente",
    motivoEstado: "",
    comprobanteId: null,
    fecha: "09/08/2026",
  },
];

const comprobantesIniciales: Comprobante[] = [
  {
    id: "CMP-001",
    solicitudId: "SOL-002",
    nombreArchivo: "voucher_banco_bogota_sol002.png",
    referencia: "TRF-88231947",
    fechaCarga: "06/08/2026 15:40",
    validado: "Pendiente",
  },
  {
    id: "CMP-002",
    solicitudId: "SOL-003",
    nombreArchivo: "comprobante_wellsfargo_301.pdf",
    referencia: "TRF-41033219",
    fechaCarga: "05/08/2026 17:05",
    validado: "Validado",
  },
  {
    id: "CMP-003",
    solicitudId: "SOL-008",
    nombreArchivo: "voucher_citibank_sol008.pdf",
    referencia: "TRF-39550118",
    fechaCarga: "03/08/2026 09:12",
    validado: "Validado",
  },
  {
    id: "CMP-004",
    solicitudId: "SOL-007",
    nombreArchivo: "comprobante_jpmorgan_sol007.png",
    referencia: "TRF-89112002",
    fechaCarga: "07/08/2026 18:22",
    validado: "Pendiente",
  },
];

const operacionesOtcIniciales: OperacionOtc[] = [
  {
    id: "OTC-2024-0001",
    clienteNombre: "Santiago Villaquirán",
    tipo: "Venta USDT",
    montoUSDT: 2500,
    montoCOP: 0,
    tasaAplicada: null,
    montoFinalCOP: null,
    montoFinalUSDT: null,
    estado: "Pendiente",
    motivoEstado: "",
    fecha: "08/08/2026",
  },
  {
    id: "OTC-2024-0002",
    clienteNombre: "Laura Gómez Restrepo",
    tipo: "Compra USDT",
    montoUSDT: 0,
    montoCOP: 11500000,
    tasaAplicada: null,
    montoFinalCOP: null,
    montoFinalUSDT: null,
    estado: "Pendiente",
    motivoEstado: "",
    fecha: "08/08/2026",
  },
  {
    id: "OTC-2024-0003",
    clienteNombre: "Comercializadora del Norte S.A.S.",
    tipo: "Venta USDT",
    montoUSDT: 8500,
    montoCOP: 0,
    tasaAplicada: 4220,
    montoFinalCOP: 35870000,
    montoFinalUSDT: null,
    estado: "En revisión",
    motivoEstado: "Tasa propuesta pendiente de confirmación.",
    fecha: "07/08/2026",
  },
  {
    id: "OTC-2024-0004",
    clienteNombre: "Miguel Ángel Torres",
    tipo: "Compra USDT",
    montoUSDT: 0,
    montoCOP: 22000000,
    tasaAplicada: 4215,
    montoFinalCOP: 22000000,
    montoFinalUSDT: 5219.45,
    estado: "Aprobada",
    motivoEstado: "",
    fecha: "05/08/2026",
  },
  {
    id: "OTC-2024-0005",
    clienteNombre: "Mariana Cárdenas López",
    tipo: "Venta USDT",
    montoUSDT: 1200,
    montoCOP: 0,
    tasaAplicada: null,
    montoFinalCOP: null,
    montoFinalUSDT: null,
    estado: "Pendiente",
    motivoEstado: "",
    fecha: "08/08/2026",
  },
  {
    id: "OTC-2024-0006",
    clienteNombre: "Andrés Felipe Rojas",
    tipo: "Compra USDT",
    montoUSDT: 0,
    montoCOP: 8900000,
    tasaAplicada: null,
    montoFinalCOP: null,
    montoFinalUSDT: null,
    estado: "Pendiente",
    motivoEstado: "",
    fecha: "09/08/2026",
  },
  {
    id: "OTC-2024-0007",
    clienteNombre: "Diana Paola Ramírez",
    tipo: "Venta USDT",
    montoUSDT: 3000,
    montoCOP: 0,
    tasaAplicada: 4185,
    montoFinalCOP: 12555000,
    montoFinalUSDT: null,
    estado: "Rechazada",
    motivoEstado: "Cliente bloqueado por cumplimiento.",
    fecha: "02/08/2026",
  },
  {
    id: "OTC-2024-0008",
    clienteNombre: "Valentina Ospina Vélez",
    tipo: "Compra USDT",
    montoUSDT: 0,
    montoCOP: 15000000,
    tasaAplicada: 4208,
    montoFinalCOP: 15000000,
    montoFinalUSDT: 3564.64,
    estado: "Aprobada",
    motivoEstado: "",
    fecha: "04/08/2026",
  },
  {
    id: "OTC-2024-0009",
    clienteNombre: "Esteban Rincón Palacios",
    tipo: "Venta USDT",
    montoUSDT: 6200,
    montoCOP: 0,
    tasaAplicada: null,
    montoFinalCOP: null,
    montoFinalUSDT: null,
    estado: "En revisión",
    motivoEstado: "Verificación de origen de criptoactivos en curso.",
    fecha: "06/08/2026",
  },
  {
    id: "OTC-2024-0010",
    clienteNombre: "Carlos Eduardo Mejía",
    tipo: "Venta USDT",
    montoUSDT: 4100,
    montoCOP: 0,
    tasaAplicada: null,
    montoFinalCOP: null,
    montoFinalUSDT: null,
    estado: "Pendiente",
    motivoEstado: "",
    fecha: "09/08/2026",
  },
];

// ─────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────

export type BackofficeStore = {
  clientes: Cliente[];
  revisiones: RevisionIdentidad[];
  cumplimiento: CumplimientoListas[];
  pagos: SolicitudPago[];
  comprobantes: Comprobante[];
  operacionesOtc: OperacionOtc[];

  setRevisionIdentidad: (clienteId: string, patch: Partial<RevisionIdentidad>) => void;
  setVerificacion: (clienteId: string, estado: EstadoVerificacion, observaciones: string) => void;
  setCumplimiento: (clienteId: string, estado: EstadoCumplimiento, observaciones?: string) => void;
  setResultadoLista: (
    clienteId: string,
    lista: ListaRestrictiva,
    resultado: ResultadoListaCliente["resultado"],
    detalle?: string,
  ) => void;
  setEstadoCuenta: (clienteId: string, estado: EstadoCuenta) => void;
  setObservaciones: (clienteId: string, texto: string) => void;
  setPagoEstado: (pagoId: string, estado: EstadoPago, motivo: string) => void;
  asociarComprobante: (pagoId: string, comprobanteId: string) => void;
  agregarComprobante: (comp: Comprobante) => void;
  validarComprobante: (id: string, validado: EstadoValidacionComprobante) => void;
  setComprobanteSolicitud: (id: string, solicitudId: string) => void;
  setOtcTasa: (otcId: string, tasa: number, montoCOP: number, montoUSDT: number) => void;
  setOtcEstado: (otcId: string, estado: EstadoOtc, motivo: string) => void;
  crearOtc: (otc: OperacionOtc) => void;
};

export const useBackoffice = create<BackofficeStore>()((set) => ({
  clientes: clientesIniciales,
  revisiones: revisionesIniciales,
  cumplimiento: cumplimientoInicial,
  pagos: pagosIniciales,
  comprobantes: comprobantesIniciales,
  operacionesOtc: operacionesOtcIniciales,

  setRevisionIdentidad: (clienteId, patch) =>
    set((s) => ({
      revisiones: s.revisiones.map((r) => (r.clienteId === clienteId ? { ...r, ...patch } : r)),
    })),

  setVerificacion: (clienteId, estado, observaciones) =>
    set((s) => ({
      clientes: s.clientes.map((c) =>
        c.id === clienteId ? { ...c, estadoVerificacion: estado } : c,
      ),
      revisiones: s.revisiones.map((r) =>
        r.clienteId === clienteId ? { ...r, estado, observaciones } : r,
      ),
    })),

  setCumplimiento: (clienteId, estado, observaciones = "") =>
    set((s) => ({
      clientes: s.clientes.map((c) =>
        c.id === clienteId ? { ...c, estadoCumplimiento: estado } : c,
      ),
      cumplimiento: s.cumplimiento.map((c) =>
        c.clienteId === clienteId ? { ...c, estadoCumplimiento: estado, observaciones } : c,
      ),
    })),

  setResultadoLista: (clienteId, lista, resultado, detalle = "") =>
    set((s) => ({
      cumplimiento: s.cumplimiento.map((c) =>
        c.clienteId === clienteId
          ? {
              ...c,
              resultados: c.resultados.map((r) =>
                r.lista === lista ? { ...r, resultado, detalle } : r,
              ),
            }
          : c,
      ),
    })),

  setEstadoCuenta: (clienteId, estado) =>
    set((s) => ({
      clientes: s.clientes.map((c) => (c.id === clienteId ? { ...c, estadoCuenta: estado } : c)),
    })),

  setObservaciones: (clienteId, texto) =>
    set((s) => ({
      clientes: s.clientes.map((c) => (c.id === clienteId ? { ...c, observaciones: texto } : c)),
      revisiones: s.revisiones.map((r) =>
        r.clienteId === clienteId ? { ...r, observaciones: texto } : r,
      ),
      cumplimiento: s.cumplimiento.map((c) =>
        c.clienteId === clienteId ? { ...c, observaciones: texto } : c,
      ),
    })),

  setPagoEstado: (pagoId, estado, motivo) =>
    set((s) => ({
      pagos: s.pagos.map((p) =>
        p.id === pagoId ? { ...p, estado, motivoEstado: estado === "Pendiente" ? "" : motivo } : p,
      ),
    })),

  asociarComprobante: (pagoId, comprobanteId) =>
    set((s) => ({
      pagos: s.pagos.map((p) => (p.id === pagoId ? { ...p, comprobanteId } : p)),
    })),

  agregarComprobante: (comp) => set((s) => ({ comprobantes: [comp, ...s.comprobantes] })),

  validarComprobante: (id, validado) =>
    set((s) => ({
      comprobantes: s.comprobantes.map((c) => (c.id === id ? { ...c, validado } : c)),
    })),

  setComprobanteSolicitud: (id, solicitudId) =>
    set((s) => {
      const comp = s.comprobantes.find((c) => c.id === id);
      const prev = comp?.solicitudId ?? null;
      const pagos = s.pagos.map((p) => {
        if (p.id === solicitudId) return { ...p, comprobanteId: id };
        if (prev && p.id === prev) return { ...p, comprobanteId: null };
        return p;
      });
      return {
        comprobantes: s.comprobantes.map((c) => (c.id === id ? { ...c, solicitudId } : c)),
        pagos,
      };
    }),

  setOtcTasa: (otcId, tasa, montoCOP, montoUSDT) =>
    set((s) => ({
      operacionesOtc: s.operacionesOtc.map((o) =>
        o.id === otcId
          ? {
              ...o,
              tasaAplicada: tasa,
              montoCOP,
              montoFinalCOP: montoCOP,
              montoFinalUSDT: montoUSDT,
              estado: "En revisión",
              motivoEstado: "Tasa y monto final registrados por el operador.",
            }
          : o,
      ),
    })),

  setOtcEstado: (otcId, estado, motivo) =>
    set((s) => ({
      operacionesOtc: s.operacionesOtc.map((o) =>
        o.id === otcId ? { ...o, estado, motivoEstado: estado === "Pendiente" ? "" : motivo } : o,
      ),
    })),

  crearOtc: (otc) => set((s) => ({ operacionesOtc: [otc, ...s.operacionesOtc] })),
}));
