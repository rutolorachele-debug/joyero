// Fijados: filtros (combinación de tipos y temas) y joyas que aparecen arriba en Mi joyero.
// Se guardan en la pestaña «Fijados» del Sheet (script v3). El último fijado va primero.

export const SIN_FIJADOS = { filtros: [], joyas: [] };

const ordenado = (a) => (a || []).slice().sort();

export function mismoFiltro(a, b) {
  return JSON.stringify(ordenado(a.tipos)) === JSON.stringify(ordenado(b.tipos))
    && JSON.stringify(ordenado(a.temas)) === JSON.stringify(ordenado(b.temas));
}

/** «podcast · tipografía»: primero los tipos, luego los temas. */
export function nombreFiltro(f) {
  return (f.tipos || []).concat(f.temas || []).join(' · ');
}

/** Lo que se envía al script: { clase: 'joya', id } o { clase: 'filtro', tipos, temas }. */
export function aplicarFijado(fijados, d, poner) {
  const f = fijados || SIN_FIJADOS;
  if (d.clase === 'joya') {
    const sin = f.joyas.filter((x) => x !== d.id);
    return { ...f, joyas: poner ? [d.id].concat(sin) : sin };
  }
  const filtro = { tipos: d.tipos || [], temas: d.temas || [] };
  const sin = f.filtros.filter((x) => !mismoFiltro(x, filtro));
  return { ...f, filtros: poner ? [filtro].concat(sin) : sin };
}

/** Tras renombrar o eliminar una categoría en la web (el script hace lo mismo en el Sheet). */
export function cambiarCategoriaEnFijados(fijados, clase, viejo, nuevo) {
  const f = fijados || SIN_FIJADOS;
  const campo = clase === 'tipo' ? 'tipos' : 'temas';
  const filtros = [];
  f.filtros.forEach((x) => {
    const lista = nuevo ? x[campo].map((n) => (n === viejo ? nuevo : n)) : x[campo].filter((n) => n !== viejo);
    const r = { ...x, [campo]: lista };
    if ((r.tipos.length || r.temas.length) && !filtros.some((y) => mismoFiltro(y, r))) filtros.push(r);
  });
  return { ...f, filtros };
}
