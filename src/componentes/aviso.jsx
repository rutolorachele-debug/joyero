import { useEffect, useState } from 'preact/hooks';
import { Pin } from 'lucide-preact';

// Aviso breve abajo («Joya fijada»). Uno a la vez; desaparece solo.
const DURACION = 2400;
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
        <div class={`aviso-breve sq${visible ? ' visible' : ''}`} key={aviso.id}>
          <span>{aviso.texto}</span>
          {aviso.icono === 'pin' && <Pin size={18} strokeWidth={2.25} fill="currentColor" aria-hidden="true" />}
        </div>
      )}
    </div>
  );
}
