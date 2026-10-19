import { useEffect, useState } from 'preact/hooks';

// Rutas con «#», para que funcionen en cualquier alojamiento y con el botón atrás del teléfono.
// Cada entrada del historial guarda su profundidad dentro de la app: así «volver» nunca saca de Joyero.

function rutaActual() {
  const h = window.location.hash.replace(/^#/, '') || '/';
  return h.startsWith('/') ? h : '/' + h;
}

function profundidad() {
  const s = window.history.state;
  return s && typeof s.joyero === 'number' ? s.joyero : 0;
}

export function usarRuta() {
  const [ruta, setRuta] = useState(rutaActual());
  useEffect(() => {
    const cambio = () => setRuta(rutaActual());
    window.addEventListener('hashchange', cambio);
    window.addEventListener('popstate', cambio);
    return () => {
      window.removeEventListener('hashchange', cambio);
      window.removeEventListener('popstate', cambio);
    };
  }, []);
  return ruta;
}

export function navegar(ruta, { reemplazar = false } = {}) {
  const destino = '#' + ruta;
  if (reemplazar) window.history.replaceState({ joyero: profundidad() }, '', destino);
  else window.history.pushState({ joyero: profundidad() + 1 }, '', destino);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  window.scrollTo(0, 0);
}

/** Vuelve atrás si se llegó desde la app; si no (link directo, recarga), va a la ruta indicada. */
export function volver(alternativa = '/') {
  if (profundidad() > 0) window.history.back();
  else navegar(alternativa, { reemplazar: true });
}
