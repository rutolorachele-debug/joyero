import { useEffect, useRef, useState } from 'preact/hooks';
import { ArrowRight, Upload } from 'lucide-preact';
import { t } from '../i18n/index.js';
import { usarJoyero } from '../estado.jsx';
import { navegar, volver } from '../ruta.js';
import { leerFavoritos, temasDeCarpetas } from '../lib/favoritos.js';
import { normalizarUrl, dominio, nuevoId } from '../lib/texto.js';
import { conReintentos } from '../lib/api.js';
import { LOTE_IMPORTAR } from '../config.js';
import { Boton, BotonAtras, BotonCerrar, BarraInferior, Casilla, Aviso } from '../componentes/base.jsx';

const flecha = <ArrowRight size={20} strokeWidth={2} aria-hidden="true" />;

/* 3.1 → 3.2 → (Temas sugeridos) → 3.3 → 3.4 */
export function Importar() {
  const { datos, api, recargar } = usarJoyero();
  const [paso, setPaso] = useState('instrucciones');
  const [archivo, setArchivo] = useState(null); // { esJoyero, items }
  const [marcadas, setMarcadas] = useState(new Set());
  const [sugeridos, setSugeridos] = useState([]);
  const [temasElegidos, setTemasElegidos] = useState(new Set());
  const [errorArchivo, setErrorArchivo] = useState('');
  const [progreso, setProgreso] = useState({ x: 0, n: 0 });
  const [errorProceso, setErrorProceso] = useState(false);
  const [resumen, setResumen] = useState(null);
  const entradaArchivo = useRef(null);
  const estado = useRef(null); // trabajo en curso, para poder reintentar

  // Avisar antes de cerrar la página mientras se importa.
  useEffect(() => {
    if (paso !== 'progreso' || errorProceso) return undefined;
    const aviso = (e) => { e.preventDefault(); e.returnValue = t('importar.salirAviso'); return e.returnValue; };
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [paso, errorProceso]);

  const existentes = new Set(datos.joyas.map((j) => normalizarUrl(j.url)));

  const alElegirArchivo = async (e) => {
    const f = e.currentTarget.files && e.currentTarget.files[0];
    e.currentTarget.value = '';
    if (!f) return;
    setErrorArchivo('');
    let texto = '';
    try { texto = await f.text(); } catch (err) { texto = ''; }
    const r = texto ? leerFavoritos(texto) : null;
    if (!r) { setErrorArchivo(t('importar.archivoNoValido')); return; }
    r.items.forEach((it) => { it.yaEsta = existentes.has(normalizarUrl(it.url)); it.idNuevo = nuevoId(); });
    setSugeridos(r.esJoyero ? [] : temasDeCarpetas(r.items, datos.temas));
    setArchivo(r);
    setMarcadas(new Set(r.items.filter((it) => !it.yaEsta).map((it) => it.idNuevo)));
    setPaso('seleccion');
  };

  const elegidas = archivo ? archivo.items.filter((it) => marcadas.has(it.idNuevo)) : [];
  const sugeridosVisibles = sugeridos
    .map((s) => ({ ...s, n: elegidas.filter((it) => (it.carpetasNuevas || []).includes(s.nombre)).length }))
    .filter((s) => s.n > 0);

  const alternar = (id) => {
    const nuevo = new Set(marcadas);
    if (nuevo.has(id)) nuevo.delete(id); else nuevo.add(id);
    setMarcadas(nuevo);
  };
  const todasMarcadas = archivo && marcadas.size === archivo.items.length;

  const continuarSeleccion = () => {
    if (sugeridosVisibles.length) setPaso('sugeridos');
    else empezar();
  };

  const empezar = () => {
    const lista = elegidas.map((it) => {
      const base = { url: it.url, titulo: it.titulo, fecha: it.fecha, idNuevo: it.idNuevo, forzar: !!it.yaEsta };
      if (archivo.esJoyero) {
        return { ...base, origen: 'joyero', autor: it.autor, tipo: it.tipo, temas: it.temas, nota: it.nota, descripcion: it.descripcion };
      }
      const temas = (it.temasCarpeta || []).concat((it.carpetasNuevas || []).filter((c) => temasElegidos.has(c)));
      return { ...base, origen: 'navegador', temas };
    });
    const saltadasAntes = archivo.items.filter((it) => it.yaEsta && !marcadas.has(it.idNuevo)).length;
    estado.current = { lista, hecho: 0, importadas: 0, saltadas: saltadasAntes, porOrganizar: 0 };
    setProgreso({ x: 0, n: lista.length });
    setPaso('progreso');
    procesar();
  };

  const procesar = async () => {
    setErrorProceso(false);
    const e = estado.current;
    while (e.hecho < e.lista.length) {
      const bloque = e.lista.slice(e.hecho, e.hecho + LOTE_IMPORTAR);
      try {
        const r = await conReintentos(() => api('importar', { joyas: bloque }));
        e.importadas += (r.importadas || 0) + (r.yaGuardadas || 0);
        e.saltadas += r.saltadas || 0;
        e.porOrganizar += r.porOrganizar || 0;
        e.hecho += bloque.length;
        setProgreso({ x: e.hecho, n: e.lista.length });
      } catch (err) {
        setErrorProceso(true);
        return;
      }
    }
    await recargar();
    setResumen({ importadas: e.importadas, saltadas: e.saltadas, porOrganizar: e.porOrganizar });
    setPaso('resumen');
  };

  /* 3.1 Instrucciones */
  if (paso === 'instrucciones') {
    return (
      <main class="columna">
        <div class="cabecera">
          <h1 class="t-display">{t('importar.titulo')}</h1>
          <BotonCerrar onClick={() => volver('/')} />
        </div>
        <p class="t-cuerpo" style="margin-top: 48px">{t('importar.texto')}</p>
        <div class="t-sec" style="margin-top: 48px">{t('importar.comoExportar')}</div>
        <div style="margin-top: 24px; display: flex; flex-direction: column; gap: 8px">
          {t('importar.navegadores').map((n) => (
            <div class="caja sq" style="gap: 4px" key={n.nombre}>
              <div class="t-fuerte">{n.nombre}</div>
              <div class="t-sec">{n.pasos}</div>
            </div>
          ))}
        </div>
        {errorArchivo && <div class="texto-error" role="alert" style="margin-top: 24px">{errorArchivo}</div>}
        <input ref={entradaArchivo} type="file" accept=".html,.htm,text/html" class="oculto" tabIndex={-1} onChange={alElegirArchivo} />
        <BarraInferior>
          <Boton onClick={() => entradaArchivo.current && entradaArchivo.current.click()} icono={<Upload size={20} strokeWidth={2} aria-hidden="true" />}>
            {t('importar.subir')}
          </Boton>
        </BarraInferior>
      </main>
    );
  }

  /* 3.2 Selección */
  if (paso === 'seleccion') {
    return (
      <main class="columna">
        <div class="cabecera solo-izq"><BotonAtras onClick={() => setPaso('instrucciones')} /></div>
        <h1 class="t-display titulo-bajo">{t('importar.encontradas', { n: archivo.items.length })}</h1>
        <button type="button" class="enlace" style="margin-top: 16px; align-self: flex-start"
          onClick={() => setMarcadas(todasMarcadas ? new Set() : new Set(archivo.items.map((it) => it.idNuevo)))}>
          {t(todasMarcadas ? 'importar.deseleccionarTodo' : 'importar.seleccionarTodo')}
        </button>
        <div class="lista" style="margin-top: 24px">
          {archivo.items.map((it) => {
            const m = marcadas.has(it.idNuevo);
            const origen = archivo.esJoyero ? dominio(it.url) : `${dominio(it.url)} · ${it.carpetas.length ? it.carpetas[it.carpetas.length - 1] : t('importar.sinCarpeta')}`;
            return (
              <label class="fila-lista arriba" key={it.idNuevo} style="cursor: pointer">
                <input type="checkbox" class="oculto" checked={m} onChange={() => alternar(it.idNuevo)} />
                <span style="margin-top: 2px"><Casilla marcada={m} /></span>
                <span class="crece">
                  <span class="t-fuerte" style="overflow-wrap: anywhere">{it.titulo || dominio(it.url)}</span>
                  <span class="t-sec" style="overflow-wrap: anywhere">{origen}</span>
                  {it.yaEsta && <span class="etiqueta sq gris" style="align-self: flex-start; margin-top: 6px">{t('importar.yaEsta')}</span>}
                </span>
              </label>
            );
          })}
        </div>
        <BarraInferior>
          <Boton disabled={!elegidas.length} onClick={continuarSeleccion} icono={flecha}>{t('importar.importarN', { n: elegidas.length })}</Boton>
        </BarraInferior>
      </main>
    );
  }

  /* Temas sugeridos */
  if (paso === 'sugeridos') {
    return (
      <main class="columna">
        <div class="cabecera solo-izq"><BotonAtras onClick={() => setPaso('seleccion')} /></div>
        <h1 class="t-display titulo-bajo">{t('importar.sugeridosTitulo')}</h1>
        <p class="t-cuerpo gris" style="margin-top: 8px">{t('importar.sugeridosTexto')}</p>
        <div class="lista" style="margin-top: 48px">
          {sugeridosVisibles.map((s) => {
            const m = temasElegidos.has(s.nombre);
            return (
              <label class="fila-lista" key={s.nombre} style="cursor: pointer">
                <input type="checkbox" class="oculto" checked={m} onChange={() => {
                  const nuevo = new Set(temasElegidos);
                  if (m) nuevo.delete(s.nombre); else nuevo.add(s.nombre);
                  setTemasElegidos(nuevo);
                }} />
                <Casilla marcada={m} />
                <span class="t-fuerte" style="flex: 1; min-width: 0; overflow-wrap: anywhere">{s.nombre}</span>
                <span class="num">{s.n === 1 ? t('comun.joya1') : t('comun.joyas', { n: s.n })}</span>
              </label>
            );
          })}
        </div>
        <BarraInferior>
          <Boton onClick={empezar} icono={flecha}>{t('comun.continuar')}</Boton>
        </BarraInferior>
      </main>
    );
  }

  /* 3.3 Progreso */
  if (paso === 'progreso') {
    const pct = progreso.n ? Math.round((progreso.x / progreso.n) * 100) : 0;
    return (
      <main class="columna sin-barra">
        <h1 class="t-display cabecera">{t('importar.titulo')}</h1>
        <div class="centro" style="gap: 16px">
          <div class="cifra" aria-live="polite">{t('importar.progreso', { x: progreso.x, n: progreso.n })}</div>
          <div class="barra" role="progressbar" aria-valuemin={0} aria-valuemax={progreso.n} aria-valuenow={progreso.x}><div style={`width: ${pct}%`} /></div>
          <div class="t-sec">{t('importar.progresoTexto')}</div>
          {errorProceso && <div style="margin-top: 8px"><Aviso texto={t('importar.error')} accion={t('comun.reintentar')} onAccion={procesar} /></div>}
        </div>
      </main>
    );
  }

  /* 3.4 Resumen */
  return (
    <main class="columna">
      <h1 class="t-display cabecera">{t('importar.titulo')}</h1>
      <div class="centro" style="gap: 24px">
        <div class="cifra">{t('importar.listo')}</div>
        <div style="display: flex; flex-direction: column; gap: 12px" class="resumen">
          <div>{negrita(t('importar.importadas', { n: resumen.importadas }), resumen.importadas)}</div>
          <div>{negrita(t('importar.saltadas', { n: resumen.saltadas }), resumen.saltadas)}</div>
          <div>{negrita(t('importar.porOrganizar', { n: resumen.porOrganizar }), resumen.porOrganizar)}</div>
        </div>
      </div>
      <BarraInferior>
        <Boton onClick={() => navegar('/', { reemplazar: true })} icono={flecha}>{t('importar.verJoyero')}</Boton>
      </BarraInferior>
    </main>
  );
}

/** Pone en negrita el número dentro de la frase. */
function negrita(frase, n) {
  const s = String(n);
  const i = frase.indexOf(s);
  if (i < 0) return frase;
  return <>{frase.slice(0, i)}<b style="font-weight: 700; font-variant-numeric: tabular-nums">{s}</b>{frase.slice(i + s.length)}</>;
}
