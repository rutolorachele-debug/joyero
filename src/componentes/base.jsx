import { useEffect, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { Check, ChevronLeft, X } from 'lucide-preact';
import { t } from '../i18n/index.js';
import { dominio } from '../lib/texto.js';
import * as almacen from '../lib/almacen.js';
import { IconoTipo } from './iconos.jsx';

/* ───────── Botones ───────── */

export function BotonIcono({ etiqueta, onClick, href, der, children }) {
  const contenido = <span>{children}</span>;
  if (href) return <a class={`bi${der ? ' der' : ''}`} href={href} aria-label={etiqueta}>{contenido}</a>;
  return <button type="button" class={`bi${der ? ' der' : ''}`} aria-label={etiqueta} onClick={onClick}>{contenido}</button>;
}

export function BotonAtras({ onClick, href }) {
  return (
    <BotonIcono etiqueta={t('comun.atras')} onClick={onClick} href={href}>
      <ChevronLeft size={18} strokeWidth={2.25} aria-hidden="true" />
    </BotonIcono>
  );
}

export function BotonCerrar({ onClick, etiqueta }) {
  return (
    <BotonIcono etiqueta={etiqueta || t('comun.cerrar')} onClick={onClick} der>
      <X size={16} strokeWidth={2.5} aria-hidden="true" />
    </BotonIcono>
  );
}

/** Botón de 56 con etiqueta a la izquierda e icono a la derecha. */
export function Boton({ variante = 'primario', icono, children, cargando, ...resto }) {
  return (
    <button type="button" class={`btn sq ${variante}${cargando ? ' cargando' : ''}`} aria-busy={cargando ? 'true' : undefined} {...resto}>
      <span>{children}</span>
      {icono}
    </button>
  );
}

export function BotonEnlace({ variante = 'primario', icono, children, ...resto }) {
  return (
    <a class={`btn sq ${variante}`} {...resto}>
      <span>{children}</span>
      {icono}
    </a>
  );
}

/** Zona fija abajo con la sombra degradada detrás de la CTA. */
export function BarraInferior({ children }) {
  return <div class="fijo barra-inferior">{children}</div>;
}

/* ───────── Campos ───────── */

function autoAltura(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

/**
 * Campo sin recuadro. Vacío: el nombre del campo hace de placeholder grande.
 * Con valor (o escribiendo): nombre pequeño encima del valor.
 */
export function Campo({ id, etiqueta, valor, onInput, multilinea, ejemplo, error, cargando, tipo = 'text', autoFocus, onPaste, onBlur, inputMode, autoComplete = 'off', enterKeyHint }) {
  const [foco, setFoco] = useState(false);
  const ref = useRef(null);
  const lleno = valor !== '' && valor != null;
  const mostrarEtiqueta = lleno || foco || cargando;
  useEffect(() => { if (multilinea) autoAltura(ref.current); }, [valor, multilinea, mostrarEtiqueta]);
  useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, []);
  const clases = ['campo', lleno ? 'lleno' : 'vacio', foco ? 'activo' : '', error ? 'error' : ''].join(' ');
  const props = {
    id, ref, value: valor || '',
    placeholder: mostrarEtiqueta ? '' : etiqueta,
    onInput: (e) => { onInput(e.currentTarget.value); if (multilinea) autoAltura(e.currentTarget); },
    onFocus: () => setFoco(true),
    onBlur: (e) => { setFoco(false); onBlur && onBlur(e); },
    onPaste,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
    autoComplete, autoCapitalize: tipo === 'url' ? 'off' : 'sentences', spellcheck: tipo !== 'url',
    inputMode, enterKeyHint
  };
  return (
    <div class={clases}>
      <label for={id} class={mostrarEtiqueta ? 'lab' : 'oculto'}>{etiqueta}</label>
      {cargando && !lleno
        ? <div class="esq" style="margin-top: 10px; height: 20px; width: 100%" aria-hidden="true" />
        : multilinea ? <textarea rows={1} {...props} /> : <input type={tipo} {...props} />}
      {ejemplo && !lleno && <div class="ejemplo">{ejemplo}</div>}
      {error && <div class="texto-error" id={`${id}-error`} role="alert">{error}</div>}
    </div>
  );
}

export function Casilla({ marcada }) {
  return (
    <span class={`casilla sq${marcada ? ' marcada' : ''}`} aria-hidden="true">
      {marcada && <Check size={16} strokeWidth={3} />}
    </span>
  );
}

/* ───────── Capas ───────── */

function usarEscape(activo, fn) {
  useEffect(() => {
    if (!activo) return undefined;
    const tecla = (e) => { if (e.key === 'Escape') fn(); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [activo, fn]);
}

function bloquearScroll() {
  const previo = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  return () => { document.body.style.overflow = previo; };
}

/** Panel desde abajo (2.2). */
export function Panel({ abierto, onCerrar, etiqueta, children }) {
  usarEscape(abierto, onCerrar);
  useEffect(() => (abierto ? bloquearScroll() : undefined), [abierto]);
  if (!abierto) return null;
  return createPortal(
    <>
      <div class="velo" onClick={onCerrar} />
      <div class="fijo panel sq" role="dialog" aria-modal="true" aria-label={etiqueta}>
        <div class="asa" aria-hidden="true" />
        {children}
      </div>
    </>,
    document.body
  );
}

/** Diálogo centrado (2.3b, 2.7, 4.3). Las acciones en columna, la principal arriba. */
export function Dialogo({ abierto, titulo, texto, onCerrar, children }) {
  const ref = useRef(null);
  usarEscape(abierto, onCerrar);
  useEffect(() => {
    if (!abierto) return undefined;
    const desbloquear = bloquearScroll();
    const previo = document.activeElement;
    setTimeout(() => { const b = ref.current && ref.current.querySelector('button'); if (b) b.focus(); }, 0);
    return () => { desbloquear(); if (previo && previo.focus) previo.focus(); };
  }, [abierto]);
  if (!abierto) return null;
  return createPortal(
    <>
      <div class="velo" onClick={onCerrar} />
      <div class="dialogo-zona">
        <div class="dialogo sq" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-x" ref={ref}>
          <h2 class="t-dialogo" id="dlg-t">{titulo}</h2>
          <p class="t-cuerpo gris" id="dlg-x" style="margin-top: 8px">{texto}</p>
          <div class="acciones">{children}</div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ───────── Iconos de joya ───────── */

const favicons = almacen.leer('favicons', {});
let guardarFaviconsPendiente = null;
function recordarFavicon(host, ok) {
  favicons[host] = ok ? 1 : 0;
  clearTimeout(guardarFaviconsPendiente);
  guardarFaviconsPendiente = setTimeout(() => {
    const claves = Object.keys(favicons);
    if (claves.length > 1500) claves.slice(0, claves.length - 1500).forEach((k) => delete favicons[k]);
    almacen.guardar('favicons', favicons);
  }, 500);
}

/**
 * Icono de la joya: la favicon del sitio si es de buena calidad (32 px o más);
 * si no, el icono del tipo (o la gema genérica).
 */
export function IconoJoya({ joya, tipos, grande }) {
  const host = dominio(joya.url);
  const conocido = host ? favicons[host] : 0;
  const [estado, setEstado] = useState(conocido === 0 ? 'tipo' : 'probando');
  useEffect(() => { setEstado(host && favicons[host] !== 0 ? 'probando' : 'tipo'); }, [host]);
  const tipo = tipos.find((x) => x.nombre === joya.tipo);
  const clase = `circulo ${grande ? 'c48' : 'c28'}`;
  const iconoTipo = <IconoTipo nombre={tipo ? tipo.icono : ''} size={grande ? 24 : 16} />;
  if (estado === 'tipo') return <span class={clase} aria-hidden="true">{iconoTipo}</span>;
  return (
    <span class={clase} aria-hidden="true">
      <img
        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`}
        alt=""
        loading="lazy"
        referrerpolicy="no-referrer"
        style={estado === 'probando' && conocido !== 1 ? 'opacity: 0' : ''}
        onLoad={(e) => {
          const ok = e.currentTarget.naturalWidth >= 32;
          recordarFavicon(host, ok);
          setEstado(ok ? 'favicon' : 'tipo');
        }}
        onError={() => { recordarFavicon(host, false); setEstado('tipo'); }}
      />
    </span>
  );
}

export function EsqueletoLista({ filas = 4 }) {
  return (
    <div class="lista" aria-hidden="true">
      {Array.from({ length: filas }, (_, i) => (
        <div class="card" key={i}>
          <span class="esq" style="width: 28px; height: 28px; border-radius: 999px; flex: none" />
          <div class="cuerpo" style="display: flex; flex-direction: column; gap: 8px; padding-top: 4px">
            <span class="esq" style={`height: 14px; width: ${[80, 65, 72, 58][i % 4]}%`} />
            <span class="esq" style={`height: 10px; width: ${[45, 35, 50, 40][i % 4]}%`} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Aviso de error con acción opcional (derivado, provisional). */
export function Aviso({ texto, accion, onAccion }) {
  return (
    <div class="aviso sq" role="alert">
      <span class="txt">{texto}</span>
      {accion && <button type="button" class="sm sq" onClick={onAccion}>{accion}</button>}
    </div>
  );
}

/** Texto con <b> del archivo de traducciones, sin permitir otro HTML. */
export function TextoConNegritas({ texto }) {
  const partes = String(texto).split(/(<b>.*?<\/b>)/g);
  return partes.map((p, i) => (p.startsWith('<b>') ? <b key={i}>{p.slice(3, -4)}</b> : p));
}
