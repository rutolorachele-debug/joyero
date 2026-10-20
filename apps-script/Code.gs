/**
 * Joyero · backend
 * Google Apps Script vinculado a la hoja "Joyero" y publicado como aplicación web.
 * Todo el acceso pasa por aquí y exige la clave secreta del código de acceso.
 */

var JOYERO_VERSION = 3;

var HOJA_JOYAS = 'Joyas';
var HOJA_TIPOS = 'Tipos';
var HOJA_TEMAS = 'Temas';
var HOJA_FIJADOS = 'Fijados';
var COLS_JOYAS = ['id', 'url', 'titulo', 'autor', 'descripcion', 'tipo', 'temas', 'nota', 'fecha'];
var COLS_TIPOS = ['nombre', 'icono'];
var COLS_TEMAS = ['nombre'];
// clase: «joya» (columna joya = id) o «filtro» (columnas tipos y temas, separados por coma).
var COLS_FIJADOS = ['clase', 'joya', 'tipos', 'temas', 'fecha'];

// Iconos Lucide (nombre del icono). "gem" es la icona genérica.
var ICONO_GENERICO = 'gem';
var TIPOS_BASE = [
  ['sitio web', 'globe'],
  ['artículo', 'file-text'],
  ['vídeo', 'play'],
  ['película', 'film'],
  ['podcast', 'mic'],
  ['libro', 'book-open'],
  ['herramienta', 'wrench'],
  ['curso', 'graduation-cap'],
  ['otro', 'gem']
];
var TEMAS_BASE = ['tipografía', 'color', 'UI', 'motion', 'ilustración', 'branding',
  'accesibilidad', 'portfolio', 'tutorial', 'inspiración', 'herramientas'];

// Textos visibles en Google Sheets (menú y ventana del código).
var TEXTOS = {
  menu: 'Joyero',
  menuCodigo: 'Mostrar mi código',
  tituloVentana: 'Mi código de acceso'
};

var LIMITES = { url: 2000, titulo: 300, autor: 200, descripcion: 1000, nota: 5000, nombre: 60 };
var LOTE_MAX = 25;

/* ───────────────────────── Menú y código ───────────────────────── */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(TEXTOS.menu)
    .addItem(TEXTOS.menuCodigo, 'mostrarMiCodigo')
    .addToUi();
}

function mostrarMiCodigo() {
  var plantilla = HtmlService.createTemplateFromFile('Codigo');
  plantilla.codigo = codigoDeAcceso_() || '';
  var html = plantilla.evaluate().setWidth(440).setHeight(320);
  SpreadsheetApp.getUi().showModalDialog(html, TEXTOS.tituloVentana);
}

/**
 * Llamada desde la ventana «Mostrar mi código» con la URL de la aplicación web (/exec).
 * Antes de guardarla comprueba que responde de verdad con la clave de este joyero.
 */
function guardarUrlAplicacion(url) {
  var id = idDesdeUrl_(url);
  if (!id) return { ok: false };
  var clave = obtenerClave_();
  try {
    var r = UrlFetchApp.fetch('https://script.google.com/macros/s/' + id + '/exec?clave=' + clave,
      { muteHttpExceptions: true, followRedirects: true });
    var json = JSON.parse(r.getContentText());
    if (!json || json.ok !== true) return { ok: false };
  } catch (e) {
    return { ok: false };
  }
  var props = PropertiesService.getScriptProperties();
  props.setProperties({ JOYERO_IMPL: id, JOYERO_IMPL_HOJA: idHoja_() });
  return { ok: true, codigo: componerCodigo_(id, clave) };
}

function codigoDeAcceso_() {
  var id = idImplementacion_();
  if (!id) return null;
  return componerCodigo_(id, obtenerClave_());
}

function componerCodigo_(idImpl, clave) {
  return 'joy_' + idImpl + '_' + clave;
}

/**
 * Solo se usa la URL que la persona pegó y que se comprobó.
 * (ScriptApp.getService().getUrl() devuelve la implementación de prueba, que no sirve para la web.)
 */
function idImplementacion_() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('JOYERO_IMPL_HOJA') === idHoja_()) return props.getProperty('JOYERO_IMPL');
  return null;
}

/** Solo acepta URLs de aplicación web publicadas (/exec), nunca las de prueba (/dev). */
function idDesdeUrl_(url) {
  if (!url) return null;
  var m = String(url).match(/\/macros\/(?:u\/\d+\/)?s\/([A-Za-z0-9_-]+)\/exec/);
  return m ? m[1] : null;
}

function idHoja_() {
  return SpreadsheetApp.getActiveSpreadsheet().getId();
}

/**
 * La clave va ligada a esta hoja: si la hoja es una copia (otro id),
 * se genera una clave nueva y la de la plantilla deja de valer.
 */
function obtenerClave_() {
  var props = PropertiesService.getScriptProperties();
  var hoja = idHoja_();
  var clave = props.getProperty('JOYERO_CLAVE');
  if (clave && props.getProperty('JOYERO_HOJA') === hoja) return clave;
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    clave = props.getProperty('JOYERO_CLAVE');
    if (!clave || props.getProperty('JOYERO_HOJA') !== hoja) {
      clave = Utilities.getUuid().replace(/-/g, '');
      props.setProperties({ JOYERO_CLAVE: clave, JOYERO_HOJA: hoja });
    }
    return clave;
  } finally {
    lock.releaseLock();
  }
}

function claveCorrecta_(recibida) {
  var props = PropertiesService.getScriptProperties();
  var clave = props.getProperty('JOYERO_CLAVE');
  if (!clave || props.getProperty('JOYERO_HOJA') !== idHoja_()) return false;
  return compararSeguro_(recibida, clave);
}

function compararSeguro_(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  var d = 0;
  for (var i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/* ───────────────────────── Aplicación web ───────────────────────── */

function doPost(e) {
  var peticion;
  try {
    peticion = JSON.parse(e && e.postData ? e.postData.contents : '{}');
  } catch (err) {
    return json_({ ok: false, error: 'datos' });
  }
  return json_(atender_(peticion));
}

/** Solo para comprobar desde el navegador: ?clave=...  */
function doGet(e) {
  var p = (e && e.parameter) || {};
  return json_(atender_({ clave: p.clave, accion: 'ping' }));
}

function atender_(p) {
  try {
    if (!p || !claveCorrecta_(p.clave)) return { ok: false, error: 'clave' };
    var d = p.datos || {};
    switch (p.accion) {
      case 'ping': return { ok: true, version: JOYERO_VERSION };
      case 'leer': return leer_();
      case 'metadatos': return metadatos_(d.url);
      case 'guardar': return conBloqueo_(function () { return guardar_(d.joya, d.forzar); });
      case 'eliminar': return conBloqueo_(function () { return eliminar_(d.id); });
      case 'crearCategoria': return conBloqueo_(function () { return crearCategoria_(d.clase, d.nombre, d.icono); });
      case 'renombrarCategoria': return conBloqueo_(function () { return renombrarCategoria_(d.clase, d.nombre, d.nuevo); });
      case 'cambiarIcono': return conBloqueo_(function () { return cambiarIcono_(d.nombre, d.icono); });
      case 'eliminarCategoria': return conBloqueo_(function () { return eliminarCategoria_(d.clase, d.nombre); });
      case 'importar': return importar_(d.joyas);
      case 'fijar': return conBloqueo_(function () { return fijar_(d, true); });
      case 'desfijar': return conBloqueo_(function () { return fijar_(d, false); });
      case 'vaciar': return conBloqueo_(function () { return vaciar_(); });
      default: return { ok: false, error: 'accion' };
    }
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return { ok: false, error: err && err.joyero ? err.joyero : 'interno' };
  }
}

function conBloqueo_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return { ok: false, error: 'ocupado' };
  try {
    var r = fn();
    SpreadsheetApp.flush();
    return r;
  } finally {
    lock.releaseLock();
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function fallo_(codigo) {
  var e = new Error(codigo);
  e.joyero = codigo;
  return e;
}

/* ───────────────────────── Lectura ───────────────────────── */

function hoja_(nombre) {
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);
  if (!h) throw fallo_('hoja');
  return h;
}

function filas_(nombreHoja, numCols) {
  var h = hoja_(nombreHoja);
  var ultima = h.getLastRow();
  if (ultima < 2) return [];
  return h.getRange(2, 1, ultima - 1, numCols).getDisplayValues();
}

function leerJoyas_() {
  return filas_(HOJA_JOYAS, COLS_JOYAS.length)
    .filter(function (f) { return f[0] !== ''; })
    .map(filaAJoya_);
}

function filaAJoya_(f) {
  return {
    id: f[0], url: f[1], titulo: f[2], autor: f[3], descripcion: f[4],
    tipo: f[5], temas: separarTemas_(f[6]), nota: f[7], fecha: f[8]
  };
}

function joyaAFila_(j) {
  return [j.id, j.url, j.titulo, j.autor, j.descripcion, j.tipo, j.temas.join(', '), j.nota, j.fecha].map(celdaSegura_);
}

function leerTipos_() {
  return filas_(HOJA_TIPOS, COLS_TIPOS.length)
    .filter(function (f) { return f[0] !== ''; })
    .map(function (f) { return { nombre: f[0], icono: f[1] || ICONO_GENERICO }; });
}

function leerTemas_() {
  return filas_(HOJA_TEMAS, COLS_TEMAS.length)
    .map(function (f) { return f[0]; })
    .filter(function (n) { return n !== ''; });
}

function leer_() {
  return { ok: true, joyas: leerJoyas_(), tipos: leerTipos_(), temas: leerTemas_(), fijados: leerFijados_() };
}

/* ───────────────────────── Joyas ───────────────────────── */

function limpiarJoya_(j, permitirSinTitulo) {
  if (!j || typeof j !== 'object') throw fallo_('datos');
  var url = texto_(j.url, LIMITES.url);
  var titulo = texto_(j.titulo, LIMITES.titulo);
  if (!/^https?:\/\/\S+$/i.test(url) || (!titulo && !permitirSinTitulo)) throw fallo_('datos');
  var temas = [];
  (Array.isArray(j.temas) ? j.temas : []).forEach(function (t) {
    var n = nombreCategoria_(t);
    if (n && !contieneNombre_(temas, n)) temas.push(n);
  });
  return {
    id: j.id ? String(j.id) : '',
    url: url,
    titulo: titulo,
    autor: texto_(j.autor, LIMITES.autor),
    descripcion: texto_(j.descripcion, LIMITES.descripcion),
    tipo: j.tipo ? nombreCategoria_(j.tipo) : '',
    temas: temas,
    nota: texto_(j.nota, LIMITES.nota, true),
    fecha: fechaValida_(j.fecha) || new Date().toISOString()
  };
}

function guardar_(entrada, forzar) {
  var j = limpiarJoya_(entrada);
  var h = hoja_(HOJA_JOYAS);
  var filas = filas_(HOJA_JOYAS, COLS_JOYAS.length);

  if (j.id) {
    asegurarCategorias_(j.tipo ? [j.tipo] : [], j.temas);
    for (var i = 0; i < filas.length; i++) {
      if (filas[i][0] === j.id) {
        j.fecha = filas[i][8] || j.fecha; // la fecha de creación no cambia
        h.getRange(i + 2, 1, 1, COLS_JOYAS.length).setValues([joyaAFila_(j)]);
        return { ok: true, joya: j };
      }
    }
    throw fallo_('no_encontrada');
  }

  // idNuevo: id creado por la web. Si la misma petición llega dos veces (p. ej. se cortó
  // la conexión antes de recibir la respuesta), la segunda no crea otra fila.
  var idNuevo = idValido_(entrada.idNuevo);
  if (idNuevo) {
    for (var n = 0; n < filas.length; n++) {
      if (filas[n][0] === idNuevo) return { ok: true, joya: filaAJoya_(filas[n]) };
    }
  }

  if (!forzar) {
    var clave = normalizarUrl(j.url);
    for (var k = 0; k < filas.length; k++) {
      if (filas[k][0] && normalizarUrl(filas[k][1]) === clave) {
        return { ok: false, error: 'duplicado', titulo: filas[k][2] };
      }
    }
  }
  asegurarCategorias_(j.tipo ? [j.tipo] : [], j.temas);
  j.id = idNuevo || Utilities.getUuid();
  j.fecha = new Date().toISOString();
  escribirFilasNuevas_(h, [joyaAFila_(j)]);
  return { ok: true, joya: j };
}

/** Añade filas al final; si la hoja se queda corta, crea filas nuevas con el mismo formato (texto). */
function escribirFilasNuevas_(h, valores) {
  var desde = h.getLastRow() + 1;
  var faltan = desde + valores.length - 1 - h.getMaxRows();
  if (faltan > 0) h.insertRowsAfter(h.getMaxRows(), faltan + 100);
  h.getRange(desde, 1, valores.length, valores[0].length).setNumberFormat('@').setValues(valores);
}

function eliminar_(id) {
  if (!id) throw fallo_('datos');
  var h = hoja_(HOJA_JOYAS);
  var filas = filas_(HOJA_JOYAS, 1);
  for (var i = 0; i < filas.length; i++) {
    if (filas[i][0] === String(id)) {
      h.deleteRow(i + 2);
      break;
    }
  }
  reescribirFijados_(function (f) { return f.clase === 'joya' && f.joya === String(id) ? null : f; });
  return { ok: true }; // si ya no existía, el resultado es el mismo
}

/* ───────────────────────── Categorías ───────────────────────── */

function asegurarCategorias_(tipos, temas) {
  var tiposExistentes = leerTipos_().map(function (t) { return t.nombre; });
  var temasExistentes = leerTemas_();
  tipos.forEach(function (n) {
    if (n && !contieneNombre_(tiposExistentes, n)) {
      hoja_(HOJA_TIPOS).appendRow([celdaSegura_(n), ICONO_GENERICO]);
      tiposExistentes.push(n);
    }
  });
  temas.forEach(function (n) {
    if (n && !contieneNombre_(temasExistentes, n)) {
      hoja_(HOJA_TEMAS).appendRow([celdaSegura_(n)]);
      temasExistentes.push(n);
    }
  });
}

function crearCategoria_(clase, nombre, icono) {
  var n = nombreCategoria_(nombre);
  if (!n) throw fallo_('datos');
  if (clase === 'tipo') {
    if (contieneNombre_(leerTipos_().map(function (t) { return t.nombre; }), n)) throw fallo_('existe');
    hoja_(HOJA_TIPOS).appendRow([celdaSegura_(n), iconoValido_(icono)]);
  } else if (clase === 'tema') {
    if (contieneNombre_(leerTemas_(), n)) throw fallo_('existe');
    hoja_(HOJA_TEMAS).appendRow([celdaSegura_(n)]);
  } else {
    throw fallo_('datos');
  }
  return { ok: true, nombre: n };
}

function renombrarCategoria_(clase, nombre, nuevo) {
  var viejo = String(nombre || '');
  var n = nombreCategoria_(nuevo);
  if (!viejo || !n || (clase !== 'tipo' && clase !== 'tema')) throw fallo_('datos');
  var hojaCat = hoja_(clase === 'tipo' ? HOJA_TIPOS : HOJA_TEMAS);
  var nombres = filas_(clase === 'tipo' ? HOJA_TIPOS : HOJA_TEMAS, 1).map(function (f) { return f[0]; });
  var fila = nombres.indexOf(viejo);
  if (fila < 0) throw fallo_('no_encontrada');
  var otros = nombres.filter(function (x, i) { return i !== fila; });
  if (contieneNombre_(otros, n)) throw fallo_('existe');

  hojaCat.getRange(fila + 2, 1).setValue(celdaSegura_(n));
  reescribirJoyas_(function (j) {
    if (clase === 'tipo') {
      if (j.tipo !== viejo) return false;
      j.tipo = n;
      return true;
    }
    var i = j.temas.indexOf(viejo);
    if (i < 0) return false;
    j.temas[i] = n;
    return true;
  });
  reescribirFijados_(function (f) {
    if (f.clase !== 'filtro') return f;
    var lista = clase === 'tipo' ? f.tipos : f.temas;
    var i = lista.indexOf(viejo);
    if (i >= 0) lista[i] = n;
    return f;
  });
  return { ok: true, nombre: n };
}

function cambiarIcono_(nombre, icono) {
  var nombres = filas_(HOJA_TIPOS, 1).map(function (f) { return f[0]; });
  var fila = nombres.indexOf(String(nombre || ''));
  if (fila < 0) throw fallo_('no_encontrada');
  hoja_(HOJA_TIPOS).getRange(fila + 2, 2).setValue(iconoValido_(icono));
  return { ok: true };
}

function eliminarCategoria_(clase, nombre) {
  if (clase !== 'tipo' && clase !== 'tema') throw fallo_('datos');
  var nombreHoja = clase === 'tipo' ? HOJA_TIPOS : HOJA_TEMAS;
  var viejo = String(nombre || '');
  var nombres = filas_(nombreHoja, 1).map(function (f) { return f[0]; });
  var fila = nombres.indexOf(viejo);
  if (fila >= 0) hoja_(nombreHoja).deleteRow(fila + 2);
  reescribirJoyas_(function (j) {
    if (clase === 'tipo') {
      if (j.tipo !== viejo) return false;
      j.tipo = '';
      return true;
    }
    var i = j.temas.indexOf(viejo);
    if (i < 0) return false;
    j.temas.splice(i, 1);
    return true;
  });
  reescribirFijados_(function (f) {
    if (f.clase !== 'filtro') return f;
    var lista = clase === 'tipo' ? f.tipos : f.temas;
    var i = lista.indexOf(viejo);
    if (i >= 0) lista.splice(i, 1);
    return f.tipos.length || f.temas.length ? f : null; // un filtro vacío deja de existir
  });
  return { ok: true };
}

/** Aplica un cambio a todas las joyas y escribe solo la columna afectada. */
function reescribirJoyas_(cambiar) {
  var h = hoja_(HOJA_JOYAS);
  var filas = filas_(HOJA_JOYAS, COLS_JOYAS.length);
  if (!filas.length) return;
  var tipos = [], temas = [], cambio = false;
  filas.forEach(function (f) {
    var j = filaAJoya_(f);
    if (f[0] && cambiar(j)) cambio = true;
    tipos.push([celdaSegura_(j.tipo)]);
    temas.push([celdaSegura_(j.temas.join(', '))]);
  });
  if (!cambio) return;
  h.getRange(2, 6, filas.length, 1).setValues(tipos);
  h.getRange(2, 7, filas.length, 1).setValues(temas);
}

/* ───────────────────────── Fijados ───────────────────────── */

/** La pestaña «Fijados» se crea sola la primera vez (los joyeros anteriores a la versión 3 no la tienen). */
function hojaFijados_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var h = ss.getSheetByName(HOJA_FIJADOS);
  if (h) return h;
  preparar_(ss, HOJA_FIJADOS, COLS_FIJADOS, [], [100, 280, 220, 260, 200]);
  return ss.getSheetByName(HOJA_FIJADOS);
}

function leerFilasFijados_() {
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_FIJADOS);
  if (!h || h.getLastRow() < 2) return [];
  return h.getRange(2, 1, h.getLastRow() - 1, COLS_FIJADOS.length).getDisplayValues()
    .filter(function (f) { return f[0] === 'joya' || f[0] === 'filtro'; })
    .map(function (f) {
      return { clase: f[0], joya: f[1], tipos: separarTemas_(f[2]), temas: separarTemas_(f[3]), fecha: f[4] };
    });
}

/** Para la web: el último fijado primero. */
function leerFijados_() {
  var filas = leerFilasFijados_().sort(function (a, b) { return (Date.parse(b.fecha) || 0) - (Date.parse(a.fecha) || 0); });
  return {
    filtros: filas.filter(function (f) { return f.clase === 'filtro'; }).map(function (f) { return { tipos: f.tipos, temas: f.temas }; }),
    joyas: filas.filter(function (f) { return f.clase === 'joya'; }).map(function (f) { return f.joya; })
  };
}

function mismoFijado_(a, b) {
  if (a.clase !== b.clase) return false;
  if (a.clase === 'joya') return a.joya === b.joya;
  var clave = function (l) { return l.map(normalizar).sort().join('|'); };
  return clave(a.tipos) === clave(b.tipos) && clave(a.temas) === clave(b.temas);
}

function limpiarFijado_(d) {
  if (!d || (d.clase !== 'joya' && d.clase !== 'filtro')) throw fallo_('datos');
  if (d.clase === 'joya') {
    var id = texto_(d.id, 100);
    if (!id) throw fallo_('datos');
    return { clase: 'joya', joya: id, tipos: [], temas: [] };
  }
  var lista = function (v) {
    var r = [];
    (Array.isArray(v) ? v : []).forEach(function (x) { var n = nombreCategoria_(x); if (n && !contieneNombre_(r, n)) r.push(n); });
    return r;
  };
  var f = { clase: 'filtro', joya: '', tipos: lista(d.tipos), temas: lista(d.temas) };
  if (!f.tipos.length && !f.temas.length) throw fallo_('datos');
  return f;
}

/** fijar_(d, true) añade, fijar_(d, false) quita. Repetir la misma petición no cambia nada. */
function fijar_(d, poner) {
  var nuevo = limpiarFijado_(d);
  var filas = leerFilasFijados_();
  var existe = filas.some(function (f) { return mismoFijado_(f, nuevo); });
  if (poner && !existe) {
    nuevo.fecha = new Date().toISOString();
    escribirFilasNuevas_(hojaFijados_(), [filaFijado_(nuevo)]);
  } else if (!poner && existe) {
    reescribirFijados_(function (f) { return mismoFijado_(f, nuevo) ? null : f; });
  }
  return { ok: true, fijados: leerFijados_() };
}

function filaFijado_(f) {
  return [f.clase, f.joya, f.tipos.join(', '), f.temas.join(', '), f.fecha || new Date().toISOString()].map(celdaSegura_);
}

/**
 * Aplica un cambio a cada fijado: devolver el fijado (cambiado o no) o null para quitarlo.
 * Si dos filtros acaban siendo iguales, queda solo uno.
 */
function reescribirFijados_(cambiar) {
  var h = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_FIJADOS);
  if (!h || h.getLastRow() < 2) return;
  var antes = leerFilasFijados_();
  var despues = [];
  antes.forEach(function (f) {
    var r = cambiar({ clase: f.clase, joya: f.joya, tipos: f.tipos.slice(), temas: f.temas.slice(), fecha: f.fecha });
    if (r && !despues.some(function (x) { return mismoFijado_(x, r); })) despues.push(r);
  });
  if (JSON.stringify(antes) === JSON.stringify(despues)) return;
  h.getRange(2, 1, h.getMaxRows() - 1, COLS_FIJADOS.length).clearContent();
  if (despues.length) h.getRange(2, 1, despues.length, COLS_FIJADOS.length).setNumberFormat('@').setValues(despues.map(filaFijado_));
}

/* ───────────────────────── Eliminar joyero ───────────────────────── */

/**
 * Vacía el joyero: borra joyas y fijados, vuelve a los tipos y temas de base
 * y cambia la clave, así el código deja de funcionar en todos los dispositivos.
 * La hoja de Google sigue en el Drive.
 */
function vaciar_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var vaciarHoja = function (nombre, numCols) {
    var h = ss.getSheetByName(nombre);
    if (h && h.getMaxRows() > 1) h.getRange(2, 1, h.getMaxRows() - 1, numCols).clearContent();
    return h;
  };
  vaciarHoja(HOJA_JOYAS, COLS_JOYAS.length);
  vaciarHoja(HOJA_FIJADOS, COLS_FIJADOS.length);
  vaciarHoja(HOJA_TIPOS, COLS_TIPOS.length).getRange(2, 1, TIPOS_BASE.length, COLS_TIPOS.length).setValues(TIPOS_BASE);
  vaciarHoja(HOJA_TEMAS, COLS_TEMAS.length).getRange(2, 1, TEMAS_BASE.length, 1).setValues(TEMAS_BASE.map(function (t) { return [t]; }));
  PropertiesService.getScriptProperties().deleteProperty('JOYERO_CLAVE');
  return { ok: true };
}

/* ───────────────────────── Metadatos ───────────────────────── */

function metadatos_(url) {
  url = texto_(url, LIMITES.url);
  if (!/^https?:\/\/\S+$/i.test(url)) return { ok: false, error: 'datos' };
  var meta = obtenerMetadatos_([url])[0];
  var sug = clasificar(url, meta || {}, nombresTipos_(), leerTemas_());
  if (!meta) return { ok: false, error: 'inalcanzable', tipo: sug.tipo, temas: sug.temas };
  return {
    ok: true, titulo: meta.titulo, descripcion: meta.descripcion, autor: meta.autor,
    tipo: sug.tipo, temas: sug.temas
  };
}

function nombresTipos_() {
  return leerTipos_().map(function (t) { return t.nombre; });
}

/** Descarga varias páginas a la vez. Devuelve un objeto de metadatos o null por cada url. */
function obtenerMetadatos_(urls) {
  var peticiones = urls.map(function (u) {
    return {
      url: urlOembed(u) || u,
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Joyero/1.0)',
        'Accept-Language': 'es,en;q=0.8,it;q=0.6'
      }
    };
  });
  var respuestas;
  try {
    respuestas = UrlFetchApp.fetchAll(peticiones);
  } catch (e) {
    // Si una falla de forma grave, se reintenta una por una.
    respuestas = peticiones.map(function (p) {
      try { return UrlFetchApp.fetch(p.url, p); } catch (err) { return null; }
    });
  }
  return respuestas.map(function (r, i) {
    try {
      if (!r || r.getResponseCode() >= 400) return null;
      var tipoContenido = String(r.getHeaders()['Content-Type'] || r.getHeaders()['content-type'] || '');
      if (urlOembed(urls[i])) return metadatosOembed(r.getContentText('UTF-8'));
      if (tipoContenido && !/html|xml/i.test(tipoContenido)) return null;
      var html = decodificar_(r.getBlob(), tipoContenido);
      return parsearMetadatos(html);
    } catch (err) {
      return null;
    }
  });
}

function decodificar_(blob, tipoContenido) {
  var cs = (tipoContenido.match(/charset=([\w-]+)/i) || [])[1];
  var texto = blob.getDataAsString(cs || 'UTF-8');
  if (!cs) {
    var m = texto.slice(0, 3000).match(/<meta[^>]+charset=["']?([\w-]+)/i);
    if (m && !/utf-?8/i.test(m[1])) {
      try { texto = blob.getDataAsString(m[1]); } catch (e) { /* se queda en UTF-8 */ }
    }
  }
  return texto;
}

/* ───────────────────────── Importación ───────────────────────── */

/**
 * Recibe un bloque de joyas (máx. LOTE_MAX). Las que ya están en el joyero se saltan,
 * salvo las marcadas con forzar: true, que se guardan como dobles.
 * origen "navegador": se completan los datos que faltan y se clasifican.
 * origen "joyero": se conservan tal cual.
 */
function importar_(entrada) {
  if (!Array.isArray(entrada) || entrada.length > LOTE_MAX) return { ok: false, error: 'datos' };
  var items = [];
  entrada.forEach(function (e) {
    try {
      items.push({ j: limpiarJoya_(e, true), origen: e.origen === 'joyero' ? 'joyero' : 'navegador',
        forzar: e.forzar === true, idNuevo: idValido_(e.idNuevo) });
    }
    catch (err) { /* entrada no válida: se ignora */ }
  });
  var invalidas = entrada.length - items.length;

  // 1. Descargar metadatos fuera del bloqueo (es lo lento).
  var aCompletar = items.filter(function (it) { return it.origen === 'navegador'; });
  var metas = aCompletar.length ? obtenerMetadatos_(aCompletar.map(function (it) { return it.j.url; })) : [];
  var tipos = nombresTipos_();
  var temas = leerTemas_();
  aCompletar.forEach(function (it, i) {
    var m = metas[i] || {};
    if (!it.j.titulo && m.titulo) it.j.titulo = texto_(m.titulo, LIMITES.titulo);
    if (!it.j.descripcion && m.descripcion) it.j.descripcion = texto_(m.descripcion, LIMITES.descripcion);
    if (!it.j.autor && m.autor) it.j.autor = texto_(m.autor, LIMITES.autor);
    var sug = clasificar(it.j.url, { titulo: it.j.titulo, descripcion: it.j.descripcion, tipoOg: m.tipoOg }, tipos, temas);
    if (!it.j.tipo && sug.tipo) it.j.tipo = sug.tipo;
    sug.temas.forEach(function (t) { if (!contieneNombre_(it.j.temas, t)) it.j.temas.push(t); });
  });
  // Sin título en el archivo ni en la página: se usa el link sin "https://" para no perder la joya.
  items.forEach(function (it) {
    if (!it.j.titulo) it.j.titulo = texto_(it.j.url.replace(/^https?:\/\/(www\.)?/i, ''), LIMITES.titulo);
  });

  // 2. Escribir con bloqueo, saltando duplicados (también si el bloque se reenvía).
  return conBloqueo_(function () {
    var existentes = {}, ids = {};
    filas_(HOJA_JOYAS, 2).forEach(function (f) {
      if (f[0]) { existentes[normalizarUrl(f[1])] = true; ids[f[0]] = true; }
    });
    var nuevas = [], saltadas = 0, yaGuardadas = 0;
    var tiposNuevos = [], temasNuevos = [];
    items.forEach(function (it) {
      var clave = normalizarUrl(it.j.url);
      // Ya guardada en un intento anterior de este mismo bloque: no se repite.
      if (it.idNuevo && ids[it.idNuevo]) { yaGuardadas++; return; }
      // forzar: la persona volvió a marcar en 3.2 una joya que ya estaba; se guarda como doble.
      if (existentes[clave] && !it.forzar) { saltadas++; return; }
      existentes[clave] = true;
      it.j.id = it.idNuevo || Utilities.getUuid();
      if (it.idNuevo) ids[it.idNuevo] = true;
      if (it.j.tipo) tiposNuevos.push(it.j.tipo);
      temasNuevos = temasNuevos.concat(it.j.temas);
      nuevas.push(it.j);
    });
    asegurarCategorias_(tiposNuevos, temasNuevos);
    if (nuevas.length) {
      escribirFilasNuevas_(hoja_(HOJA_JOYAS), nuevas.map(joyaAFila_));
    }
    return {
      ok: true,
      importadas: nuevas.length,
      saltadas: saltadas,
      yaGuardadas: yaGuardadas,
      invalidas: invalidas,
      porOrganizar: nuevas.filter(function (j) { return !j.tipo || !j.temas.length; }).length,
      joyas: nuevas
    };
  });
}

/* ───────────────────────── Plantilla ───────────────────────── */

/** Se ejecuta UNA vez a mano en la hoja modelo para crear pestañas y valores base. */
function prepararPlantilla() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  preparar_(ss, HOJA_JOYAS, COLS_JOYAS, [], [200, 260, 260, 160, 320, 120, 220, 260, 200]);
  preparar_(ss, HOJA_TIPOS, COLS_TIPOS, TIPOS_BASE, [180, 160]);
  preparar_(ss, HOJA_TEMAS, COLS_TEMAS, TEMAS_BASE.map(function (t) { return [t]; }), [200]);
  preparar_(ss, HOJA_FIJADOS, COLS_FIJADOS, [], [100, 280, 220, 260, 200]);
  ss.getSheets().forEach(function (h) {
    var n = h.getName();
    if ([HOJA_JOYAS, HOJA_TIPOS, HOJA_TEMAS, HOJA_FIJADOS].indexOf(n) < 0 && h.getLastRow() === 0 && ss.getSheets().length > 4) {
      ss.deleteSheet(h);
    }
  });
  ss.setActiveSheet(ss.getSheetByName(HOJA_JOYAS));
}

function preparar_(ss, nombre, columnas, valores, anchos) {
  var h = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
  h.getRange(1, 1, h.getMaxRows(), columnas.length).setNumberFormat('@');
  h.getRange(1, 1, 1, columnas.length).setValues([columnas]).setFontWeight('bold');
  h.setFrozenRows(1);
  if (valores.length && h.getLastRow() < 2) {
    h.getRange(2, 1, valores.length, columnas.length).setValues(valores);
  }
  anchos.forEach(function (w, i) { h.setColumnWidth(i + 1, w); });
}

/* ───────────────────────── Utilidades ───────────────────────── */

function texto_(v, max, multilinea) {
  var s = v === undefined || v === null ? '' : String(v);
  s = multilinea ? s.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim()
                 : s.replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max).trim() : s;
}

/** Nombres de tipos y temas: sin comas (se usan como separador) y con longitud razonable. */
function nombreCategoria_(v) {
  var s = texto_(v, LIMITES.nombre);
  if (!s || s.indexOf(',') >= 0) return '';
  return s;
}

function contieneNombre_(lista, nombre) {
  var n = normalizar(nombre);
  return lista.some(function (x) { return normalizar(x) === n; });
}

function separarTemas_(s) {
  return String(s || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean);
}

function fechaValida_(f) {
  if (!f) return '';
  var d = new Date(f);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

function idValido_(id) {
  var s = String(id || '');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) ? s.toLowerCase() : '';
}

function iconoValido_(icono) {
  var s = String(icono || '');
  return /^[a-z0-9-]{1,40}$/.test(s) ? s : ICONO_GENERICO;
}

/** Evita que un texto que empieza por = + - @ se convierta en fórmula. */
function celdaSegura_(v) {
  var s = v === undefined || v === null ? '' : String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
