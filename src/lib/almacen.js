// Memoria del navegador. Puede fallar (modo privado, sin espacio): nunca debe romper la app.

const PREFIJO = 'joyero.';

export function leer(clave, porDefecto = null) {
  try {
    const v = localStorage.getItem(PREFIJO + clave);
    return v == null ? porDefecto : JSON.parse(v);
  } catch (e) {
    return porDefecto;
  }
}

export function guardar(clave, valor) {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
    return true;
  } catch (e) {
    return false;
  }
}

export function borrar(clave) {
  try {
    localStorage.removeItem(PREFIJO + clave);
  } catch (e) { /* nada */ }
}
