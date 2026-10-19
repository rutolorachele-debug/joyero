import { getSvgPath } from 'figma-squircle';

// Esquinas iOS (corner smoothing 60%, como en Figma) para todo elemento con la clase «sq».
// El border-radius normal queda como reserva si clip-path no está disponible.

const SUAVIZADO = 0.6;
const vigilados = new WeakSet();
let medidor = null;

function radios(el) {
  const cs = getComputedStyle(el);
  const r = (v) => parseFloat(v) || 0;
  return {
    tl: r(cs.borderTopLeftRadius), tr: r(cs.borderTopRightRadius),
    br: r(cs.borderBottomRightRadius), bl: r(cs.borderBottomLeftRadius)
  };
}

function aplicar(el, ancho, alto) {
  if (!ancho || !alto) return;
  const r = radios(el);
  if (!r.tl && !r.tr && !r.br && !r.bl) return;
  const max = Math.min(ancho, alto) / 2;
  const d = getSvgPath({
    width: ancho, height: alto, cornerSmoothing: SUAVIZADO, preserveSmoothing: true,
    topLeftCornerRadius: Math.min(r.tl, max), topRightCornerRadius: Math.min(r.tr, max),
    bottomRightCornerRadius: Math.min(r.br, max), bottomLeftCornerRadius: Math.min(r.bl, max)
  });
  el.style.clipPath = `path('${d}')`;
}

function vigilar(el) {
  if (vigilados.has(el)) return;
  vigilados.add(el);
  medidor.observe(el);
}

export function iniciarSquircles() {
  if (typeof window === 'undefined' || !window.ResizeObserver || !CSS.supports('clip-path', "path('M0 0')")) return;
  medidor = new ResizeObserver((entradas) => {
    for (const e of entradas) {
      const caja = e.borderBoxSize && e.borderBoxSize[0];
      const ancho = caja ? caja.inlineSize : e.target.offsetWidth;
      const alto = caja ? caja.blockSize : e.target.offsetHeight;
      aplicar(e.target, ancho, alto);
    }
  });
  const buscar = (raiz) => {
    if (raiz.nodeType !== 1) return;
    if (raiz.classList.contains('sq')) vigilar(raiz);
    raiz.querySelectorAll('.sq').forEach(vigilar);
  };
  buscar(document.body);
  new MutationObserver((cambios) => {
    for (const c of cambios) c.addedNodes.forEach(buscar);
  }).observe(document.body, { childList: true, subtree: true });
}
