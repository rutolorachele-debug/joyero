import es from './es.js';

// Idiomas disponibles. Para añadir italiano o inglés: import it from './it.js' y añadirlo aquí.
const idiomas = { es };
let actual = idiomas.es;

export function usarIdioma(codigo) {
  if (idiomas[codigo]) actual = idiomas[codigo];
}

/** t('codigo.titulo') o t('comun.joyas', { n: 3 }). Devuelve también listas y objetos. */
export function t(clave, vars) {
  const valor = clave.split('.').reduce((o, k) => (o == null ? o : o[k]), actual);
  if (valor == null) {
    if (import.meta.env && import.meta.env.DEV) console.warn('Falta el texto', clave);
    return clave;
  }
  if (typeof valor !== 'string' || !vars) return valor;
  return valor.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
}

/** «1 joya» / «N joyas». */
export function nJoyas(n) {
  return n === 1 ? t('comun.joya1') : t('comun.joyas', { n });
}
