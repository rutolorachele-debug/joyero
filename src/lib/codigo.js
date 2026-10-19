/**
 * Código de acceso: "joy_" + id de la implementación + "_" + clave secreta (32 caracteres hexadecimales).
 * El id puede contener «_», por eso se separa por el ÚLTIMO «_».
 */
export function leerCodigo(texto) {
  const s = String(texto || '').trim().replace(/\s+/g, '');
  if (!s.startsWith('joy_')) return null;
  const resto = s.slice(4);
  const corte = resto.lastIndexOf('_');
  if (corte < 1) return null;
  const id = resto.slice(0, corte);
  const clave = resto.slice(corte + 1);
  if (!/^[A-Za-z0-9_-]{20,}$/.test(id) || !/^[0-9a-f]{32}$/i.test(clave)) return null;
  return { id, clave, codigo: s, url: `https://script.google.com/macros/s/${id}/exec` };
}
