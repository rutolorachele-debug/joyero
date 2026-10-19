# Joyero

El portajoyas de tus referencias de diseño. Una web (PWA) que guarda tus «joyas» en un Google Sheet de tu Drive.

- `src/` · la web (Vite + Preact). Textos en `src/i18n/es.js`.
- `apps-script/` · el script que se copia junto al Sheet modelo (Google Apps Script).
- `joyero-aggiornamenti-script.md` · cambios pendientes del script y cómo aplicarlos.

## Desarrollo

```
npm install
npm run dev      # web en local
npm test         # pruebas de la web
node --test apps-script/test/pruebas.test.cjs   # pruebas del script
npm run build    # versión para publicar (carpeta dist)
```

Se publica en Vercel: cada cambio en la rama `main` se publica solo.
