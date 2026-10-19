import { useEffect, useRef, useState } from 'preact/hooks';
import { Plus } from 'lucide-preact';
import { t } from '../i18n/index.js';
import { usarJoyero } from '../estado.jsx';
import { similares, normalizar, nombreValido } from '../lib/texto.js';
import { claveError } from '../lib/api.js';
import { IconoTipo, NOMBRES_ICONOS, ICONO_GENERICO } from './iconos.jsx';

/**
 * Campo para crear un tipo o un tema (2.4). Mientras se escribe, muestra primero las categorías
 * parecidas («Usar este») y al final «Crear «texto»».
 */
export function NuevaCategoria({ clase, onUsar, onCreado, onCancelar }) {
  const { datos, api, guardarDatos } = usarJoyero();
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const ref = useRef(null);
  const zona = useRef(null);
  useEffect(() => { if (ref.current) ref.current.focus(); }, []);

  const existentes = clase === 'tipo' ? datos.tipos.map((x) => x.nombre) : datos.temas;
  const limpio = nombreValido(texto);
  const sugeridas = texto.trim() ? similares(texto, existentes).slice(0, 5) : [];
  const igual = existentes.some((n) => normalizar(n) === normalizar(texto));

  const crear = async () => {
    if (!limpio || igual || enviando) return;
    setEnviando(true);
    setError('');
    try {
      const r = await api('crearCategoria', { clase, nombre: limpio, icono: ICONO_GENERICO });
      const nombre = r.nombre || limpio;
      if (clase === 'tipo') guardarDatos({ ...datos, tipos: datos.tipos.concat([{ nombre, icono: ICONO_GENERICO }]) });
      else guardarDatos({ ...datos, temas: datos.temas.concat([nombre]) });
      onCreado(nombre);
    } catch (e) {
      setError(t(claveError(e)));
    } finally {
      setEnviando(false);
    }
  };

  // Si se sale del campo sin haber escrito nada, vuelve la chip «+ Nuevo…».
  const alSalir = (e) => {
    if (zona.current && zona.current.contains(e.relatedTarget)) return;
    if (!texto.trim() && !enviando) onCancelar();
  };

  return (
    <div ref={zona} style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px; width: 100%">
      <label class="oculto" for={`nueva-${clase}`}>{t(clase === 'tipo' ? 'categoria.nuevaTipo' : 'categoria.nuevaTema')}</label>
      <input id={`nueva-${clase}`} ref={ref} class="campo-caja sq" value={texto} autoComplete="off" enterKeyHint="done"
        onInput={(e) => { setTexto(e.currentTarget.value); setError(''); }}
        onBlur={alSalir}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancelar();
          if (e.key === 'Enter') { e.preventDefault(); if (sugeridas[0] && igual) onUsar(sugeridas[0]); else crear(); }
        }} />
      {texto.includes(',') && <div class="texto-error" style="margin-top: 0">{t('categoria.sinComas')}</div>}
      {error && <div class="texto-error" style="margin-top: 0" role="alert">{error}</div>}
      {sugeridas.map((n) => (
        <div class="fila-lista" key={n} style="justify-content: space-between">
          <span class="t-fuerte" style="min-width: 0; overflow-wrap: anywhere">{n}</span>
          <button type="button" class="sm sq" onClick={() => onUsar(n)}>{t('categoria.usarEste')}</button>
        </div>
      ))}
      {limpio && !igual && (
        <button type="button" class="fila-lista" style="border: 0; background: none; text-align: left; width: 100%; padding-left: 0; padding-right: 0; padding-top: 4px" onClick={crear} disabled={enviando} aria-busy={enviando ? 'true' : undefined}>
          <span class="circulo c28"><Plus size={16} strokeWidth={2.5} aria-hidden="true" /></span>
          <span class="t-fuerte" style="min-width: 0; overflow-wrap: anywhere">{t('categoria.crear', { texto: limpio })}</span>
        </button>
      )}
    </div>
  );
}

/** Rejilla de iconos para un tipo. */
export function RejillaIconos({ elegido, onElegir }) {
  return (
    <div class="rejilla" role="radiogroup" aria-label={t('categoria.iconos')} style="margin-top: 12px">
      {NOMBRES_ICONOS.map((n) => (
        <button type="button" key={n} role="radio" aria-checked={elegido === n ? 'true' : 'false'} aria-label={n}
          class={`celda sq${elegido === n ? ' activa' : ''}`} onClick={() => onElegir(n)}>
          <IconoTipo nombre={n} size={20} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}

/** Cambia el icono de un tipo en la hoja y en la app. */
export function usarCambiarIcono() {
  const { datos, api, guardarDatos } = usarJoyero();
  return async (nombre, icono) => {
    await api('cambiarIcono', { nombre, icono });
    guardarDatos({ ...datos, tipos: datos.tipos.map((x) => (x.nombre === nombre ? { ...x, icono } : x)) });
  };
}

/** Tipo: una sola opción (o ninguna), con «+ Nuevo tipo». */
export function SelectorTipo({ valor, onCambiar }) {
  const { datos } = usarJoyero();
  const [creando, setCreando] = useState(false);
  const [recienCreado, setRecienCreado] = useState(null);
  const [error, setError] = useState('');
  const cambiarIcono = usarCambiarIcono();
  const tipoNuevo = recienCreado && datos.tipos.find((x) => x.nombre === recienCreado);
  return (
    <div class="grupo">
      <div class="lab" id="lab-tipo">{t('formulario.tipo')}</div>
      <div class="chips" role="radiogroup" aria-labelledby="lab-tipo">
        {datos.tipos.map((x) => (
          <button type="button" key={x.nombre} role="radio" aria-checked={valor === x.nombre ? 'true' : 'false'}
            class={`chip con-icono sq${valor === x.nombre ? ' activo' : ''}`}
            onClick={() => onCambiar(valor === x.nombre ? '' : x.nombre)}>
            <span class="ci"><IconoTipo nombre={x.icono} size={14} /></span>{x.nombre}
          </button>
        ))}
        {!creando && <button type="button" class="chip nuevo sq" onClick={() => { setCreando(true); setRecienCreado(null); }}>{t('formulario.nuevoTipo')}</button>}
      </div>
      {creando && (
        <NuevaCategoria clase="tipo"
          onUsar={(n) => { onCambiar(n); setCreando(false); }}
          onCreado={(n) => { onCambiar(n); setCreando(false); setRecienCreado(n); }}
          onCancelar={() => setCreando(false)} />
      )}
      {tipoNuevo && (
        <>
          <RejillaIconos elegido={tipoNuevo.icono} onElegir={async (icono) => {
            setError('');
            try { await cambiarIcono(tipoNuevo.nombre, icono); setRecienCreado(null); } catch (e) { setError(t(claveError(e))); }
          }} />
          {error && <div class="texto-error" role="alert">{error}</div>}
        </>
      )}
    </div>
  );
}

/** Temas: varias opciones, con «+ Nuevo tema». */
export function SelectorTemas({ valor, onCambiar }) {
  const { datos } = usarJoyero();
  const [creando, setCreando] = useState(false);
  const alternar = (n) => onCambiar(valor.includes(n) ? valor.filter((x) => x !== n) : valor.concat([n]));
  const anadir = (n) => { if (!valor.includes(n)) onCambiar(valor.concat([n])); setCreando(false); };
  return (
    <div class="grupo">
      <div class="lab" id="lab-temas">{t('formulario.temas')}</div>
      <div class="chips" role="group" aria-labelledby="lab-temas">
        {datos.temas.map((n) => (
          <button type="button" key={n} aria-pressed={valor.includes(n) ? 'true' : 'false'}
            class={`chip sq${valor.includes(n) ? ' activo' : ''}`} onClick={() => alternar(n)}>{n}</button>
        ))}
        {!creando && <button type="button" class="chip nuevo sq" onClick={() => setCreando(true)}>{t('formulario.nuevoTema')}</button>}
      </div>
      {creando && <NuevaCategoria clase="tema" onUsar={anadir} onCreado={anadir} onCancelar={() => setCreando(false)} />}
    </div>
  );
}
