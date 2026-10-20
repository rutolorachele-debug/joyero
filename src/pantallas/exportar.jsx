import { useMemo, useState } from 'preact/hooks';
import { Search, Download } from 'lucide-preact';
import { t } from '../i18n/index.js';
import { usarJoyero } from '../estado.jsx';
import { volver } from '../ruta.js';
import { filtrar, porOrganizar } from '../lib/filtros.js';
import { crearArchivoFavoritos, nombreArchivo, descargarTexto } from '../lib/favoritos.js';
import { Boton, BotonAtras, BarraInferior, Casilla } from '../componentes/base.jsx';
import { FilaChips } from '../componentes/filtros.jsx';

const SIN_FILTROS = { busqueda: '', tipos: [], temas: [], porOrganizar: false };

/*
 * 4.4 Exportar tu joyero.
 * Al abrir, todas las joyas están marcadas. Se exportan las joyas marcadas que se ven:
 * así, si filtras, exportas solo lo filtrado. Lo que desmarcas sigue desmarcado al cambiar de filtro.
 */
export function Exportar() {
  const { datos } = usarJoyero();
  const [f, setF] = useState(SIN_FILTROS);
  const [abierto, setAbierto] = useState(null);
  const [desmarcadas, setDesmarcadas] = useState(() => new Set());
  const cambiar = (nuevo) => setF({ ...f, ...nuevo });
  const quitarFiltros = () => setF({ ...f, tipos: [], temas: [], porOrganizar: false });

  const hayPorOrganizar = datos.joyas.some(porOrganizar);
  const visibles = useMemo(() => filtrar(datos.joyas, f), [datos.joyas, f]);
  const elegidas = visibles.filter((j) => !desmarcadas.has(j.id));
  const todasMarcadas = visibles.length > 0 && elegidas.length === visibles.length;

  const alternar = (id) => {
    const n = new Set(desmarcadas);
    if (n.has(id)) n.delete(id); else n.add(id);
    setDesmarcadas(n);
  };
  const alternarTodas = () => {
    const n = new Set(desmarcadas);
    visibles.forEach((j) => (todasMarcadas ? n.add(j.id) : n.delete(j.id)));
    setDesmarcadas(n);
  };
  const exportar = () => descargarTexto(crearArchivoFavoritos(elegidas, t('biblioteca.porOrganizar')), nombreArchivo());

  return (
    <main class="columna">
      <div class="cabecera solo-izq"><BotonAtras onClick={() => volver('/ajustes')} /></div>
      <h1 class="t-display titulo-bajo">{t('exportar.titulo')}</h1>

      <label class="buscador sq" style="margin-top: 48px">
        <Search size={20} strokeWidth={2.25} aria-hidden="true" />
        <span class="oculto">{t('biblioteca.buscarEtiqueta')}</span>
        <input type="search" id="exportar-buscar" value={f.busqueda} placeholder={t('biblioteca.buscar')} enterKeyHint="search"
          onInput={(e) => cambiar({ busqueda: e.currentTarget.value })} />
      </label>
      <FilaChips f={f} cambiar={cambiar} quitarFiltros={quitarFiltros} hayPorOrganizar={hayPorOrganizar} abierto={abierto} setAbierto={setAbierto} />

      {visibles.length > 0 && (
        <button type="button" class="enlace" style="margin-top: 24px; align-self: flex-start" onClick={alternarTodas}>
          {t(todasMarcadas ? 'exportar.deseleccionarTodas' : 'exportar.seleccionarTodas')}
        </button>
      )}

      <div class="lista" style="margin-top: 16px">
        {visibles.map((j) => {
          const m = !desmarcadas.has(j.id);
          return (
            <label class="fila-lista arriba" key={j.id} style="cursor: pointer">
              <input type="checkbox" class="oculto" checked={m} onChange={() => alternar(j.id)} />
              <span style="margin-top: 2px"><Casilla marcada={m} /></span>
              <span class="crece">
                <span class="t-fuerte" style="overflow-wrap: anywhere">{j.titulo}</span>
                {j.autor && <span class="t-sec" style="overflow-wrap: anywhere">{j.autor}</span>}
              </span>
            </label>
          );
        })}
        {!visibles.length && <p class="t-sec">{datos.joyas.length ? t('biblioteca.sinResultados') : t('biblioteca.vacia')}</p>}
      </div>

      <BarraInferior>
        <Boton disabled={!elegidas.length} onClick={exportar} icono={<Download size={20} strokeWidth={2} aria-hidden="true" />}>
          {elegidas.length === 1 ? t('exportar.exportar1') : t('exportar.exportarN', { n: elegidas.length })}
        </Boton>
      </BarraInferior>
    </main>
  );
}
