import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Settings, Search, Plus, Upload, X } from 'lucide-preact';
import { t } from '../i18n/index.js';
import { usarJoyero } from '../estado.jsx';
import { navegar } from '../ruta.js';
import { filtrar, hayFiltros, porOrganizar } from '../lib/filtros.js';
import { claveError } from '../lib/api.js';
import { BotonIcono, IconoJoya, EsqueletoLista, Panel, Aviso } from '../componentes/base.jsx';
import { FilaChips } from '../componentes/filtros.jsx';

// Los filtros se conservan mientras la app está abierta (al volver del detalle siguen ahí).
let filtrosGuardados = { busqueda: '', tipos: [], temas: [], porOrganizar: false };

export function Biblioteca() {
  const { datos, hayDatos, cargando, errorCarga, recargar } = usarJoyero();
  const [fGuardado, setF] = useState(filtrosGuardados);
  const [abierto, setAbierto] = useState(null); // 'tipo' | 'tema' | null
  const [menuMas, setMenuMas] = useState(false);

  const hayPorOrganizar = datos.joyas.some(porOrganizar);
  // Si ya no quedan joyas por organizar, la chip desaparece y su filtro deja de aplicarse.
  const f = hayPorOrganizar ? fGuardado : { ...fGuardado, porOrganizar: false };
  const cambiar = (nuevo) => { filtrosGuardados = { ...f, ...nuevo }; setF(filtrosGuardados); };
  const limpiar = () => { filtrosGuardados = { busqueda: '', tipos: [], temas: [], porOrganizar: false }; setF(filtrosGuardados); setAbierto(null); };

  const visibles = useMemo(() => filtrar(datos.joyas, f), [datos.joyas, f]);
  const filtrosActivos = hayFiltros(f);


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

      <FilaChips f={f} cambiar={cambiar} limpiar={limpiar} hayPorOrganizar={hayPorOrganizar} abierto={abierto} setAbierto={setAbierto} />
      </div>

      {errorCarga && (
        <div style="margin-top: 24px">
          <Aviso texto={t(errorCarga.codigo === 'clave' ? 'errores.clave' : claveError(errorCarga) === 'errores.generico' ? 'errores.cargar' : claveError(errorCarga))}
            accion={errorCarga.codigo === 'clave' ? null : t('comun.reintentar')} onAccion={recargar} />
        </div>
      )}

      <div style="margin-top: 20px">
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
