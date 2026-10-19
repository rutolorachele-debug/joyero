/**
 * Joyero · funciones puras (sin servicios de Google), probadas también fuera de Apps Script.
 * Metadatos de páginas, normalización y clasificación automática de tipo y temas.
 */

/** minúsculas, sin acentos, solo letras y números separados por un espacio. */
function normalizar(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Para detectar duplicados: sin protocolo, sin "www.", sin "/" final; dominio en minúsculas. */
function normalizarUrl(u) {
  var s = String(u || '').trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  var barra = s.indexOf('/');
  var host = barra < 0 ? s : s.slice(0, barra);
  var resto = barra < 0 ? '' : s.slice(barra);
  return (host.toLowerCase() + resto).replace(/\/+$/, '');
}

function hostDe(u) {
  var m = String(u || '').match(/^https?:\/\/([^\/?#:]+)/i);
  return m ? m[1].toLowerCase().replace(/^www\./, '') : '';
}

/* ───────────── Metadatos ───────────── */

var ENTIDADES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—',
  laquo: '«', raquo: '»', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', middot: '·', copy: '©',
  reg: '®', trade: '™', euro: '€', iexcl: '¡', iquest: '¿',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', uuml: 'ü',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', Uuml: 'Ü',
  agrave: 'à', egrave: 'è', igrave: 'ì', ograve: 'ò', ugrave: 'ù', ccedil: 'ç', ouml: 'ö', auml: 'ä'
};

function decodificarEntidades(s) {
  return String(s || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, function (todo, e) {
    if (e[0] === '#') {
      var n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return isNaN(n) ? todo : String.fromCodePoint(n); } catch (err) { return todo; }
    }
    return Object.prototype.hasOwnProperty.call(ENTIDADES, e) ? ENTIDADES[e] : todo;
  });
}

function limpiarTexto(s) {
  return decodificarEntidades(String(s || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

// Páginas de bloqueo o error que no deben usarse como título.
var TITULOS_INVALIDOS = /^(just a moment|attention required|access denied|forbidden|not found|404|403|error|un momento|página no encontrada|cloudflare|captcha|robot check|are you a robot)/i;

function esUrl(s) { return /^(https?:)?\/\//i.test(String(s || '').trim()); }

/** Extrae título, descripción, autor y og:type de un HTML. */
function parsearMetadatos(html) {
  html = String(html || '').slice(0, 400000);
  var cierre = html.search(/<\/head>/i);
  var cabeza = cierre > 0 ? html.slice(0, cierre) : html.slice(0, 150000);

  var meta = {};
  (cabeza.match(/<meta\b[^>]*>/gi) || []).forEach(function (etiqueta) {
    var at = atributos(etiqueta);
    var clave = (at.property || at.name || at.itemprop || '').toLowerCase();
    if (clave && at.content !== undefined && meta[clave] === undefined) meta[clave] = limpiarTexto(at.content);
  });

  var tituloEtiqueta = (cabeza.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
  var titulo = meta['og:title'] || meta['twitter:title'] || limpiarTexto(tituloEtiqueta);
  if (TITULOS_INVALIDOS.test(titulo || '')) titulo = '';

  var descripcion = meta['og:description'] || meta['description'] || meta['twitter:description'] || '';

  var autor = '';
  ['author', 'article:author', 'book:author', 'parsely-author', 'sailthru.author', 'dc.creator'].some(function (k) {
    if (meta[k] && !esUrl(meta[k])) { autor = meta[k]; return true; }
    return false;
  });
  if (!autor) autor = autorJsonLd(html);

  return {
    titulo: titulo || '',
    descripcion: descripcion,
    autor: autor,
    tipoOg: (meta['og:type'] || '').toLowerCase()
  };
}

function atributos(etiqueta) {
  var r = {};
  var re = /([a-zA-Z:_.-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g, m;
  while ((m = re.exec(etiqueta))) {
    r[m[1].toLowerCase()] = m[3] !== undefined ? m[3] : (m[4] !== undefined ? m[4] : m[5]);
  }
  return r;
}

function autorJsonLd(html) {
  var bloques = String(html).match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (var i = 0; i < bloques.length; i++) {
    var cuerpo = bloques[i].replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
    var datos;
    try { datos = JSON.parse(cuerpo); } catch (e) { continue; }
    var nombre = buscarAutor(datos, 0);
    if (nombre) return nombre;
  }
  return '';
}

function buscarAutor(o, nivel) {
  if (!o || typeof o !== 'object' || nivel > 4) return '';
  if (Array.isArray(o)) {
    for (var i = 0; i < o.length; i++) { var r = buscarAutor(o[i], nivel + 1); if (r) return r; }
    return '';
  }
  var a = o.author || o.creator || o.director;
  if (a) {
    var lista = Array.isArray(a) ? a : [a];
    var nombres = lista.map(function (x) { return typeof x === 'string' ? x : (x && x.name) || ''; })
      .map(limpiarTexto).filter(function (x) { return x && !esUrl(x); });
    if (nombres.length) return nombres.slice(0, 3).join(', ');
  }
  if (o['@graph']) return buscarAutor(o['@graph'], nivel + 1);
  return '';
}

/** YouTube y Vimeo dan mejores datos por oEmbed que por su HTML. */
function urlOembed(u) {
  var host = hostDe(u);
  if (/(^|\.)youtube\.com$|^youtu\.be$/.test(host)) {
    return 'https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(u);
  }
  if (/(^|\.)vimeo\.com$/.test(host)) {
    return 'https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(u);
  }
  return null;
}

function metadatosOembed(texto) {
  var d = JSON.parse(texto);
  return {
    titulo: limpiarTexto(d.title),
    descripcion: limpiarTexto(d.description || ''),
    autor: limpiarTexto(d.author_name || ''),
    tipoOg: 'video'
  };
}

/* ───────────── Clasificación ───────────── */

var REGLAS_TIPO = [
  ['vídeo', /(^|\.)(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|tiktok\.com|twitch\.tv)$/, null],
  ['podcast', /(^|\.)(podcasts\.apple\.com|ivoox\.com|overcast\.fm|pocketcasts\.com|podcasts\.google\.com)$/, null],
  ['podcast', /^open\.spotify\.com$/, /^\/(intl-[a-z-]+\/)?(show|episode)\//],
  ['libro', /(^|\.)(goodreads\.com|openlibrary\.org|casadellibro\.com|todostuslibros\.com|lafeltrinelli\.it)$/, null],
  ['libro', /^books\.google\./, null],
  ['película', /(^|\.)(letterboxd\.com|filmaffinity\.com)$/, /\/(film|es\/film|en\/film)/],
  ['película', /(^|\.)imdb\.com$/, /^\/([a-z]{2}(-[a-z]{2})?\/)?title\//],
  ['película', /(^|\.)themoviedb\.org$/, /^\/movie\//],
  ['artículo', /(^|\.)(medium\.com|substack\.com|dev\.to|smashingmagazine\.com|uxdesign\.cc|alistapart\.com)$/, null],
  ['curso', /(^|\.)(coursera\.org|domestika\.org|udemy\.com|skillshare\.com|edx\.org|platzi\.com|crehana\.com|interaction-design\.org)$/, null],
  ['curso', /(^|\.)linkedin\.com$/, /^\/learning\//],
  ['herramienta', /(^|\.)(chromewebstore\.google\.com)$/, null],
  ['herramienta', /^chrome\.google\.com$/, /^\/webstore\//],
  ['herramienta', /(^|\.)figma\.com$/, /^\/community\/(plugin|widget)\//]
];

var REGLAS_OG = [
  ['película', /^video\.movie/],
  ['vídeo', /^video/],
  ['libro', /^book/],
  ['artículo', /^article/]
];

// Palabras (en español, inglés e italiano) que llevan a cada tema base.
var PALABRAS_TEMAS = {
  'tipografia': ['tipografia', 'tipografias', 'typography', 'typographic', 'typeface', 'typefaces',
    'font', 'fonts', 'lettering', 'tipografico', 'tipografica', 'caratteri tipografici'],
  'color': ['color', 'colors', 'colour', 'colours', 'colores', 'colore', 'colori', 'palette', 'palettes', 'paleta', 'paletas'],
  'ui': ['ui', 'user interface', 'user interfaces', 'interfaz', 'interfaces', 'interface',
    'interfaccia', 'design system', 'design systems', 'sistema de diseno'],
  'motion': ['motion', 'animation', 'animations', 'animacion', 'animaciones', 'animazione', 'lottie', 'after effects'],
  'ilustracion': ['ilustracion', 'ilustraciones', 'illustration', 'illustrations', 'illustrazione', 'illustrazioni'],
  'branding': ['branding', 'brand identity', 'visual identity', 'identidad visual', 'identidad corporativa',
    'identita visiva', 'logo', 'logos', 'logotipo', 'logotipos'],
  'accesibilidad': ['accesibilidad', 'accessibility', 'accessibilita', 'a11y', 'wcag', 'accesible', 'accessible'],
  'portfolio': ['portfolio', 'portfolios', 'portafolio', 'portafolios'],
  'tutorial': ['tutorial', 'tutoriales', 'tutorials', 'how to', 'como hacer', 'step by step', 'paso a paso'],
  'inspiracion': ['inspiracion', 'inspiration', 'ispirazione', 'moodboard', 'moodboards', 'showcase'],
  'herramientas': ['herramienta', 'herramientas', 'tool', 'tools', 'strumento', 'strumenti', 'plugin', 'plugins']
};

/**
 * Sugiere tipo y temas para una joya. Solo devuelve categorías que existen en el joyero.
 * meta: { titulo, descripcion, tipoOg }
 */
function clasificar(url, meta, tiposExistentes, temasExistentes) {
  meta = meta || {};
  var host = hostDe(url);
  var ruta = (String(url).match(/^https?:\/\/[^\/?#]+([^?#]*)/i) || [])[1] || '/';

  var tipoBase = '';
  for (var i = 0; i < REGLAS_TIPO.length && !tipoBase; i++) {
    var r = REGLAS_TIPO[i];
    if (r[1].test(host) && (!r[2] || r[2].test(ruta))) tipoBase = r[0];
  }
  for (var k = 0; k < REGLAS_OG.length && !tipoBase; k++) {
    if (meta.tipoOg && REGLAS_OG[k][1].test(meta.tipoOg)) tipoBase = REGLAS_OG[k][0];
  }
  var tipo = '';
  if (tipoBase) {
    (tiposExistentes || []).some(function (t) {
      if (normalizar(t) === normalizar(tipoBase)) { tipo = t; return true; }
      return false;
    });
  }

  var texto = ' ' + normalizar([meta.titulo, meta.descripcion, host, ruta].join(' ')) + ' ';
  var temas = [];
  (temasExistentes || []).forEach(function (t) {
    var n = normalizar(t);
    if (!n) return;
    var palabras = (PALABRAS_TEMAS[n] || []).concat([n]);
    var encontrado = palabras.some(function (p) { return texto.indexOf(' ' + normalizar(p) + ' ') >= 0; });
    if (encontrado) temas.push(t);
  });

  return { tipo: tipo, temas: temas };
}
