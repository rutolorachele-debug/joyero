import { useState } from 'preact/hooks';
import { Trash2, X, Download } from 'lucide-preact';
import { t } from '../i18n/index.js';
import { usarJoyero } from '../estado.jsx';
import { navegar, volver } from '../ruta.js';
import { claveError } from '../lib/api.js';
import { Boton, BotonAtras, BarraInferior, Dialogo, Aviso } from '../componentes/base.jsx';

/*
 * 4.5 Eliminar joyero.
 * El script vacía el joyero (joyas, categorías, fijados) y cambia la clave: el código deja de
 * funcionar en todos los dispositivos. El Google Sheet queda en el Drive, vacío.
 */
export function EliminarJoyero() {
  const { datos, api, salir } = usarJoyero();
  const [confirmar, setConfirmar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState('');
  const n = datos.joyas.length;

  const eliminar = async () => {
    setEliminando(true);
    setError('');
    try {
      await api('vaciar', {});
      salir();
      navegar('/entrar', { reemplazar: true });
    } catch (e) {
      setConfirmar(false);
      setError(t(claveError(e)));
    } finally {
      setEliminando(false);
    }
  };

  return (
    <main class="columna">
      <div class="cabecera solo-izq"><BotonAtras onClick={() => volver('/ajustes')} /></div>
      <h1 class="t-display titulo-bajo">{t('eliminar.titulo')}</h1>
      <p class="t-cuerpo gris" style="margin-top: 8px">{t('eliminar.texto')}</p>
      <div class="caja sq" style="margin-top: 48px">
        <p class="t-cuerpo" style="margin: 0">{t('eliminar.aviso')}</p>
        <Boton variante="secundario" onClick={() => navegar('/exportar')} icono={<Download size={20} strokeWidth={2} aria-hidden="true" />}>{t('eliminar.exportar')}</Boton>
      </div>
      {error && <div style="margin-top: 24px"><Aviso texto={error} /></div>}
      <BarraInferior>
        <Boton variante="eliminar" onClick={() => setConfirmar(true)} icono={<Trash2 size={20} strokeWidth={2} aria-hidden="true" />}>{t('eliminar.boton')}</Boton>
      </BarraInferior>

      <Dialogo abierto={confirmar} titulo={t('eliminar.dialogoTitulo')}
        texto={n === 1 ? t('eliminar.dialogoTexto1') : t('eliminar.dialogoTexto', { n })} onCerrar={() => setConfirmar(false)}>
        <Boton variante="peligro" cargando={eliminando} onClick={eliminar} icono={<Trash2 size={20} strokeWidth={2} aria-hidden="true" />}>{t('eliminar.confirmar')}</Boton>
        <Boton variante="terciario" onClick={() => setConfirmar(false)} icono={<X size={20} strokeWidth={2} aria-hidden="true" />}>{t('comun.cancelar')}</Boton>
      </Dialogo>
    </main>
  );
}
