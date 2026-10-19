import { useEffect, useRef, useState } from 'preact/hooks';
import { Check, X, Trash2, ExternalLink, Pencil } from 'lucide-preact';
import { t } from '../i18n/index.js';
import { usarJoyero } from '../estado.jsx';
import { navegar, volver } from '../ruta.js';
import { completarUrl, esUrlValida, nuevoId } from '../lib/texto.js';
import { ErrorJoyero } from '../lib/api.js';
import { Boton, BotonAtras, BotonCerrar, BotonIcono, BarraInferior, Campo, Dialogo, IconoJoya } from '../componentes/base.jsx';
import { SelectorTipo, SelectorTemas } from '../componentes/categorias.jsx';

const VACIA = { url: '', titulo: '', descripcion: '', autor: '', tipo: '', temas: [], nota: '' };

function errorGuardar(e) {
  if (e instanceof ErrorJoyero && e.codigo === 'sin_conexion') return t('errores.sinConexion');
  if (e instanceof ErrorJoyero && e.codigo === 'clave') return t('errores.clave');
  return t('errores.guardar');
}

/* 2.3 Añadir joya · 2.6 Editar joya */
export function Formulario({ id }) {
  const { datos, hayDatos, api, ponerJoya, quitarJoya } = usarJoyero();
  const editando = !!id;
  const original = editando ? datos.joyas.find((j) => j.id === id) : null;
  const [joya, setJoya] = useState(() => (original ? { ...VACIA, ...original, temas: [...(original.temas || [])] } : { ...VACIA }));
  const [leyendo, setLeyendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [duplicado, setDuplicado] = useState(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const idNuevo = useRef(nuevoId()); // la misma petición repetida no crea dos joyas
  const ultimoLeido = useRef(original ? original.url : '');
  const tocado = useRef({ tipo: false, temas: false });
  const temporizador = useRef(null);
  useEffect(() => () => clearTimeout(temporizador.current), []);
  const actual = useRef(joya);
  actual.current = joya;

  // La joya ya no existe (borrada desde otro dispositivo): volver a la biblioteca.
  useEffect(() => { if (editando && hayDatos && !original) navegar('/', { reemplazar: true }); }, [editando, hayDatos, original]);

  const poner = (campo, valor) => setJoya((j) => ({ ...j, [campo]: valor }));

  /** Al pegar o escribir un link, el script lee la página y rellena solo los campos vacíos. */
  const leerPagina = async (texto) => {
    const url = completarUrl(texto);
    if (!url || url === ultimoLeido.current) return;
    ultimoLeido.current = url;
    setLeyendo(true);
    try {
      const r = await api('metadatos', { url });
      if (ultimoLeido.current !== url) return;
      aplicarMetadatos(r);
    } catch (e) {
      if (ultimoLeido.current === url && e instanceof ErrorJoyero && e.datos) aplicarMetadatos(e.datos);
    } finally {
      if (ultimoLeido.current === url) setLeyendo(false);
    }
  };

  const aplicarMetadatos = (r) => {
    setJoya((j) => {
      const n = { ...j };
      if (!n.titulo && r.titulo) n.titulo = r.titulo;
      if (!n.descripcion && r.descripcion) n.descripcion = r.descripcion;
      if (!n.autor && r.autor) n.autor = r.autor;
      if (!n.tipo && !tocado.current.tipo && r.tipo) n.tipo = r.tipo;
      if (!tocado.current.temas && Array.isArray(r.temas) && r.temas.length) {
        n.temas = n.temas.concat(r.temas.filter((x) => !n.temas.includes(x)));
      }
      return n;
    });
  };

  const alCambiarLink = (v) => {
    poner('url', v);
    setError('');
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => leerPagina(v), 700);
  };

  const urlFinal = completarUrl(joya.url) || joya.url.trim();
  const valida = esUrlValida(urlFinal) && joya.titulo.trim();

  const guardar = async (forzar = false) => {
    if (!valida || guardando) return;
    setGuardando(true);
    setError('');
    const enviar = { ...actual.current, url: urlFinal };
    try {
      const r = await api('guardar', { joya: enviar, forzar, idNuevo: editando ? undefined : idNuevo.current });
      ponerJoya(r.joya);
      if (editando) volver(`/joya/${id}`);
      else navegar('/', { reemplazar: true });
    } catch (e) {
      if (e instanceof ErrorJoyero && e.codigo === 'duplicado') setDuplicado(e.datos.titulo || '');
      else setError(errorGuardar(e));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    setGuardando(true);
    try {
      await api('eliminar', { id });
      quitarJoya(id);
      setConfirmarEliminar(false);
      navegar('/', { reemplazar: true });
    } catch (e) {
      setConfirmarEliminar(false);
      setError(errorGuardar(e));
    } finally {
      setGuardando(false);
    }
  };

  if (editando && !original) return <main class="columna" />;

  return (
    <main class="columna">
      <div class="cabecera">
        <h1 class="t-display">{t(editando ? 'formulario.tituloEditar' : 'formulario.tituloAnadir')}</h1>
        <BotonCerrar onClick={() => volver(editando ? `/joya/${id}` : '/')} />
      </div>

      <form class="campos" style="margin-top: 48px" onSubmit={(e) => { e.preventDefault(); guardar(); }}>
        <Campo id="f-link" etiqueta={t('formulario.link')} valor={joya.url} tipo="url" inputMode="url"
          onInput={alCambiarLink} autoFocus={!editando}
          onBlur={() => { const c = completarUrl(joya.url); if (c && c !== joya.url) poner('url', c); leerPagina(joya.url); }} />
        <Campo id="f-titulo" etiqueta={t('formulario.titulo')} valor={joya.titulo} cargando={leyendo}
          onInput={(v) => poner('titulo', v)} />
        <Campo id="f-desc" etiqueta={t('formulario.descripcion')} valor={joya.descripcion} multilinea
          onInput={(v) => poner('descripcion', v)} />
        <Campo id="f-autor" etiqueta={t('formulario.autor')} valor={joya.autor} onInput={(v) => poner('autor', v)} />
        <SelectorTipo valor={joya.tipo} onCambiar={(v) => { tocado.current.tipo = true; poner('tipo', v); }} />
        <SelectorTemas valor={joya.temas} onCambiar={(v) => { tocado.current.temas = true; poner('temas', v); }} />
        <Campo id="f-nota" etiqueta={t('formulario.nota')} valor={joya.nota} multilinea onInput={(v) => poner('nota', v)} />
        <button type="submit" class="oculto" tabIndex={-1} aria-hidden="true" />
      </form>

      {editando && (
        <div style="margin-top: 48px">
          <Boton variante="eliminar" onClick={() => setConfirmarEliminar(true)} icono={<Trash2 size={20} strokeWidth={2} aria-hidden="true" />}>
            {t('formulario.eliminarJoya')}
          </Boton>
        </div>
      )}

      <BarraInferior>
        <div class="pila">
          {error && <div class="texto-error" role="alert" style="margin: 0 0 4px">{error}</div>}
          <Boton disabled={!valida} cargando={guardando} onClick={() => guardar(false)} icono={<Check size={20} strokeWidth={2} aria-hidden="true" />}>
            {t('comun.guardar')}
          </Boton>
        </div>
      </BarraInferior>

      <Dialogo abierto={duplicado !== null} titulo={t('formulario.duplicadoTitulo')}
        texto={t('formulario.duplicadoTexto', { titulo: duplicado || '' })} onCerrar={() => setDuplicado(null)}>
        <Boton onClick={() => { setDuplicado(null); guardar(true); }} icono={<Check size={20} strokeWidth={2} aria-hidden="true" />}>{t('formulario.guardarIgualmente')}</Boton>
        <Boton variante="terciario" onClick={() => setDuplicado(null)} icono={<X size={20} strokeWidth={2} aria-hidden="true" />}>{t('comun.cancelar')}</Boton>
      </Dialogo>

      <Dialogo abierto={confirmarEliminar} titulo={t('formulario.eliminarTitulo')} texto={t('formulario.eliminarTexto')}
        onCerrar={() => setConfirmarEliminar(false)}>
        <Boton variante="peligro" cargando={guardando} onClick={eliminar} icono={<Trash2 size={20} strokeWidth={2} aria-hidden="true" />}>{t('comun.eliminar')}</Boton>
        <Boton variante="terciario" onClick={() => setConfirmarEliminar(false)} icono={<X size={20} strokeWidth={2} aria-hidden="true" />}>{t('comun.cancelar')}</Boton>
      </Dialogo>
    </main>
  );
}

/* 2.5 Detalle de joya (solo lectura) */
export function Detalle({ id }) {
  const { datos, hayDatos } = usarJoyero();
  const j = datos.joyas.find((x) => x.id === id);
  useEffect(() => { if (hayDatos && !j) navegar('/', { reemplazar: true }); }, [hayDatos, j]);
  if (!j) return <main class="columna" />;
  return (
    <main class="columna sin-barra">
      <div class="cabecera" style="margin: 0 -6px">
        <BotonAtras onClick={() => volver('/')} />
        <BotonIcono etiqueta={t('detalle.editar')} onClick={() => navegar(`/joya/${id}/editar`)}>
          <Pencil size={16} strokeWidth={2.25} aria-hidden="true" />
        </BotonIcono>
      </div>
      <div style="margin-top: 48px"><IconoJoya joya={j} tipos={datos.tipos} grande /></div>
      <h1 class="t-display" style="margin-top: 16px; overflow-wrap: anywhere">{j.titulo}</h1>
      {j.autor && <div class="t-sec" style="margin-top: 2px">{j.autor}</div>}
      {j.descripcion && <p class="t-cuerpo gris" style="margin-top: 12px; overflow-wrap: anywhere">{j.descripcion}</p>}
      <a class="btn sq primario" style="margin-top: 24px" href={j.url} target="_blank" rel="noopener noreferrer">
        <span>{t('detalle.abrir')}</span><ExternalLink size={20} strokeWidth={2} aria-hidden="true" />
      </a>
      <div style="margin-top: 48px; display: flex; flex-direction: column; gap: 28px">
        {j.tipo && <div><div class="t-sec">{t('detalle.tipo')}</div><div class="t-fuerte" style="margin-top: 6px">{j.tipo}</div></div>}
        {j.temas && j.temas.length > 0 && (
          <div><div class="t-sec">{t('detalle.temas')}</div>
            <div class="etiquetas" style="margin-top: 6px">{j.temas.map((x) => <span class="etiqueta sq" key={x}>{x}</span>)}</div>
          </div>
        )}
        {j.nota && <div><div class="t-sec">{t('detalle.nota')}</div><div class="t-nota" style="margin-top: 6px">{j.nota}</div></div>}
      </div>
    </main>
  );
}
