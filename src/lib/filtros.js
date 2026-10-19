import { normalizar } from './texto.js';

export function porOrganizar(j) {
  return !j.tipo || !j.temas || j.temas.length === 0;
}

export function hayFiltros(f) {
  return !!(f.busqueda.trim() || f.tipos.length || f.temas.length || f.porOrganizar);
}

/**
 * Busca en título, autor, descripción, nota y temas. Cada palabra escrita tiene que aparecer.
 * Tipos y temas elegidos: basta con uno de cada grupo. Los grupos se combinan entre sí y con la búsqueda.
 */
export function filtrar(joyas, f) {
  const palabras = normalizar(f.busqueda).split(' ').filter(Boolean);
  const tipos = new Set(f.tipos);
  const temas = new Set(f.temas);
  return joyas
    .filter((j) => {
      if (f.porOrganizar && !porOrganizar(j)) return false;
      if (tipos.size && !tipos.has(j.tipo)) return false;
      if (temas.size && !(j.temas || []).some((t) => temas.has(t))) return false;
      if (palabras.length) {
        const texto = ' ' + normalizar([j.titulo, j.autor, j.descripcion, j.nota, (j.temas || []).join(' ')].join(' ')) + ' ';
        if (!palabras.every((p) => texto.includes(p))) return false;
      }
      return true;
    })
    .sort(ordenFecha);
}

export function ordenFecha(a, b) {
  const fa = Date.parse(a.fecha) || 0;
  const fb = Date.parse(b.fecha) || 0;
  return fb - fa;
}

export function contar(joyas, clase, nombre) {
  return joyas.filter((j) => (clase === 'tipo' ? j.tipo === nombre : (j.temas || []).includes(nombre))).length;
}
