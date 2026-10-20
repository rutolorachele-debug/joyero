import { useEffect, useState } from 'preact/hooks';
import { Pin, PinOff } from 'lucide-preact';

// Aviso breve: etiqueta pequeña abajo, centrada en la columna («Joya fijada»). Uno a la vez; desaparece solo.
// No es un botón: no se puede tocar.
const DURACION = 2200;
let escuchar = null;

export function mostrarAvisoBreve(texto, icono = 'pin') {
  if (escuchar) escuchar({ texto, icono, id: Date.now() });
}

export function AvisoBreve() {
  const [aviso, setAviso] = useState(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    escuchar = (a) => { setAviso(a); setVisible(true); };
    return () => { escuchar = null; };
  }, []);
  useEffect(() => {
    if (!aviso) return undefined;
    const ocultar = setTimeout(() => setVisible(false), DURACION);
    const quitar = setTimeout(() => setAviso(null), DURACION + 300);
    return () => { clearTimeout(ocultar); clearTimeout(quitar); };
  }, [aviso]);
  return (
    <div class="fijo zona-aviso" role="status" aria-live="polite">
      {aviso && (
        <div class={`aviso-breve sq${visible ? ' visible' : ''}${aviso.icono === 'error' ? ' error' : ''}`} key={aviso.id}>
          {aviso.icono === 'pin' && <Pin size={14} strokeWidth={2.25} fill="currentColor" aria-hidden="true" />}
          {aviso.icono === 'pin-off' && <PinOff size={14} strokeWidth={2.25} aria-hidden="true" />}
          <span>{aviso.texto}</span>
        </div>
      )}
    </div>
  );
}
