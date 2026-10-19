// Pruebas de las funciones puras del script (se ejecutan con: node --test test/)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = vm.createContext({ console });
for (const f of ['Clasificar.gs', 'Code.gs']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
}
const g = ctx;
const TIPOS = g.TIPOS_BASE.map(t => t[0]);
const TEMAS = g.TEMAS_BASE.slice();

test('normalizar quita acentos y mayúsculas', () => {
  assert.equal(g.normalizar('Tipografía  UI!'), 'tipografia ui');
  assert.equal(g.normalizar('Ilustración'), 'ilustracion');
});

test('normalizarUrl compara sin https, www ni barra final', () => {
  assert.equal(g.normalizarUrl('https://www.Example.com/Ruta/'), 'example.com/Ruta');
  assert.equal(g.normalizarUrl('http://example.com'), 'example.com');
  assert.equal(g.normalizarUrl('https://example.com/a'), g.normalizarUrl('example.com/a/'));
  assert.notEqual(g.normalizarUrl('https://a.com/X'), g.normalizarUrl('https://a.com/x'));
});

test('idDesdeUrl_ solo acepta /exec', () => {
  assert.equal(g.idDesdeUrl_('https://script.google.com/macros/s/AKfycbx-12_ab/exec'), 'AKfycbx-12_ab');
  assert.equal(g.idDesdeUrl_('https://script.google.com/macros/u/1/s/AKfycbQ/exec'), 'AKfycbQ');
  assert.equal(g.idDesdeUrl_('https://script.google.com/macros/s/AKfycbx/dev'), null);
  assert.equal(g.idDesdeUrl_(null), null);
});

test('el código se puede separar aunque el id tenga guiones bajos', () => {
  const codigo = g.componerCodigo_('AKfycb_x_y-z', '0123456789abcdef0123456789abcdef');
  assert.ok(codigo.startsWith('joy_'));
  const resto = codigo.slice(4);
  const corte = resto.lastIndexOf('_');
  assert.equal(resto.slice(0, corte), 'AKfycb_x_y-z');
  assert.equal(resto.slice(corte + 1), '0123456789abcdef0123456789abcdef');
});

test('compararSeguro_', () => {
  assert.equal(g.compararSeguro_('abc', 'abc'), true);
  assert.equal(g.compararSeguro_('abc', 'abd'), false);
  assert.equal(g.compararSeguro_(undefined, 'abc'), false);
});

test('celdaSegura_ evita fórmulas', () => {
  assert.equal(g.celdaSegura_('=HYPERLINK("x")'), '\'=HYPERLINK("x")');
  assert.equal(g.celdaSegura_('Hola'), 'Hola');
  assert.equal(g.celdaSegura_('-5 ideas'), "'-5 ideas");
});

test('nombreCategoria_ rechaza comas y vacíos', () => {
  assert.equal(g.nombreCategoria_('  motion  '), 'motion');
  assert.equal(g.nombreCategoria_('a, b'), '');
  assert.equal(g.nombreCategoria_(''), '');
});

test('parsearMetadatos lee og, entidades y autor', () => {
  const html = `<html><head><meta charset="utf-8">
    <title>Ignorado</title>
    <meta property="og:title" content="Fonts In Use &amp; m&aacute;s">
    <meta name="description" content="Tipografía en uso &#8212; real">
    <meta name="author" content="Stephen Coles">
    <meta property="og:type" content="website">
    </head><body>x</body></html>`;
  const m = g.parsearMetadatos(html);
  assert.equal(m.titulo, 'Fonts In Use & más');
  assert.equal(m.descripcion, 'Tipografía en uso — real');
  assert.equal(m.autor, 'Stephen Coles');
  assert.equal(m.tipoOg, 'website');
});

test('parsearMetadatos usa <title> y descarta páginas de bloqueo', () => {
  assert.equal(g.parsearMetadatos('<head><title>  Laws of UX </title></head>').titulo, 'Laws of UX');
  assert.equal(g.parsearMetadatos('<head><title>Just a moment...</title></head>').titulo, '');
});

test('autor desde JSON-LD y autor-URL ignorado', () => {
  const html = `<head><meta name="author" content="https://x.com/alguien">
  <script type="application/ld+json">{"@graph":[{"@type":"Article","author":{"@type":"Person","name":"Ana Pérez"}}]}</script></head>`;
  assert.equal(g.parsearMetadatos(html).autor, 'Ana Pérez');
});

test('oEmbed para YouTube y Vimeo', () => {
  assert.match(g.urlOembed('https://www.youtube.com/watch?v=abc'), /youtube\.com\/oembed/);
  assert.match(g.urlOembed('https://youtu.be/abc'), /youtube\.com\/oembed/);
  assert.match(g.urlOembed('https://vimeo.com/123'), /vimeo\.com\/api\/oembed/);
  assert.equal(g.urlOembed('https://example.com'), null);
  const m = g.metadatosOembed('{"title":"Charla","author_name":"Canal"}');
  assert.equal(m.titulo, 'Charla');
  assert.equal(m.autor, 'Canal');
});

test('clasificar: tipo por dominio', () => {
  const c = (u, meta) => g.clasificar(u, meta || {}, TIPOS, TEMAS).tipo;
  assert.equal(c('https://www.youtube.com/watch?v=1'), 'vídeo');
  assert.equal(c('https://open.spotify.com/show/abc'), 'podcast');
  assert.equal(c('https://open.spotify.com/track/abc'), '');
  assert.equal(c('https://www.goodreads.com/book/show/1'), 'libro');
  assert.equal(c('https://www.imdb.com/title/tt123/'), 'película');
  assert.equal(c('https://letterboxd.com/film/abstract/'), 'película');
  assert.equal(c('https://www.domestika.org/es/courses/1'), 'curso');
  assert.equal(c('https://www.figma.com/community/plugin/123'), 'herramienta');
  assert.equal(c('https://uxdesign.cc/algo'), 'artículo');
  assert.equal(c('https://ejemplo.com/', { tipoOg: 'article' }), 'artículo');
  assert.equal(c('https://ejemplo.com/', { tipoOg: 'website' }), '');
});

test('clasificar: tipo solo si existe en el joyero', () => {
  assert.equal(g.clasificar('https://youtube.com/watch?v=1', {}, ['libro'], []).tipo, '');
});

test('clasificar: temas por palabras en varios idiomas', () => {
  const t = (meta, u) => Array.from(g.clasificar(u || 'https://ejemplo.com/', meta, TIPOS, TEMAS).temas);
  assert.deepEqual(t({ titulo: 'The best free fonts for UI design' }), ['tipografía', 'UI']);
  assert.deepEqual(t({ titulo: 'Color palette generator' }), ['color']);
  assert.deepEqual(t({ titulo: 'Guida all\'accessibilità' }), ['accesibilidad']);
  assert.deepEqual(t({ titulo: 'Inicio' }, 'https://fonts.google.com/'), ['tipografía']);
  assert.deepEqual(t({ titulo: 'Building' }), []); // "ui" dentro de una palabra no cuenta
});

test('clasificar: temas creados por el usuario por su nombre', () => {
  const r = g.clasificar('https://x.com/', { titulo: 'Diseño de packaging sostenible' }, TIPOS, ['packaging', 'color']);
  assert.deepEqual(Array.from(r.temas), ['packaging']);
});

test('texto_ limpia espacios y recorta', () => {
  assert.equal(g.texto_('  a \n b  ', 10), 'a b');
  assert.equal(g.texto_('línea 1\r\nlínea 2', 50, true), 'línea 1\nlínea 2');
  assert.equal(g.texto_('abcdef', 3), 'abc');
});
