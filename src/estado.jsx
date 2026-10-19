import { createContext } from 'preact';
import { useCallback, useContext, useEffect, useRef, useState } from 'preact/hooks';
import { llamar, ErrorJoyero } from './lib/api.js';
import { leerCodigo } from './lib/codigo.js';
import * as almacen from './lib/almacen.js';

const Contexto = createContext(null);
export const usarJoyero = () => useContext(Contexto);

const VACIO = { joyas: [], tipos: [], temas: [] };

function claveCache(codigo) {
  const c = leerCodigo(codigo);
  return c ? 'datos.' + c.id.slice(-12) : 'datos';
}

/**
 * Estado de la app: código de acceso, joyas, tipos y temas.
 * Las joyas se guardan también en el navegador para verlas al instante y sin conexión;
 * la fuente de verdad es siempre la hoja de Google.
 */
export function ProveedorJoyero({ children }) {
  const [codigo, setCodigo] = useState(() => almacen.leer('codigo', ''));
  const [datos, setDatos] = useState(() => (codigo ? almacen.leer(claveCache(codigo), null) : null));
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(null);
  const pedido = useRef(0);

  const guardarDatos = useCallback((nuevos) => {
    setDatos(nuevos);
    if (codigo) almacen.guardar(claveCache(codigo), nuevos);
  }, [codigo]);

  const api = useCallback((accion, d, opciones) => llamar(codigo, accion, d, opciones), [codigo]);

  const recargar = useCallback(async () => {
    if (!codigo) return;
    const n = ++pedido.current;
    setCargando(true);
    try {
      const r = await llamar(codigo, 'leer', {});
      if (n !== pedido.current) return;
      const nuevos = { joyas: r.joyas || [], tipos: r.tipos || [], temas: r.temas || [] };
      setDatos(nuevos);
      almacen.guardar(claveCache(codigo), nuevos);
      setErrorCarga(null);
    } catch (e) {
      if (n === pedido.current) setErrorCarga(e instanceof ErrorJoyero ? e : new ErrorJoyero('respuesta'));
    } finally {
      if (n === pedido.current) setCargando(false);
    }
  }, [codigo]);

  // Al abrir la app y al volver a ella, se leen los cambios hechos desde otros dispositivos.
  useEffect(() => {
    if (!codigo) return undefined;
    recargar();
    const alVolver = () => { if (document.visibilityState === 'visible') recargar(); };
    document.addEventListener('visibilitychange', alVolver);
    window.addEventListener('online', recargar);
    return () => {
      document.removeEventListener('visibilitychange', alVolver);
      window.removeEventListener('online', recargar);
    };
  }, [codigo, recargar]);

  /** Comprueba el código con el script y, si responde, lo guarda en este dispositivo. */
  const entrar = useCallback(async (texto) => {
    const c = leerCodigo(texto);
    if (!c) throw new ErrorJoyero('formato');
    const r = await llamar(c, 'leer', {}, { tiempo: 30000 });
    const nuevos = { joyas: r.joyas || [], tipos: r.tipos || [], temas: r.temas || [] };
    almacen.guardar('codigo', c.codigo);
    almacen.guardar(claveCache(c.codigo), nuevos);
    setDatos(nuevos);
    setErrorCarga(null);
    setCodigo(c.codigo);
  }, []);

  const salir = useCallback(() => {
    almacen.borrar(claveCache(codigo));
    almacen.borrar('codigo');
    pedido.current++;
    setCodigo('');
    setDatos(null);
    setErrorCarga(null);
  }, [codigo]);

  /* Cambios locales tras una respuesta correcta del script */
  const d = datos || VACIO;
  const ponerJoya = useCallback((joya) => {
    const joyas = d.joyas.filter((j) => j.id !== joya.id).concat([joya]);
    const tipos = joya.tipo && !d.tipos.some((x) => x.nombre === joya.tipo) ? d.tipos.concat([{ nombre: joya.tipo, icono: 'gem' }]) : d.tipos;
    const temas = d.temas.concat((joya.temas || []).filter((x) => !d.temas.includes(x)));
    guardarDatos({ joyas, tipos, temas });
  }, [d, guardarDatos]);

  const quitarJoya = useCallback((id) => {
    guardarDatos({ ...d, joyas: d.joyas.filter((j) => j.id !== id) });
  }, [d, guardarDatos]);

  const valor = {
    codigo, datos: d, hayDatos: !!datos, cargando, errorCarga,
    api, recargar, entrar, salir, guardarDatos, ponerJoya, quitarJoya
  };
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
