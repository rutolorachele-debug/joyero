import { palabrasBusqueda, puntuarJoya } from './busqueda.js';

export function porOrganizar(j) {
  return !j.tipo || !j.temas || j.temas.length === 0;
}

export function hayFiltros(f) {
  return !!(f.busqueda.trim() || f.tipos.length || f.temas.length || f.porOrganizar);
}

/**
 * Tipos y temas elegidos: basta con uno de cada grupo. Los grupos se combinan entre sí y con la búsqueda.
 * Sin búsqueda: de la más reciente a la menos reciente. Con búsqueda: primero las que mejor coinciden.
 */
export function filtrar(joyas, f) {
  const palabras = palabrasBusqueda(f.busqueda);
  const tipos = new Set(f.tipos);
  const temas = new Set(f.temas);
  const puntos = new Map();
  const r = joyas.filter((j) => {
    if (f.porOrganizar && !porOrganizar(j)) return false;
    if (tipos.size && !tipos.has(j.tipo)) return false;
    if (temas.size && !(j.temas || []).some((t) => temas.has(t))) return false;
    if (palabras.length) {
      const p = puntuarJoya(j, palabras);
      if (!p) return false;
      puntos.set(j, p);
    }
    return true;
  });
  if (!palabras.length) return r.sort(ordenFecha);
  return r.sort((a, b) => {
    const pa = puntos.get(a), pb = puntos.get(b);
    return (pb.n - pa.n) || (pb.puntos - pa.puntos) || ordenFecha(a, b);
  });
}

export function ordenFecha(a, b) {
  const fa = Date.parse(a.fecha) || 0;
  const fb = Date.parse(b.fecha) || 0;
  return fb - fa;
}

export function contar(joyas, clase, nombre) {
  return joyas.filter((j) => (clase === 'tipo' ? j.tipo === nombre : (j.temas || []).includes(nombre))).length;
}
