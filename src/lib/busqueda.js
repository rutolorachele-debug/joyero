import { normalizar, distancia, dominio } from './texto.js';

/*
 * Búsqueda tolerante de Mi joyero y Exportar.
 * - Ignora palabras vacías (de, sobre, the, di…), mayúsculas y acentos.
 * - Acepta el principio de una palabra («tipo» → «tipografía»), palabras contenidas
 *   y pequeños errores de escritura («tipografai», «podcasts»).
 * - No exige todas las palabras: con 3 o más basta con la mitad. Primero salen las joyas
 *   que coinciden con más palabras y en los campos más importantes (título, autor, temas).
 */

const VACIAS = new Set((
  // español
  'a al algo con de del el en entre es esa ese eso esta este esto la las lo los mas me mi mis muy no o para pero por que se sin sobre su sus un una uno unos unas y ya ' +
  // italiano
  'ad ai alla alle allo agli che chi come da dai dal dalla della delle dello degli di e gli i il in la le lo ma nel nella per piu quel quella quello si su sul sulla tra un una uno ' +
  // english
  'about an and are as at be by for from how is it of on or that the this to what with'
).split(' '));

/** Pesos por campo: cuánto cuenta encontrar una palabra en cada sitio. */
const CAMPOS = [
  ['titulo', 3], ['autor', 2], ['temas', 2], ['tipo', 2], ['descripcion', 1], ['nota', 1], ['dominio', 1]
];

const indices = new WeakMap();

function indice(j) {
  let ix = indices.get(j);
  if (ix) return ix;
  const textos = {
    titulo: j.titulo, autor: j.autor, temas: (j.temas || []).join(' '), tipo: j.tipo,
    descripcion: j.descripcion, nota: j.nota, dominio: dominio(j.url).replace(/\./g, ' ')
  };
  ix = CAMPOS.map(([campo, peso]) => ({ peso, palabras: normalizar(textos[campo]).split(' ').filter(Boolean) }));
  indices.set(j, ix);
  return ix;
}

function coincide(t, p) {
  if (p.startsWith(t)) return true;
  if (t.length >= 4 && p.includes(t)) return true;
  if (t.length >= 5 && Math.abs(t.length - p.length) <= 2) {
    return distancia(t, p) <= (t.length >= 8 ? 2 : 1);
  }
  return false;
}

/** Palabras de la búsqueda que cuentan. Si todas son vacías («de la»), se usan igualmente. */
export function palabrasBusqueda(texto) {
  const todas = normalizar(texto).split(' ').filter(Boolean);
  const utiles = todas.filter((p) => !VACIAS.has(p));
  return utiles.length ? utiles : todas;
}

/** Cuántas palabras coinciden y con qué peso. null si la joya no entra en los resultados. */
export function puntuarJoya(j, palabras) {
  if (!palabras.length) return { n: 0, puntos: 0 };
  const ix = indice(j);
  let n = 0;
  let puntos = 0;
  palabras.forEach((t) => {
    let mejor = 0;
    ix.forEach((c) => { if (c.peso > mejor && c.palabras.some((p) => coincide(t, p))) mejor = c.peso; });
    if (mejor) { n++; puntos += mejor; }
  });
  const necesarias = palabras.length <= 2 ? palabras.length : Math.ceil(palabras.length / 2);
  return n >= necesarias ? { n, puntos } : null;
}
