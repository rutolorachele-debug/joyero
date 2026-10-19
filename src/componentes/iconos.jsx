import {
  Globe, FileText, Play, Film, Mic, BookOpen, Wrench, GraduationCap, Gem, Image, Music, Layers,
  Newspaper, Headphones, Monitor, Smartphone, Palette, PenTool, Type, Camera, Tv, Presentation,
  Code, Box, Shapes, Sparkles, Bookmark, Map, Lightbulb, Quote
} from 'lucide-preact';

// Rejilla de iconos para los tipos (Lucide). El nombre es el que se guarda en la hoja «Tipos».
export const ICONOS_TIPO = {
  globe: Globe, 'file-text': FileText, play: Play, film: Film, mic: Mic, 'book-open': BookOpen,
  wrench: Wrench, 'graduation-cap': GraduationCap, gem: Gem, image: Image, music: Music, layers: Layers,
  newspaper: Newspaper, headphones: Headphones, monitor: Monitor, smartphone: Smartphone, palette: Palette,
  'pen-tool': PenTool, type: Type, camera: Camera, tv: Tv, presentation: Presentation, code: Code,
  box: Box, shapes: Shapes, sparkles: Sparkles, bookmark: Bookmark, map: Map, lightbulb: Lightbulb, quote: Quote
};
export const NOMBRES_ICONOS = Object.keys(ICONOS_TIPO);
export const ICONO_GENERICO = 'gem';

export function IconoTipo({ nombre, size = 16, strokeWidth = 2.25 }) {
  const C = ICONOS_TIPO[nombre] || ICONOS_TIPO[ICONO_GENERICO];
  return <C size={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}
