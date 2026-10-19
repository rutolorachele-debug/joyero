import { useEffect } from 'preact/hooks';
import { ProveedorJoyero, usarJoyero } from './estado.jsx';
import { usarRuta, navegar } from './ruta.js';
import { Ingreso, Codigo, Tutorial } from './pantallas/acceso.jsx';
import { Biblioteca } from './pantallas/biblioteca.jsx';
import { Formulario, Detalle } from './pantallas/joya.jsx';
import { Importar } from './pantallas/importar.jsx';
import { Ajustes, Categorias } from './pantallas/ajustes.jsx';

const RUTAS_ACCESO = /^\/(entrar|codigo|tutorial(\/\d+)?)$/;

function Pantallas() {
  const ruta = usarRuta();
  const { codigo } = usarJoyero();
  const esAcceso = RUTAS_ACCESO.test(ruta);

  // Sin código solo se ven las pantallas de acceso; con código, nunca.
  useEffect(() => {
    if (!codigo && !esAcceso) navegar('/entrar', { reemplazar: true });
    if (codigo && esAcceso) navegar('/', { reemplazar: true });
  }, [codigo, esAcceso]);

  if (!codigo) {
    if (ruta === '/codigo') return <Codigo />;
    const m = ruta.match(/^\/tutorial\/(\d+)$/);
    if (m) return <Tutorial paso={m[1]} />;
    return <Ingreso />;
  }

  let m;
  if (ruta === '/anadir') return <Formulario />;
  if ((m = ruta.match(/^\/joya\/([\w-]+)\/editar$/))) return <Formulario id={m[1]} key={m[1]} />;
  if ((m = ruta.match(/^\/joya\/([\w-]+)$/))) return <Detalle id={m[1]} />;
  if (ruta === '/importar') return <Importar />;
  if (ruta === '/ajustes') return <Ajustes />;
  if (ruta === '/categorias') return <Categorias />;
  return <Biblioteca />;
}

export function App() {
  return (
    <ProveedorJoyero>
      <Pantallas />
    </ProveedorJoyero>
  );
}
