import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Settings, Search, ChevronDown, ChevronUp, ChevronRight, Plus, Upload, X, Pin, Pencil, ListFilter, MinusCircle } from 'lucide-preact';
import { t } from '../i18n/index.js';
import { usarJoyero } from '../estado.jsx';
import { navegar } from '../ruta.js';
import { filtrar, hayFiltros, porOrganizar } from '../lib/filtros.js';
import { leerFijados, guardarFijados, mismoFiltro, nombreFiltro } from '../lib/fijados.js';
import { claveError } from '../lib/api.js';
import { BotonIcono, Casilla, IconoJoya, EsqueletoLista, Panel, Aviso } from '../componentes/base.jsx';
import { IconoTipo } from '../componentes/iconos.jsx';

// Los filtros se conservan mientras la app está abierta (al volver del detalle siguen ahí).
let filtrosGuardados = { busqueda: '', tipos: [], temas: [], porOrganizar: false };

function Desplegable({ etiqueta, opciones, elegidas, onCambiar, conIconos, mostrarLimpiar, onLimpiar, izquierda }) {
  return (
    <div class="desplegable sq" style={`top: 44px; left: ${izquierda}px`}>
      <div class="opciones" role="listbox" aria-multiselectable="true" aria-label={etiqueta}>
      {opciones.map((o) => {
        const marcada = elegidas.includes(o.nombre);
        return (
          <button type="button" class="opcion" role="option" aria-selected={marcada ? 'true' : 'false'} key={o.nombre}
            onClick={() => onCambiar(marcada ? elegidas.filter((x) => x !== o.nombre) : elegidas.concat([o.nombre]))}>
            <Casilla marcada={marcada} />
            {conIconos && <span class="circulo" style="width: 22px; height: 22px"><IconoTipo nombre={o.icono} size={14} /></span>}
            <span class="txt">{o.nombre}</span>
          </button>
        );
      })}
      </div>
      {mostrarLimpiar && (
        <button type="button" class="opcion limpiar" onClick={onLimpiar}>
          <span style="width: 24px; display: inline-flex; justify-content: center"><X size={18} strokeWidth={2} aria-hidden="true" /></span>
          <span class="txt">{t('biblioteca.limpiar')}</span>
        </button>
      )}
    </div>
  );
}

export function Biblioteca() {
  const { datos, hayDatos, cargando, errorCarga, recargar } = usarJoyero();
  const [fGuardado, setF] = useState(filtrosGuardados);
  const [abierto, setAbierto] = useState(null); // 'tipo' | 'tema' | null
  const [menuMas, setMenuMas] = useState(false);
  const refTipo = useRef(null);
  const refTema = useRef(null);

  const hayPorOrganizar = datos.joyas.some(porOrganizar);
  // Si ya no quedan joyas por organizar, la chip desaparece y su filtro deja de aplicarse.
  const f = hayPorOrganizar ? fGuardado : { ...fGuardado, porOrganizar: false };
  const cambiar = (nuevo) => { filtrosGuardados = { ...f, ...nuevo }; setF(filtrosGuardados); };
  const limpiar = () => { filtrosGuardados = { busqueda: '', tipos: [], temas: [], porOrganizar: false }; setF(filtrosGuardados); setAbierto(null); };

  const visibles = useMemo(() => filtrar(datos.joyas, f), [datos.joyas, f]);
  const filtrosActivos = hayFiltros(f);

  // Fijados (boceto: se guardan en este navegador; en la versión final irán al Sheet).
  const [fijados, setFijados] = useState(leerFijados);
  const [editandoFijados, setEditandoFijados] = useState(false);
  const cambiarFijados = (nuevo) => { guardarFijados(nuevo); setFijados(nuevo); };
  const filtroActual = { tipos: f.tipos, temas: f.temas };
  const hayFiltroFijable = f.tipos.length > 0 || f.temas.length > 0;
  const actualFijado = hayFiltroFijable && fijados.filtros.some((x) => mismoFiltro(x, filtroActual));
  const alternarFijar = () => cambiarFijados(actualFijado
    ? { ...fijados, filtros: fijados.filtros.filter((x) => !mismoFiltro(x, filtroActual)) }
    : { ...fijados, filtros: [filtroActual].concat(fijados.filtros) });
  const joyasFijadas = fijados.joyas.map((id) => datos.joyas.find((j) => j.id === id)).filter(Boolean);
  const verFijados = !filtrosActivos && (fijados.filtros.length > 0 || joyasFijadas.length > 0);
  const tipoIcono = (fl) => (fl.tipos.length === 1 ? (datos.tipos.find((x) => x.nombre === fl.tipos[0]) || {}).icono : null);

  const posicion = (ref) => (ref.current ? ref.current.offsetLeft : 0);

  // Cabecera: el título queda siempre fijo; búsqueda y chips se esconden al bajar y vuelven al subir.
  const refTitulo = useRef(null);
  const refFiltros = useRef(null);
  const [altoTitulo, setAltoTitulo] = useState(0);
  const [filtrosOcultos, setFiltrosOcultos] = useState(false);
  useEffect(() => {
    const medir = () => { if (refTitulo.current) setAltoTitulo(refTitulo.current.offsetHeight); };
    medir();
    window.addEventListener('resize', medir);
    let ultimo = window.scrollY;
    const alDesplazar = () => {
      const y = window.scrollY;
      const zona = refFiltros.current;
      const dentro = zona && zona.contains(document.activeElement) && document.activeElement !== document.body;
      if (y <= 8 || dentro) setFiltrosOcultos(false);
      else if (y > ultimo + 6) setFiltrosOcultos(true);
      else if (y < ultimo - 6) setFiltrosOcultos(false);
      if (Math.abs(y - ultimo) > 6 || y <= 8) ultimo = y;
    };
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => { window.removeEventListener('resize', medir); window.removeEventListener('scroll', alDesplazar); };
  }, []);
  useEffect(() => { if (filtrosOcultos) setAbierto(null); }, [filtrosOcultos]);

  return (
    <main class="columna cabecera-fija">
      <div class="barra-titulo" ref={refTitulo}>
        <div class="cabecera">
          <h1 class="t-display">{t('biblioteca.titulo')}</h1>
          <BotonIcono etiqueta={t('biblioteca.ajustes')} onClick={() => navegar('/ajustes')} der>
            <Settings size={18} strokeWidth={2.25} aria-hidden="true" />
          </BotonIcono>
        </div>
      </div>

      <div class={`barra-filtros${filtrosOcultos ? ' oculta' : ''}`} ref={refFiltros} style={`top: ${altoTitulo}px`}
        onFocusIn={() => setFiltrosOcultos(false)}>
      <label class="buscador sq">
        <Search size={20} strokeWidth={2.25} aria-hidden="true" />
        <span class="oculto">{t('biblioteca.buscarEtiqueta')}</span>
        <input type="search" value={f.busqueda} placeholder={t('biblioteca.buscar')} enterKeyHint="search"
          onInput={(e) => cambiar({ busqueda: e.currentTarget.value })} />
      </label>

      <div style="position: relative; margin-top: 12px; display: flex; align-items: center; gap: 8px">
        <button type="button" ref={refTipo} class={`chip chip-flecha sq${f.tipos.length ? ' activo' : ''}`} aria-expanded={abierto === 'tipo' ? 'true' : 'false'} aria-haspopup="listbox"
          onClick={() => setAbierto(abierto === 'tipo' ? null : 'tipo')}>
          {t('biblioteca.tipo')}
          {abierto === 'tipo' ? <ChevronUp size={14} strokeWidth={2.5} aria-hidden="true" /> : <ChevronDown size={14} strokeWidth={2.5} color={f.tipos.length ? '#000' : 'var(--texto2)'} aria-hidden="true" />}
        </button>
        <button type="button" ref={refTema} class={`chip chip-flecha sq${f.temas.length ? ' activo' : ''}`} aria-expanded={abierto === 'tema' ? 'true' : 'false'} aria-haspopup="listbox"
          onClick={() => setAbierto(abierto === 'tema' ? null : 'tema')}>
          {t('biblioteca.tema')}
          {abierto === 'tema' ? <ChevronUp size={14} strokeWidth={2.5} aria-hidden="true" /> : <ChevronDown size={14} strokeWidth={2.5} color={f.temas.length ? '#000' : 'var(--texto2)'} aria-hidden="true" />}
        </button>
        {hayPorOrganizar && (
          <button type="button" class={`chip sq${f.porOrganizar ? ' activo' : ''}`} aria-pressed={f.porOrganizar ? 'true' : 'false'}
            onClick={() => cambiar({ porOrganizar: !f.porOrganizar })}>{t('biblioteca.porOrganizar')}</button>
        )}
        {hayFiltroFijable && (
          <button type="button" class={`chip chip-fijar sq${actualFijado ? ' activo' : ''}`} aria-pressed={actualFijado ? 'true' : 'false'} onClick={alternarFijar}>
            {actualFijado ? t('fijados.fijado') : t('fijados.fijar')}
            <Pin size={14} strokeWidth={2.5} fill={actualFijado ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
        )}

        {abierto && <div class="capa-transparente" onClick={() => setAbierto(null)} />}
        {abierto === 'tipo' && (
          <Desplegable etiqueta={t('biblioteca.tipo')} opciones={datos.tipos} elegidas={f.tipos} conIconos
            izquierda={posicion(refTipo)} onCambiar={(tipos) => cambiar({ tipos })} mostrarLimpiar={filtrosActivos} onLimpiar={limpiar} />
        )}
        {abierto === 'tema' && (
          <Desplegable etiqueta={t('biblioteca.tema')} opciones={datos.temas.map((nombre) => ({ nombre }))} elegidas={f.temas}
            izquierda={Math.max(0, posicion(refTema) - 60)} onCambiar={(temas) => cambiar({ temas })} mostrarLimpiar={filtrosActivos} onLimpiar={limpiar} />
        )}
      </div>
      </div>

      {errorCarga && (
        <div style="margin-top: 24px">
          <Aviso texto={t(errorCarga.codigo === 'clave' ? 'errores.clave' : claveError(errorCarga) === 'errores.generico' ? 'errores.cargar' : claveError(errorCarga))}
            accion={errorCarga.codigo === 'clave' ? null : t('comun.reintentar')} onAccion={recargar} />
        </div>
      )}

      {hayDatos && verFijados && (
        <section style="margin-top: 20px" aria-label={t('fijados.titulo')}>
          <div class="seccion-cab">
            <h2 class="t-seccion">{t('fijados.titulo')}</h2>
            <button type="button" class="bi der" aria-label={editandoFijados ? t('fijados.terminar') : t('fijados.editar')} onClick={() => setEditandoFijados(!editandoFijados)}>
              <span>{editandoFijados ? <X size={16} strokeWidth={2.25} aria-hidden="true" /> : <Pencil size={16} strokeWidth={2.25} aria-hidden="true" />}</span>
            </button>
          </div>
          <div class="lista">
            {fijados.filtros.map((fl) => {
              const n = filtrar(datos.joyas, { busqueda: '', porOrganizar: false, ...fl }).length;
              const icono = tipoIcono(fl);
              const contenido = (
                <>
                  <span class="circulo c28">{icono ? <IconoTipo nombre={icono} size={16} /> : <ListFilter size={16} strokeWidth={2.25} aria-hidden="true" />}</span>
                  <span class="crece"><span class="t-fuerte">{nombreFiltro(fl)}</span><span class="t-sec">{n === 1 ? t('comun.joya1') : t('comun.joyas', { n })}</span></span>
                </>
              );
              return editandoFijados ? (
                <div class="fila-lista" key={nombreFiltro(fl)}>
                  {contenido}
                  <button type="button" class="quitar" aria-label={t('fijados.quitar', { nombre: nombreFiltro(fl) })}
                    onClick={() => cambiarFijados({ ...fijados, filtros: fijados.filtros.filter((x) => !mismoFiltro(x, fl)) })}>
                    <MinusCircle size={22} strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button type="button" class="fila-lista fila-boton" key={nombreFiltro(fl)} onClick={() => cambiar({ tipos: fl.tipos, temas: fl.temas, busqueda: '', porOrganizar: false })}>
                  {contenido}
                  <ChevronRight size={20} strokeWidth={2.5} color="var(--gris-icono)" aria-hidden="true" />
                </button>
              );
            })}
            {joyasFijadas.map((j) => (editandoFijados ? (
              <div class="card" key={j.id} style="align-items: center">
                <IconoJoya joya={j} tipos={datos.tipos} />
                <div class="cuerpo"><div class="titulo">{j.titulo}</div>{j.autor && <div class="autor">{j.autor}</div>}</div>
                <button type="button" class="quitar" aria-label={t('fijados.quitar', { nombre: j.titulo })}
                  onClick={() => cambiarFijados({ ...fijados, joyas: fijados.joyas.filter((x) => x !== j.id) })}>
                  <MinusCircle size={22} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <a class="card" href={`#/joya/${j.id}`} key={j.id} onClick={(e) => { e.preventDefault(); navegar(`/joya/${j.id}`); }}>
                <IconoJoya joya={j} tipos={datos.tipos} />
                <div class="cuerpo">
                  <div class="titulo">{j.titulo}</div>
                  {j.autor && <div class="autor">{j.autor}</div>}
                  {j.temas && j.temas.length > 0 && <div class="etiquetas">{j.temas.map((x) => <span class="etiqueta sq" key={x}>{x}</span>)}</div>}
                </div>
              </a>
            )))}
          </div>
          <h2 class="t-seccion" style="margin-top: 32px">{t('fijados.todas')}</h2>
        </section>
      )}

      <div style={`margin-top: ${verFijados ? 8 : 20}px`}>
        {!hayDatos && cargando && <EsqueletoLista />}
        {hayDatos && visibles.length > 0 && (
          <div class="lista">
            {visibles.map((j) => (
              <a class="card" href={`#/joya/${j.id}`} key={j.id} onClick={(e) => { e.preventDefault(); navegar(`/joya/${j.id}`); }}>
                <IconoJoya joya={j} tipos={datos.tipos} />
                <div class="cuerpo">
                  <div class="titulo">{j.titulo}</div>
                  {j.autor && <div class="autor">{j.autor}</div>}
                  {j.temas && j.temas.length > 0 && (
                    <div class="etiquetas">{j.temas.map((x) => <span class="etiqueta sq" key={x}>{x}</span>)}</div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
        {hayDatos && !visibles.length && (
          <p class="t-sec">{datos.joyas.length ? t('biblioteca.sinResultados') : t('biblioteca.vacia')}</p>
        )}
      </div>

      <div class="fijo zona-fab">
        <button type="button" class="fab sq" aria-label={t('biblioteca.anadir')} onClick={() => setMenuMas(true)}>
          <Plus size={24} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>

      <Panel abierto={menuMas} onCerrar={() => setMenuMas(false)} etiqueta={t('biblioteca.anadir')}>
        <div style="margin-top: 24px" class="lista">
          <button type="button" class="fila-lista arriba" style="border: 0; background: none; text-align: left; width: 100%; padding-left: 0; padding-right: 0"
            onClick={() => { setMenuMas(false); navegar('/anadir'); }}>
            <span class="circulo c28" style="margin-top: 2px"><Plus size={16} strokeWidth={2.25} aria-hidden="true" /></span>
            <span class="crece"><span class="t-fuerte">{t('menuMas.anadir')}</span><span class="t-sec">{t('menuMas.anadirSub')}</span></span>
          </button>
          <button type="button" class="fila-lista arriba" style="border: 0; background: none; text-align: left; width: 100%; padding-left: 0; padding-right: 0"
            onClick={() => { setMenuMas(false); navegar('/importar'); }}>
            <span class="circulo c28" style="margin-top: 2px"><Upload size={16} strokeWidth={2.25} aria-hidden="true" /></span>
            <span class="crece"><span class="t-fuerte">{t('menuMas.importar')}</span><span class="t-sec">{t('menuMas.importarSub')}</span></span>
          </button>
        </div>
        <button type="button" class="btn sq terciario" style="margin-top: 16px" onClick={() => setMenuMas(false)}>
          <span>{t('comun.cancelar')}</span><X size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      </Panel>
    </main>
  );
}
