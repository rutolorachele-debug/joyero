// Fijados: filtros (combinación de tipos y temas) y joyas que aparecen arriba en Mi joyero.
import * as almacen from './almacen.js';

const VACIO = { filtros: [], joyas: [] };

export function leerFijados() {
  const v = almacen.leer('fijados', VACIO);
  return { filtros: v.filtros || [], joyas: v.joyas || [] };
}

export function guardarFijados(v) {
  almacen.guardar('fijados', v);
}

const ordenado = (a) => (a || []).slice().sort();

export function mismoFiltro(a, b) {
  return JSON.stringify(ordenado(a.tipos)) === JSON.stringify(ordenado(b.tipos))
    && JSON.stringify(ordenado(a.temas)) === JSON.stringify(ordenado(b.temas));
}

/** «podcast · tipografía»: primero los tipos, luego los temas. */
export function nombreFiltro(f) {
  return (f.tipos || []).concat(f.temas || []).join(' · ');
}
