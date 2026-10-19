import { normalizar, normalizarUrl, dominio, parecidos, puntuacion } from './texto.js';

export const GENERADOR = 'Joyero 1';

// Carpetas raíz que crean los navegadores. Solo se ignoran en el primer nivel.
const CARPETAS_SISTEMA = new Set([
  'barra de marcadores', 'bookmarks bar', 'barra de favoritos', 'favorites bar', 'favourites bar',
  'otros marcadores', 'other bookmarks', 'marcadores del movil', 'mobile bookmarks',
  'menu de marcadores', 'bookmarks menu', 'barra de herramientas de marcadores', 'bookmarks toolbar',
  'barra dei segnalibri', 'altri segnalibri', 'segnalibri del cellulare', 'menu segnalibri',
  'barra degli strumenti dei segnalibri', 'barra dei preferiti', 'altri preferiti',
  'favoritos', 'favorites', 'favourites', 'bookmarks', 'marcadores', 'segnalibri', 'preferiti',
  'imported', 'importados', 'importati'
].map(normalizar));

function carpetasDe(a) {
  const ruta = [];
  let nodo = a.parentElement;
  while (nodo) {
    if (nodo.tagName === 'DL') {
      let previo = nodo.previousElementSibling;
      while (previo && previo.tagName === 'P') previo = previo.previousElementSibling;
      if (previo && previo.tagName === 'H3') ruta.unshift(previo.textContent.trim());
      else if (previo && previo.tagName === 'DT') {
        const h3 = previo.querySelector(':scope > h3');
        if (h3) ruta.unshift(h3.textContent.trim());
      }
    }
    nodo = nodo.parentElement;
  }
  if (ruta.length && CARPETAS_SISTEMA.has(normalizar(ruta[0]))) ruta.shift();
  return ruta.filter(Boolean);
}

function textoConSaltos(el) {
  const copia = el.cloneNode(true);
  copia.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  return copia.textContent.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();
}

function notaDe(a) {
  // <DT><A …>Título</A><DD>Nota  →  el DD suele quedar justo después del DT.
  const dt = a.closest('dt');
  const s = dt ? dt.nextElementSibling : a.nextElementSibling;
  if (s && s.tagName === 'DD') return textoConSaltos(s);
  const dentro = dt && dt.querySelector(':scope > dd');
  return dentro ? textoConSaltos(dentro) : '';
}

function fechaDe(segundos) {
  const n = parseInt(segundos, 10);
  if (!n || n < 0) return '';
  // Algunos navegadores guardan microsegundos o milisegundos.
  const ms = n > 1e14 ? n / 1000 : n > 1e11 ? n : n * 1000;
  const d = new Date(ms);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

/**
 * Lee un archivo HTML de favoritos (Netscape). Devuelve { esJoyero, items } o null si no hay links.
 * items: { url, titulo, carpetas[], fecha, autor, tipo, temas[], nota, descripcion }
 */
export function leerFavoritos(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const gen = doc.querySelector('meta[name="generator" i]');
  const esJoyero = !!(gen && /^joyero\b/i.test(gen.getAttribute('content') || ''));
  const vistos = new Set();
  const items = [];
  doc.querySelectorAll('a[href]').forEach((a) => {
    const url = (a.getAttribute('href') || '').trim();
    if (!/^https?:\/\//i.test(url)) return; // javascript:, place:, chrome://…
    const clave = normalizarUrl(url);
    if (vistos.has(clave)) return; // repetido dentro del mismo archivo
    vistos.add(clave);
    const item = {
      url: url.slice(0, 2000),
      titulo: a.textContent.replace(/\s+/g, ' ').trim(),
      carpetas: esJoyero ? [] : carpetasDe(a),
      fecha: fechaDe(a.getAttribute('add_date')),
      autor: '', tipo: '', temas: [], nota: '', descripcion: ''
    };
    if (esJoyero) {
      item.autor = a.getAttribute('data-joyero-autor') || '';
      item.tipo = a.getAttribute('data-joyero-tipo') || '';
      item.descripcion = a.getAttribute('data-joyero-descripcion') || '';
      item.temas = (a.getAttribute('tags') || '').split(',').map((t) => t.trim()).filter(Boolean);
      item.nota = notaDe(a);
    }
    items.push(item);
  });
  return items.length ? { esJoyero, items } : null;
}

/**
 * Relaciona cada carpeta con un tema existente parecido. Las que no se parecen a ninguno
 * se devuelven como sugerencias (con el número de joyas que contienen).
 */
export function temasDeCarpetas(items, temasExistentes) {
  const mapa = new Map(); // carpeta normalizada -> tema existente o null
  const sugeridos = new Map(); // nombre -> nº de joyas
  for (const it of items) {
    const temas = new Set();
    const nuevas = new Set();
    for (const carpeta of it.carpetas) {
      const k = normalizar(carpeta);
      if (!mapa.has(k)) {
        const candidatos = temasExistentes.filter((t) => parecidos(carpeta, t))
          .sort((a, b) => puntuacion(carpeta, a) - puntuacion(carpeta, b));
        mapa.set(k, candidatos[0] || null);
      }
      const tema = mapa.get(k);
      if (tema) temas.add(tema);
      else if (!carpeta.includes(',')) nuevas.add(carpeta.slice(0, 60));
    }
    it.temasCarpeta = [...temas];
    it.carpetasNuevas = [...nuevas];
    nuevas.forEach((n) => sugeridos.set(n, (sugeridos.get(n) || 0) + 1));
  }
  return [...sugeridos.entries()].map(([nombre, n]) => ({ nombre, n }));
}

export function descripcionItem(it) {
  return dominio(it.url);
}

/* ───────────── Descarga ───────────── */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Archivo HTML de favoritos estándar: carpeta «Joyero» con una subcarpeta por tipo
 * y «Por organizar» para las joyas sin tipo. Los datos de Joyero van en atributos que los navegadores ignoran.
 */
export function crearArchivoFavoritos(joyas, nombrePorOrganizar) {
  const ahora = Math.floor(Date.now() / 1000);
  const grupos = new Map();
  for (const j of joyas) {
    const g = j.tipo || nombrePorOrganizar;
    if (!grupos.has(g)) grupos.set(g, []);
    grupos.get(g).push(j);
  }
  const nombres = [...grupos.keys()].sort((a, b) => {
    if (a === nombrePorOrganizar) return 1;
    if (b === nombrePorOrganizar) return -1;
    return a.localeCompare(b, 'es');
  });
  const lineas = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<!-- This is an automatically generated file. -->',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    `<META NAME="generator" CONTENT="${GENERADOR}">`,
    '<TITLE>Joyero</TITLE>',
    '<H1>Joyero</H1>',
    '<DL><p>',
    `    <DT><H3 ADD_DATE="${ahora}" LAST_MODIFIED="${ahora}">Joyero</H3>`,
    '    <DL><p>'
  ];
  for (const g of nombres) {
    lineas.push(`        <DT><H3 ADD_DATE="${ahora}" LAST_MODIFIED="${ahora}">${esc(g)}</H3>`);
    lineas.push('        <DL><p>');
    for (const j of grupos.get(g)) {
      const fecha = Math.floor((Date.parse(j.fecha) || Date.now()) / 1000);
      const at = [`HREF="${esc(j.url)}"`, `ADD_DATE="${fecha}"`];
      if (j.temas && j.temas.length) at.push(`TAGS="${esc(j.temas.join(','))}"`);
      if (j.tipo) at.push(`DATA-JOYERO-TIPO="${esc(j.tipo)}"`);
      if (j.autor) at.push(`DATA-JOYERO-AUTOR="${esc(j.autor)}"`);
      if (j.descripcion) at.push(`DATA-JOYERO-DESCRIPCION="${esc(j.descripcion)}"`);
      lineas.push(`            <DT><A ${at.join(' ')}>${esc(j.titulo)}</A>`);
      if (j.nota) lineas.push(`            <DD>${esc(j.nota).replace(/\r?\n/g, '<BR>')}`);
    }
    lineas.push('        </DL><p>');
  }
  lineas.push('    </DL><p>', '</DL><p>', '');
  return lineas.join('\n');
}

export function nombreArchivo(fecha = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `joyero-${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}.html`;
}

export function descargarTexto(texto, nombre) {
  const blob = new Blob([texto], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
