/** minúsculas, sin acentos, solo letras y números separados por un espacio (igual que en el script). */
export function normalizar(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Para detectar duplicados: sin protocolo, sin «www.», sin «/» final (igual que en el script). */
export function normalizarUrl(u) {
  let s = String(u || '').trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  const barra = s.indexOf('/');
  const host = barra < 0 ? s : s.slice(0, barra);
  const resto = barra < 0 ? '' : s.slice(barra);
  return (host.toLowerCase() + resto).replace(/\/+$/, '');
}

export function dominio(u) {
  const m = String(u || '').match(/^https?:\/\/([^/?#:]+)/i);
  return m ? m[1].toLowerCase().replace(/^www\./, '') : '';
}

/** Acepta «www.ejemplo.com» o «ejemplo.com/x» y añade https://. Devuelve '' si no parece un link. */
export function completarUrl(texto) {
  const s = String(texto || '').trim();
  if (!s || /\s/.test(s)) return '';
  if (/^https?:\/\/[^\s/]+\.[^\s]+/i.test(s) || /^https?:\/\/localhost/i.test(s)) return s;
  if (/^[a-z]+:/i.test(s)) return ''; // otro protocolo (mailto:, javascript:…)
  if (/^[^\s/]+\.[a-z]{2,}([/?#].*)?$/i.test(s)) return 'https://' + s;
  return '';
}

export function esUrlValida(s) {
  return /^https?:\/\/[^\s/]+\.[^\s]+$/i.test(String(s || '').trim());
}

export function distancia(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let previa = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const fila = [i];
    for (let j = 1; j <= b.length; j++) {
      fila[j] = Math.min(previa[j] + 1, fila[j - 1] + 1, previa[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previa = fila;
  }
  return previa[b.length];
}

/**
 * ¿Se parecen dos nombres de categoría? Ignora mayúsculas y acentos, acepta palabras contenidas
 * una en otra y pequeñas diferencias de escritura. No reconoce sinónimos.
 */
export function parecidos(a, b) {
  const x = normalizar(a), y = normalizar(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const corta = x.length <= y.length ? x : y;
  const larga = corta === x ? y : x;
  if (corta.length >= 3 && larga.includes(corta)) return true;
  const tolerancia = larga.length <= 4 ? 0 : larga.length <= 7 ? 1 : 2;
  return distancia(x, y) <= tolerancia;
}

/** Puntuación para ordenar sugerencias: 0 = igual, más alto = menos parecido. */
export function puntuacion(a, b) {
  const x = normalizar(a), y = normalizar(b);
  if (x === y) return 0;
  if (y.startsWith(x) || x.startsWith(y)) return 1;
  if (y.includes(x) || x.includes(y)) return 2;
  return 3 + distancia(x, y);
}

export function similares(texto, lista) {
  return lista
    .filter((n) => parecidos(texto, n))
    .sort((a, b) => puntuacion(texto, a) - puntuacion(texto, b));
}

export function nuevoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Nombres de categoría: sin comas, que en la hoja separan los temas. */
export function nombreValido(s) {
  const n = String(s || '').replace(/\s+/g, ' ').trim();
  return n && !n.includes(',') ? n.slice(0, 60) : '';
}
