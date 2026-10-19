import { leerCodigo } from './codigo.js';

export class ErrorJoyero extends Error {
  constructor(codigo, datos) {
    super(codigo);
    this.codigo = codigo; // sin_conexion | tiempo | respuesta | clave | duplicado | existe | ocupado | ...
    this.datos = datos || {};
  }
}

const TIEMPOS = {
  ping: 20000,
  leer: 30000,
  metadatos: 25000,
  importar: 180000,
  porDefecto: 30000
};

/**
 * Llama al script. El cuerpo va como text/plain para que el navegador no haga
 * la consulta previa (CORS), que Apps Script no admite.
 */
export async function llamar(codigo, accion, datos, opciones = {}) {
  const c = typeof codigo === 'string' ? leerCodigo(codigo) : codigo;
  if (!c) throw new ErrorJoyero('clave');
  const tiempo = opciones.tiempo || TIEMPOS[accion] || TIEMPOS.porDefecto;
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), tiempo);
  let respuesta;
  try {
    respuesta = await fetch(c.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ clave: c.clave, accion, datos: datos || {} }),
      redirect: 'follow',
      signal: control.signal,
      cache: 'no-store'
    });
  } catch (e) {
    clearTimeout(temporizador);
    if (e && e.name === 'AbortError') throw new ErrorJoyero('tiempo');
    if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ErrorJoyero('sin_conexion');
    throw new ErrorJoyero('respuesta'); // el script no existe, no es público o Google no responde
  }
  clearTimeout(temporizador);
  let json;
  try {
    json = await respuesta.json();
  } catch (e) {
    throw new ErrorJoyero('respuesta');
  }
  if (!json || json.ok !== true) {
    throw new ErrorJoyero((json && json.error) || 'respuesta', json || {});
  }
  return json;
}

/** Reintenta solo los fallos de red o de espera. */
export async function conReintentos(fn, intentos = 3, esperas = [2000, 5000, 10000]) {
  let ultimo;
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (e) {
      ultimo = e;
      const reintentable = e instanceof ErrorJoyero && ['tiempo', 'respuesta', 'ocupado', 'sin_conexion', 'interno'].includes(e.codigo);
      if (!reintentable || i === intentos - 1) break;
      await new Promise((r) => setTimeout(r, esperas[i] || 10000));
    }
  }
  throw ultimo;
}

/** Texto de error para la persona (clave dentro de «errores»). */
export function claveError(e) {
  const c = e && e.codigo;
  if (c === 'sin_conexion') return 'errores.sinConexion';
  if (c === 'tiempo' || c === 'respuesta' || c === 'ocupado') return 'errores.noResponde';
  if (c === 'clave') return 'errores.clave';
  if (c === 'existe') return 'categoria.existe';
  return 'errores.generico';
}
