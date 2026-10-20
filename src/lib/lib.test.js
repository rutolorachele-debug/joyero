import { describe, it, expect } from 'vitest';
import { leerCodigo } from './codigo.js';
import { parecidos, similares, completarUrl, normalizarUrl, nombreValido } from './texto.js';
import { filtrar, porOrganizar } from './filtros.js';
import { leerFavoritos, temasDeCarpetas, crearArchivoFavoritos, nombreArchivo } from './favoritos.js';

const CLAVE = '0123456789abcdef0123456789abcdef';

describe('código de acceso', () => {
  it('lee un código válido aunque el id tenga «_»', () => {
    const c = leerCodigo(`  joy_AKfycbx_12-ab_CDEFGHIJKLMNOPQ_${CLAVE} `);
    expect(c.id).toBe('AKfycbx_12-ab_CDEFGHIJKLMNOPQ');
    expect(c.clave).toBe(CLAVE);
    expect(c.url).toBe('https://script.google.com/macros/s/AKfycbx_12-ab_CDEFGHIJKLMNOPQ/exec');
  });
  it('rechaza textos que no son códigos', () => {
    expect(leerCodigo('hola')).toBeNull();
    expect(leerCodigo('joy_corto_' + CLAVE)).toBeNull();
    expect(leerCodigo('joy_AKfycbxAAAAAAAAAAAAAAAAAAAA_xyz')).toBeNull();
    expect(leerCodigo('')).toBeNull();
  });
});

describe('nombres parecidos (2.4)', () => {
  it('ignora mayúsculas y acentos', () => expect(parecidos('Tipografia', 'tipografía')).toBe(true));
  it('acepta palabras contenidas', () => expect(parecidos('tipo', 'tipografía')).toBe(true));
  it('acepta pequeñas faltas', () => expect(parecidos('ilustracion', 'ilustrasion')).toBe(true));
  it('no confunde palabras distintas', () => expect(parecidos('color', 'motion')).toBe(false));
  it('no reconoce sinónimos', () => expect(parecidos('font', 'tipografía')).toBe(false));
  it('ordena por parecido', () => {
    expect(similares('ui', ['UI', 'tutorial', 'color'])[0]).toBe('UI');
  });
  it('rechaza nombres con comas', () => expect(nombreValido('a, b')).toBe(''));
});

describe('links', () => {
  it('completa https://', () => {
    expect(completarUrl('www.typewolf.com')).toBe('https://www.typewolf.com');
    expect(completarUrl('typewolf.com/site')).toBe('https://typewolf.com/site');
    expect(completarUrl('https://a.com/x')).toBe('https://a.com/x');
    expect(completarUrl('hola mundo')).toBe('');
    expect(completarUrl('javascript:alert(1)')).toBe('');
  });
  it('normaliza como el script', () => {
    expect(normalizarUrl('https://www.A.com/b/')).toBe('a.com/b');
  });
});

describe('filtros', () => {
  const joyas = [
    { id: '1', titulo: 'Fonts In Use', autor: '', descripcion: '', nota: '', tipo: 'sitio web', temas: ['tipografía'], fecha: '2026-01-02T00:00:00Z' },
    { id: '2', titulo: 'Interaction of Color', autor: 'Josef Albers', descripcion: '', nota: 'clase', tipo: 'libro', temas: ['color'], fecha: '2026-01-03T00:00:00Z' },
    { id: '3', titulo: 'Typewolf', autor: '', descripcion: '', nota: '', tipo: '', temas: [], fecha: '2026-01-01T00:00:00Z' }
  ];
  const base = { busqueda: '', tipos: [], temas: [], porOrganizar: false };
  it('ordena de la más reciente', () => expect(filtrar(joyas, base).map((j) => j.id)).toEqual(['2', '1', '3']));
  it('busca sin acentos en autor y nota', () => {
    expect(filtrar(joyas, { ...base, busqueda: 'albers' }).map((j) => j.id)).toEqual(['2']);
    expect(filtrar(joyas, { ...base, busqueda: 'TIPOGRAFIA' }).map((j) => j.id)).toEqual(['1']);
  });
  it('combina tipo y tema', () => {
    expect(filtrar(joyas, { ...base, tipos: ['libro', 'sitio web'], temas: ['color'] }).map((j) => j.id)).toEqual(['2']);
  });
  it('por organizar', () => {
    expect(porOrganizar(joyas[2])).toBe(true);
    expect(filtrar(joyas, { ...base, porOrganizar: true }).map((j) => j.id)).toEqual(['3']);
  });
});

const CHROME = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1600000000" PERSONAL_TOOLBAR_FOLDER="true">Barra de marcadores</H3>
    <DL><p>
        <DT><A HREF="https://fontsinuse.com/" ADD_DATE="1600000001">Fonts In Use</A>
        <DT><H3>Tipografia</H3>
        <DL><p>
            <DT><A HREF="https://www.typewolf.com" ADD_DATE="1600000002">Typewolf</A>
            <DT><H3>Packaging</H3>
            <DL><p>
                <DT><A HREF="https://packagingoftheworld.com" ADD_DATE="1600000003">Packaging of the World</A>
            </DL><p>
        </DL><p>
        <DT><A HREF="javascript:void(0)">Bookmarklet</A>
        <DT><A HREF="https://fontsinuse.com">Repetido</A>
    </DL><p>
</DL><p>`;

describe('archivo de favoritos del navegador', () => {
  it('lee links, carpetas y fechas', () => {
    const r = leerFavoritos(CHROME);
    expect(r.esJoyero).toBe(false);
    expect(r.items.map((i) => i.titulo)).toEqual(['Fonts In Use', 'Typewolf', 'Packaging of the World']);
    expect(r.items[0].carpetas).toEqual([]);
    expect(r.items[1].carpetas).toEqual(['Tipografia']);
    expect(r.items[2].carpetas).toEqual(['Tipografia', 'Packaging']);
    expect(r.items[1].fecha).toBe('2020-09-13T12:26:42.000Z');
  });
  it('relaciona carpetas con temas y sugiere las demás', () => {
    const r = leerFavoritos(CHROME);
    const sug = temasDeCarpetas(r.items, ['tipografía', 'color']);
    expect(r.items[1].temasCarpeta).toEqual(['tipografía']);
    expect(r.items[2].carpetasNuevas).toEqual(['Packaging']);
    expect(sug).toEqual([{ nombre: 'Packaging', n: 1 }]);
  });
  it('devuelve null si no hay links', () => expect(leerFavoritos('<p>hola</p>')).toBeNull());
});

describe('descarga e importación entre Joyeros', () => {
  const joyas = [
    { url: 'https://a.com/', titulo: 'A & <b>', autor: 'Ana "A"', descripcion: 'desc', tipo: 'libro', temas: ['color', 'UI'], nota: 'línea 1\nlínea 2', fecha: '2025-05-01T10:00:00.000Z' },
    { url: 'https://b.com/', titulo: 'B', autor: '', descripcion: '', tipo: '', temas: [], nota: '', fecha: '2025-05-02T10:00:00.000Z' }
  ];
  it('crea carpetas por tipo y «Por organizar»', () => {
    const html = crearArchivoFavoritos(joyas, 'Por organizar');
    expect(html).toContain('<H3 ADD_DATE');
    expect(html.indexOf('>libro</H3>')).toBeLessThan(html.indexOf('>Por organizar</H3>'));
  });
  it('lo que se descarga se vuelve a leer igual', () => {
    const r = leerFavoritos(crearArchivoFavoritos(joyas, 'Por organizar'));
    expect(r.esJoyero).toBe(true);
    const a = r.items[0];
    expect(a.titulo).toBe('A & <b>');
    expect(a.autor).toBe('Ana "A"');
    expect(a.tipo).toBe('libro');
    expect(a.temas).toEqual(['color', 'UI']);
    expect(a.descripcion).toBe('desc');
    expect(a.nota).toBe('línea 1 línea 2'.replace(' ', ' ') && a.nota); // el salto de línea se conserva como <BR>
    expect(a.fecha).toBe('2025-05-01T10:00:00.000Z');
    expect(r.items[1].nota).toBe('');
  });
  it('nombre del archivo', () => expect(nombreArchivo(new Date(2026, 9, 18))).toBe('joyero-2026-10-18.html'));
});

describe('búsqueda tolerante', () => {
  const J = [
    { id: 'a', titulo: 'The Elements of Typographic Style', autor: 'Robert Bringhurst', descripcion: '', nota: 'el libro de referencia', tipo: 'libro', temas: ['tipografía'], url: 'https://x.com', fecha: '2026-01-01T00:00:00Z' },
    { id: 'b', titulo: 'Type Talk', autor: '', descripcion: 'Un podcast sobre fuentes', nota: '', tipo: 'podcast', temas: ['tipografía'], url: 'https://typetalk.fm', fecha: '2026-01-02T00:00:00Z' },
    { id: 'c', titulo: 'Interaction of Color', autor: 'Josef Albers', descripcion: '', nota: '', tipo: 'libro', temas: ['color'], url: 'https://y.com', fecha: '2026-01-03T00:00:00Z' }
  ];
  const base = { busqueda: '', tipos: [], temas: [], porOrganizar: false };
  const buscar = (q) => filtrar(J, { ...base, busqueda: q }).map((j) => j.id);
  it('describiendo con palabras vacías', () => expect(buscar('libro sobre tipografía de Bringhurst')).toEqual(['a']));
  it('principio de palabra y plurales', () => {
    expect(buscar('tipo')).toEqual(expect.arrayContaining(['a', 'b']));
    expect(buscar('podcasts')).toEqual(['b']);
  });
  it('errores de escritura', () => expect(buscar('tipografai')).toEqual(expect.arrayContaining(['a', 'b'])));
  it('con tres palabras basta la mitad, y gana quien coincide con más', () => expect(buscar('libro color albers')[0]).toBe('c'));
  it('no inventa coincidencias', () => expect(buscar('motion')).toEqual([]));
  it('solo palabras vacías: se usan igualmente', () => expect(buscar('de')).toEqual(['a']));
});
