import { useState } from 'preact/hooks';
import { ArrowRight, Plus, ExternalLink } from 'lucide-preact';
import { t } from '../i18n/index.js';
import { usarJoyero } from '../estado.jsx';
import { navegar, volver } from '../ruta.js';
import { PLANTILLA_COPIA, CAPTURAS_TUTORIAL } from '../config.js';
import { BotonAtras, Boton, BotonEnlace, BarraInferior, Campo, TextoConNegritas } from '../componentes/base.jsx';

const flecha = (color) => <ArrowRight size={20} strokeWidth={2} color={color} aria-hidden="true" />;

/* 1.1 Ingreso */
export function Ingreso() {
  return (
    <main class="columna">
      <div class="centro" style="align-items: center; text-align: center; gap: 24px">
        <div class="sq" style="width: 96px; height: 96px; border-radius: 28px; background: var(--sup1); display: flex; align-items: center; justify-content: center; font-size: 12px; line-height: 16px; font-weight: 500; color: var(--gris-icono)">{t('ingreso.logo')}</div>
        <div style="display: flex; flex-direction: column; gap: 8px">
          <h1 class="t-marca">Joyero</h1>
          <p class="t-cuerpo gris">{t('ingreso.claim')}</p>
        </div>
      </div>
      <BarraInferior>
        <div class="pila">
          <BotonEnlace href="#/codigo" onClick={(e) => { e.preventDefault(); navegar('/codigo'); }} icono={flecha()}>{t('ingreso.yaTengo')}</BotonEnlace>
          <BotonEnlace variante="secundario" href="#/tutorial/1" onClick={(e) => { e.preventDefault(); navegar('/tutorial/1'); }} icono={<Plus size={20} strokeWidth={2} aria-hidden="true" />}>{t('ingreso.crear')}</BotonEnlace>
        </div>
      </BarraInferior>
    </main>
  );
}

/** Lógica común de 1.2 y del paso 6: comprobar el código y entrar. */
function usarEntrada() {
  const { entrar } = usarJoyero();
  const [texto, setTexto] = useState('');
  const [error, setError] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const enviar = async () => {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    setError(false);
    try {
      await entrar(texto);
      navegar('/', { reemplazar: true });
    } catch (e) {
      setError(true);
    } finally {
      setEnviando(false);
    }
  };
  return { texto, setTexto: (v) => { setTexto(v); setError(false); }, error, enviando, enviar };
}

function CampoCodigo({ entrada }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); entrada.enviar(); }}>
      <Campo
        id="codigo"
        etiqueta={t('codigo.campo')}
        valor={entrada.texto}
        onInput={entrada.setTexto}
        ejemplo={t('codigo.ejemplo')}
        error={entrada.error ? t('codigo.noValido') : ''}
        tipo="text"
        autoComplete="off"
        enterKeyHint="go"
      />
    </form>
  );
}

/* 1.2 Ya tengo un código (y 1.2b si no es válido) */
export function Codigo() {
  const entrada = usarEntrada();
  return (
    <main class="columna">
      <div class="cabecera solo-izq"><BotonAtras onClick={() => volver('/entrar')} /></div>
      <h1 class="t-display titulo-bajo">{t('codigo.titulo')}</h1>
      <p class="t-cuerpo gris" style="margin-top: 8px">{t('codigo.subtitulo')}</p>
      <div style="margin-top: 48px"><CampoCodigo entrada={entrada} /></div>
      <div class="caja sq" style="margin-top: 48px">
        <div style="font-size: 14px; line-height: 20px; font-weight: 600">{t('codigo.dondeTitulo')}</div>
        {[t('codigo.donde1'), t('codigo.donde2')].map((txt, i) => (
          <div key={i} style="display: flex; gap: 12px; font-size: 14px; line-height: 20px; font-weight: 500; color: var(--texto2)">
            <span style="color: var(--texto); font-weight: 600">{i + 1}</span>
            <span class="negritas-blancas"><TextoConNegritas texto={txt} /></span>
          </div>
        ))}
      </div>
      <BarraInferior>
        <div class="pila" style="gap: 16px">
          <Boton disabled={!entrada.texto.trim()} cargando={entrada.enviando} onClick={entrada.enviar} icono={flecha()}>{t('comun.entrar')}</Boton>
          <button type="button" class="enlace" style="align-self: center" onClick={() => navegar('/tutorial/1')}>{t('codigo.noTienes')}</button>
        </div>
      </BarraInferior>
    </main>
  );
}

/* 1.3 Tutorial «Crear mi joyero» */
export function Tutorial({ paso }) {
  const pasos = t('tutorial.pasos');
  const total = pasos.length;
  const n = Math.min(Math.max(parseInt(paso, 10) || 1, 1), total);
  const p = pasos[n - 1];
  const entrada = usarEntrada();
  const ir = (destino) => navegar(`/tutorial/${destino}`, { reemplazar: true });
  const captura = CAPTURAS_TUTORIAL[n - 1];
  return (
    <main class="columna">
      <div class="cabecera">
        <span class="t-sec">{t('tutorial.progreso', { paso: n, total })}</span>
        <button type="button" class="enlace" onClick={() => navegar('/codigo', { reemplazar: true })}>{t('tutorial.yaTengo')}</button>
      </div>
      <div class="segmentos" style="margin-top: 8px" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={n}>
        {pasos.map((_, i) => <span key={i} class={i < n ? 'hecho' : ''} />)}
      </div>
      {captura
        ? <img class="marcador sq" style="margin-top: 24px; object-fit: cover" src={captura} alt="" />
        : <div class="marcador sq" style="margin-top: 24px">{t('tutorial.captura')}</div>}
      <h1 class="t-dialogo" style="margin-top: 32px">{p.titulo}</h1>
      <p class="t-cuerpo" style="margin-top: 12px">{p.texto}</p>
      {p.nota && <div class="caja sq t-sec" style="margin-top: 16px; display: block">{p.nota}</div>}
      {n === 2 && (
        <a class="btn sq secundario" style="margin-top: 24px" href={PLANTILLA_COPIA || undefined} target="_blank" rel="noopener noreferrer" aria-disabled={PLANTILLA_COPIA ? undefined : 'true'}>
          <span>{t('tutorial.crearCopia')}</span>
          <ExternalLink size={20} strokeWidth={2} aria-hidden="true" />
        </a>
      )}
      {n === total && <div style="margin-top: 32px"><CampoCodigo entrada={entrada} /></div>}
      <BarraInferior>
        <div class="fila">
          <button type="button" class="btn-cuadrado sq" aria-label={t('comun.atras')} onClick={() => (n === 1 ? navegar('/entrar', { reemplazar: true }) : ir(n - 1))}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          {n < total
            ? <Boton onClick={() => ir(n + 1)} icono={flecha()}>{t('comun.siguiente')}</Boton>
            : <Boton disabled={!entrada.texto.trim()} cargando={entrada.enviando} onClick={entrada.enviar} icono={flecha()}>{t('comun.entrar')}</Boton>}
        </div>
      </BarraInferior>
    </main>
  );
}
