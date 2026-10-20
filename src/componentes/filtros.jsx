import { useRef } from 'preact/hooks';
import { ChevronDown, ChevronUp, X } from 'lucide-preact';
import { t } from '../i18n/index.js';
import { usarJoyero } from '../estado.jsx';
import { hayFiltros } from '../lib/filtros.js';
import { Casilla } from './base.jsx';
import { IconoTipo } from './iconos.jsx';

// Fila de chips «Tipo ▾», «Tema ▾», «Por organizar» con sus menús. La usan Mi joyero (2.1) y Exportar (4.4).

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

/** `extra`: lo que va alineado a la derecha en la misma fila. */
export function FilaChips({ f, cambiar, limpiar, hayPorOrganizar, abierto, setAbierto, extra }) {
  const { datos } = usarJoyero();
  const refTipo = useRef(null);
  const refTema = useRef(null);
  const posicion = (ref) => (ref.current ? ref.current.offsetLeft : 0);
  return (
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
        {extra}

        {abierto && <div class="capa-transparente" onClick={() => setAbierto(null)} />}
        {abierto === 'tipo' && (
          <Desplegable etiqueta={t('biblioteca.tipo')} opciones={datos.tipos} elegidas={f.tipos} conIconos
            izquierda={posicion(refTipo)} onCambiar={(tipos) => cambiar({ tipos })} mostrarLimpiar={hayFiltros(f)} onLimpiar={limpiar} />
        )}
        {abierto === 'tema' && (
          <Desplegable etiqueta={t('biblioteca.tema')} opciones={datos.temas.map((nombre) => ({ nombre }))} elegidas={f.temas}
            izquierda={Math.max(0, posicion(refTema) - 60)} onCambiar={(temas) => cambiar({ temas })} mostrarLimpiar={hayFiltros(f)} onLimpiar={limpiar} />
        )}
      </div>
  );
}
