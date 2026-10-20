// Pruebas del script contra una hoja de Google simulada en memoria (fijados y eliminar joyero).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function crearHojaSimulada() {
  const hojas = {};
  const orden = [];
  const props = {};
  let uuid = 0;
  function nuevaHoja(nombre) {
    const filas = []; // filas[i] = array de celdas (texto)
    let maxRows = 1000;
    const h = {
      getName: () => nombre,
      getLastRow: () => { for (let i = filas.length - 1; i >= 0; i--) if (filas[i] && filas[i].some((c) => c !== '')) return i + 1; return 0; },
      getMaxRows: () => maxRows,
      insertRowsAfter: (_, n) => { maxRows += n; },
      deleteRow: (r) => { filas.splice(r - 1, 1); },
      appendRow: (v) => { filas[h.getLastRow()] = v.map(String); },
      setFrozenRows: () => {}, setColumnWidth: () => {},
      getRange: (r, c, nr = 1, nc = 1) => {
        const rango = {
          getDisplayValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => ((filas[r - 1 + i] || [])[c - 1 + j] ?? '') + '')),
          setValues: (v) => { v.forEach((fila, i) => { filas[r - 1 + i] = filas[r - 1 + i] || []; fila.forEach((x, j) => { filas[r - 1 + i][c - 1 + j] = String(x).replace(/^'/, ''); }); }); return rango; },
          setValue: (x) => rango.setValues([[x]]),
          clearContent: () => { for (let i = 0; i < nr; i++) if (filas[r - 1 + i]) for (let j = 0; j < nc; j++) filas[r - 1 + i][c - 1 + j] = ''; return rango; },
          setNumberFormat: () => rango, setFontWeight: () => rango
        };
        return rango;
      },
      _filas: filas
    };
    return h;
  }
  const ss = {
    getId: () => 'hoja-1',
    getSheetByName: (n) => hojas[n] || null,
    insertSheet: (n) => { hojas[n] = nuevaHoja(n); orden.push(n); return hojas[n]; },
    getSheets: () => orden.map((n) => hojas[n]),
    deleteSheet: () => {}, setActiveSheet: () => {},
    _borrar: (n) => { delete hojas[n]; orden.splice(orden.indexOf(n), 1); }
  };
  return {
    console,
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush: () => {} },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (k) => (k in props ? props[k] : null),
      setProperties: (o) => Object.assign(props, o),
      deleteProperty: (k) => { delete props[k]; }
    }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock: () => {}, releaseLock: () => {} }) },
    Utilities: { getUuid: () => '00000000-0000-4000-8000-' + String(++uuid).padStart(12, '0') + 'abcdef'.slice(0, 0) },
    _ss: ss, _props: props
  };
}

function cargar() {
  const ctx = vm.createContext(crearHojaSimulada());
  for (const f of ['Clasificar.gs', 'Code.gs']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
  ctx.prepararPlantilla();
  const clave = ctx.obtenerClave_();
  const pedir = (accion, datos) => JSON.parse(JSON.stringify(ctx.atender_({ clave: ctx.obtenerClave_(), accion, datos })));
  return { ctx, clave, pedir };
}

const joya = (url, extra = {}) => ({ url, titulo: 'T ' + url, tipo: 'podcast', temas: ['tipografía'], ...extra });

test('una hoja sin pestaña Fijados (joyero v2) se lee igual y la pestaña se crea al fijar', () => {
  const { ctx, pedir } = cargar();
  ctx._ss._borrar('Fijados'); // un joyero creado antes de la versión 3
  const r = pedir('leer', {});
  assert.equal(r.ok, true);
  assert.deepEqual(r.fijados, { filtros: [], joyas: [] });
  const a = pedir('guardar', { joya: joya('https://a.com') }).joya;
  assert.deepEqual(pedir('fijar', { clase: 'joya', id: a.id }).fijados.joyas, [a.id]);
  assert.ok(ctx._ss.getSheetByName('Fijados'));
});

test('fijar y desfijar joyas y filtros, sin duplicados y el último primero', async () => {
  const { pedir } = cargar();
  const a = pedir('guardar', { joya: joya('https://a.com') }).joya;
  const b = pedir('guardar', { joya: joya('https://b.com') }).joya;
  pedir('fijar', { clase: 'joya', id: a.id });
  await new Promise((r) => setTimeout(r, 5));
  pedir('fijar', { clase: 'joya', id: b.id });
  pedir('fijar', { clase: 'joya', id: b.id }); // repetido: nada cambia
  await new Promise((r) => setTimeout(r, 5));
  pedir('fijar', { clase: 'filtro', tipos: ['podcast'], temas: ['tipografía'] });
  pedir('fijar', { clase: 'filtro', tipos: ['Podcast'], temas: ['tipografia'] }); // igual sin mayúsculas ni acentos
  let f = pedir('leer', {}).fijados;
  assert.deepEqual(f.joyas, [b.id, a.id]);
  assert.deepEqual(f.filtros, [{ tipos: ['podcast'], temas: ['tipografía'] }]);
  f = pedir('desfijar', { clase: 'joya', id: a.id }).fijados;
  assert.deepEqual(f.joyas, [b.id]);
  f = pedir('desfijar', { clase: 'filtro', tipos: ['podcast'], temas: ['tipografía'] }).fijados;
  assert.deepEqual(f.filtros, []);
  assert.equal(pedir('fijar', { clase: 'filtro', tipos: [], temas: [] }).error, 'datos');
});

test('eliminar una joya la quita de fijados', () => {
  const { pedir } = cargar();
  const a = pedir('guardar', { joya: joya('https://a.com') }).joya;
  pedir('fijar', { clase: 'joya', id: a.id });
  pedir('eliminar', { id: a.id });
  assert.deepEqual(pedir('leer', {}).fijados.joyas, []);
});

test('renombrar y eliminar categorías actualiza los filtros fijados', () => {
  const { pedir } = cargar();
  pedir('fijar', { clase: 'filtro', tipos: ['podcast'], temas: ['tipografía'] });
  pedir('fijar', { clase: 'filtro', tipos: [], temas: ['color'] });
  pedir('renombrarCategoria', { clase: 'tema', nombre: 'tipografía', nuevo: 'fuentes' });
  let f = pedir('leer', {}).fijados.filtros;
  assert.ok(f.some((x) => x.tipos[0] === 'podcast' && x.temas[0] === 'fuentes'));
  pedir('eliminarCategoria', { clase: 'tema', nombre: 'color' });
  f = pedir('leer', {}).fijados.filtros;
  assert.equal(f.length, 1); // el filtro «color» se quedó vacío y desaparece
  pedir('eliminarCategoria', { clase: 'tipo', nombre: 'podcast' });
  f = pedir('leer', {}).fijados.filtros;
  assert.deepEqual(f, [{ tipos: [], temas: ['fuentes'] }]);
});

test('vaciar borra todo, vuelve a las categorías de base y cambia la clave', () => {
  const { ctx, clave, pedir } = cargar();
  const a = pedir('guardar', { joya: joya('https://a.com', { tipo: 'nuevo tipo', temas: ['nuevo tema'] }) }).joya;
  pedir('fijar', { clase: 'joya', id: a.id });
  assert.equal(pedir('vaciar', {}).ok, true);
  assert.equal(ctx.atender_({ clave, accion: 'leer' }).error, 'clave'); // el código viejo ya no vale
  const r = pedir('leer', {}); // con la clave nueva
  assert.deepEqual(r.joyas, []);
  assert.deepEqual(r.fijados, { filtros: [], joyas: [] });
  assert.deepEqual(r.tipos.map((t) => t.nombre), JSON.parse(JSON.stringify(ctx.TIPOS_BASE)).map((t) => t[0]));
  assert.deepEqual(r.temas, JSON.parse(JSON.stringify(ctx.TEMAS_BASE)));
  assert.notEqual(ctx.obtenerClave_(), clave);
});
