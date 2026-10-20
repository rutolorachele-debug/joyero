import { useState } from 'preact/hooks';
import { Layers, ChevronRight, LogOut, Pencil, X, Trash2, Download } from 'lucide-preact';
import { t, nJoyas } from '../i18n/index.js';
import { usarJoyero } from '../estado.jsx';
import { navegar, volver } from '../ruta.js';
import { contar } from '../lib/filtros.js';
import { cambiarCategoriaEnFijados } from '../lib/fijados.js';
import { normalizar, nombreValido } from '../lib/texto.js';
import { claveError } from '../lib/api.js';
import { Boton, BotonAtras, BotonIcono, Dialogo } from '../componentes/base.jsx';
import { IconoTipo } from '../componentes/iconos.jsx';
import { NuevaCategoria, RejillaIconos, usarCambiarIcono } from '../componentes/categorias.jsx';

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (e) {
    const area = document.createElement('textarea');
    area.value = texto;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    area.remove();
    return ok;
  }
}

/* 4.1 Ajustes */
export function Ajustes() {
  const { codigo, salir } = usarJoyero();
  const [visible, setVisible] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    if (await copiarTexto(codigo)) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };
  return (
    <main class="columna sin-barra">
      <div class="cabecera solo-izq"><BotonAtras onClick={() => volver('/')} /></div>
      <h1 class="t-display titulo-bajo">{t('ajustes.titulo')}</h1>
      <div style="margin-top: 48px; display: flex; flex-direction: column; gap: 24px">
        <a class="fila-lista" href="#/categorias" onClick={(e) => { e.preventDefault(); navegar('/categorias'); }}>
          <span class="circulo c28"><Layers size={16} strokeWidth={2.25} aria-hidden="true" /></span>
          <span class="crece"><span class="t-fuerte">{t('ajustes.categorias')}</span><span class="t-sec">{t('ajustes.categoriasSub')}</span></span>
          <ChevronRight size={20} strokeWidth={2.5} color="var(--gris-icono)" aria-hidden="true" />
        </a>
        <a class="fila-lista" href="#/exportar" onClick={(e) => { e.preventDefault(); navegar('/exportar'); }}>
          <span class="circulo c28"><Download size={16} strokeWidth={2.25} aria-hidden="true" /></span>
          <span class="crece"><span class="t-fuerte">{t('exportar.titulo')}</span><span class="t-sec">{t('exportar.sub')}</span></span>
          <ChevronRight size={20} strokeWidth={2.5} color="var(--gris-icono)" aria-hidden="true" />
        </a>
        <div class="caja sq">
          <div style="font-size: 14px; line-height: 20px; font-weight: 600">{t('ajustes.codigo')}</div>
          <div class="t-fuerte" style="font-weight: 500; letter-spacing: 0.04em; overflow-wrap: anywhere">
            {visible ? codigo : 'joy_' + '•'.repeat(16)}
          </div>
          <div style="display: flex; gap: 8px">
            <button type="button" class="sm sq" aria-pressed={visible ? 'true' : 'false'} onClick={() => setVisible(!visible)}>{t(visible ? 'ajustes.ocultar' : 'ajustes.mostrar')}</button>
            <button type="button" class="sm sq" onClick={copiar} aria-live="polite">{t(copiado ? 'ajustes.copiado' : 'ajustes.copiar')}</button>
          </div>
          <div class="t-sec">{t('ajustes.codigoTexto')}</div>
        </div>
      </div>
      <div class="espacio" style="min-height: 48px" />
      <div style="display: flex; flex-direction: column; gap: 8px">
        <Boton variante="secundario" style="background: var(--sup1)" onClick={() => { salir(); navegar('/entrar', { reemplazar: true }); }}
          icono={<LogOut size={20} strokeWidth={2} aria-hidden="true" />}>{t('ajustes.salir')}</Boton>
        <div class="t-sec">{t('ajustes.salirTexto')}</div>
      </div>
      <div style="margin-top: 24px">
        <a class="btn sq eliminar" href="#/eliminar" onClick={(e) => { e.preventDefault(); navegar('/eliminar'); }}>
          <span>{t('eliminar.titulo')}</span><Trash2 size={20} strokeWidth={2} aria-hidden="true" />
        </a>
      </div>
    </main>
  );
}

/* 4.2 Categorías · 4.3 Opciones de categoría */
export function Categorias() {
  const { datos, api, guardarDatos } = usarJoyero();
  const [pestana, setPestana] = useState('tipo');
  const [abierta, setAbierta] = useState(null);
  const [modo, setModo] = useState(null); // 'icono' | 'renombrar'
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [eliminar, setEliminar] = useState(null);
  const [creando, setCreando] = useState(false);
  const [recienCreado, setRecienCreado] = useState(null);
  const cambiarIcono = usarCambiarIcono();

  const lista = pestana === 'tipo' ? datos.tipos : datos.temas.map((nombre) => ({ nombre }));
  const cerrar = () => { setAbierta(null); setModo(null); setError(''); };
  const abrir = (n) => { setAbierta(n); setModo(null); setError(''); setCreando(false); setRecienCreado(null); };

  const ejecutar = async (fn) => {
    setOcupado(true);
    setError('');
    try { await fn(); return true; } catch (e) { setError(t(claveError(e))); return false; } finally { setOcupado(false); }
  };

  const renombrar = async (viejo) => {
    const n = nombreValido(nuevoNombre);
    if (!n) { setError(nuevoNombre.includes(',') ? t('categoria.sinComas') : ''); return; }
    if (n === viejo) { setModo(null); return; }
    const nombres = (pestana === 'tipo' ? datos.tipos.map((x) => x.nombre) : datos.temas).filter((x) => x !== viejo);
    if (nombres.some((x) => normalizar(x) === normalizar(n))) { setError(t('categoria.existe')); return; }
    const ok = await ejecutar(async () => {
      const r = await api('renombrarCategoria', { clase: pestana, nombre: viejo, nuevo: n });
      const nuevo = r.nombre || n;
      const joyas = datos.joyas.map((j) => (pestana === 'tipo'
        ? (j.tipo === viejo ? { ...j, tipo: nuevo } : j)
        : ((j.temas || []).includes(viejo) ? { ...j, temas: j.temas.map((x) => (x === viejo ? nuevo : x)) } : j)));
      const fijados = cambiarCategoriaEnFijados(datos.fijados, pestana, viejo, nuevo);
      guardarDatos(pestana === 'tipo'
        ? { ...datos, joyas, fijados, tipos: datos.tipos.map((x) => (x.nombre === viejo ? { ...x, nombre: nuevo } : x)) }
        : { ...datos, joyas, fijados, temas: datos.temas.map((x) => (x === viejo ? nuevo : x)) });
      setAbierta(nuevo);
    });
    if (ok) setModo(null);
  };

  const confirmarEliminar = async () => {
    const viejo = eliminar;
    const ok = await ejecutar(async () => {
      await api('eliminarCategoria', { clase: pestana, nombre: viejo });
      const joyas = datos.joyas.map((j) => (pestana === 'tipo'
        ? (j.tipo === viejo ? { ...j, tipo: '' } : j)
        : ((j.temas || []).includes(viejo) ? { ...j, temas: j.temas.filter((x) => x !== viejo) } : j)));
      guardarDatos(pestana === 'tipo'
        ? { ...datos, joyas, fijados: cambiarCategoriaEnFijados(datos.fijados, pestana, viejo, null), tipos: datos.tipos.filter((x) => x.nombre !== viejo) }
        : { ...datos, joyas, fijados: cambiarCategoriaEnFijados(datos.fijados, pestana, viejo, null), temas: datos.temas.filter((x) => x !== viejo) });
    });
    setEliminar(null);
    if (ok) cerrar();
  };

  const tipoNuevo = recienCreado && pestana === 'tipo' && datos.tipos.find((x) => x.nombre === recienCreado);

  return (
    <main class="columna">
      <div class="cabecera solo-izq"><BotonAtras onClick={() => volver('/ajustes')} /></div>
      <h1 class="t-display titulo-bajo">{t('categorias.titulo')}</h1>
      <div class="pestanas" role="tablist" style="margin-top: 48px">
        {['tipo', 'tema'].map((p) => (
          <button type="button" key={p} role="tab" class="pestana" aria-selected={pestana === p ? 'true' : 'false'}
            onClick={() => { setPestana(p); cerrar(); setCreando(false); setRecienCreado(null); }}>
            {t(p === 'tipo' ? 'categorias.tipos' : 'categorias.temas')}
          </button>
        ))}
      </div>

      <div class="lista" style="margin-top: 24px" role="tabpanel">
        {lista.map((c) => {
          const abiertaEsta = abierta === c.nombre;
          return (
            <div key={c.nombre} style={abiertaEsta ? 'display: flex; flex-direction: column; gap: 8px; padding-bottom: 12px' : ''}>
              <div class="fila-lista" style="padding: 4px 0">
                {pestana === 'tipo' && <span class="circulo c28"><IconoTipo nombre={c.icono} size={16} /></span>}
                <span class="t-fuerte" style="flex: 1; min-width: 0; overflow-wrap: anywhere">{c.nombre}</span>
                <span class="num">{nJoyas(contar(datos.joyas, pestana, c.nombre))}</span>
                <span style="margin-right: -6px">
                  <BotonIcono etiqueta={abiertaEsta ? t('categorias.cerrarOpciones') : t('categorias.editar', { nombre: c.nombre })}
                    onClick={() => (abiertaEsta ? cerrar() : abrir(c.nombre))}>
                    {abiertaEsta ? <X size={16} strokeWidth={2.5} aria-hidden="true" /> : <Pencil size={16} strokeWidth={2.25} aria-hidden="true" />}
                  </BotonIcono>
                </span>
              </div>
              {abiertaEsta && modo === null && (
                <div style={`display: flex; gap: 8px; flex-wrap: wrap; padding-left: ${pestana === 'tipo' ? 44 : 0}px`}>
                  {pestana === 'tipo' && <button type="button" class="sm sq" onClick={() => setModo('icono')}>{t('categorias.cambiarIcono')}</button>}
                  <button type="button" class="sm sq" onClick={() => { setModo('renombrar'); setNuevoNombre(c.nombre); }}>{t('categorias.renombrar')}</button>
                  <button type="button" class="sm sq rojo" onClick={() => setEliminar(c.nombre)}>{t('categorias.eliminar')}</button>
                </div>
              )}
              {abiertaEsta && modo === 'icono' && (
                <RejillaIconos elegido={c.icono} onElegir={(icono) => ejecutar(() => cambiarIcono(c.nombre, icono)).then((ok) => ok && setModo(null))} />
              )}
              {abiertaEsta && modo === 'renombrar' && (
                <form style="display: flex; flex-direction: column; gap: 8px" onSubmit={(e) => { e.preventDefault(); renombrar(c.nombre); }}>
                  <label class="oculto" for="renombrar">{t('categorias.renombrar')}</label>
                  <input id="renombrar" class="campo-caja sq" value={nuevoNombre} autoComplete="off" ref={(el) => el && !el.dataset.f && (el.dataset.f = '1', el.focus())}
                    onInput={(e) => { setNuevoNombre(e.currentTarget.value); setError(''); }} aria-invalid={error ? 'true' : undefined} />
                  {error && <div class="texto-error" style="margin-top: 0" role="alert">{error}</div>}
                  <div style="display: flex; gap: 8px; margin-top: 4px">
                    <button type="submit" class="sm sq primario" disabled={ocupado}>{t('comun.guardar')}</button>
                    <button type="button" class="sm sq" onClick={() => { setModo(null); setError(''); }}>{t('comun.cancelar')}</button>
                  </div>
                </form>
              )}
              {abiertaEsta && modo !== 'renombrar' && error && <div class="texto-error" style="margin-top: 0" role="alert">{error}</div>}
            </div>
          );
        })}
      </div>

      {creando
        ? <NuevaCategoria clase={pestana} onUsar={(n) => { setCreando(false); abrir(n); }}
            onCreado={(n) => { setCreando(false); if (pestana === 'tipo') setRecienCreado(n); }} onCancelar={() => setCreando(false)} />
        : (
          <button type="button" class="sq" style="margin-top: 16px; height: 52px; border-radius: 20px; background: transparent; border: 1.5px dashed var(--gris-icono); color: var(--texto2); font-size: 14px; font-weight: 600"
            onClick={() => { cerrar(); setCreando(true); setRecienCreado(null); }}>
            {t(pestana === 'tipo' ? 'categorias.anadirTipo' : 'categorias.anadirTema')}
          </button>
        )}
      {tipoNuevo && <RejillaIconos elegido={tipoNuevo.icono} onElegir={(icono) => cambiarIcono(tipoNuevo.nombre, icono).then(() => setRecienCreado(null)).catch(() => {})} />}

      <Dialogo abierto={!!eliminar} titulo={t('categorias.eliminarTitulo', { nombre: eliminar || '' })}
        texto={t('categorias.eliminarTexto', { n: eliminar ? contar(datos.joyas, pestana, eliminar) : 0 })} onCerrar={() => setEliminar(null)}>
        <Boton variante="peligro" cargando={ocupado} onClick={confirmarEliminar} icono={<Trash2 size={20} strokeWidth={2} aria-hidden="true" />}>{t('comun.eliminar')}</Boton>
        <Boton variante="terciario" onClick={() => setEliminar(null)} icono={<X size={20} strokeWidth={2} aria-hidden="true" />}>{t('comun.cancelar')}</Boton>
      </Dialogo>
    </main>
  );
}
