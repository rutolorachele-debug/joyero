# Joyero

Progetto personale di Rachele (UX/UI designer, non sviluppatrice). Parlare con lei in italiano, passo passo, dicendo esattamente dove cliccare. Interfaccia dell'app in spagnolo. Non usare mai il trattino lungo.

- Prodotto e stato: documenti del progetto claude.ai "Joyero" (joyero-prodotto.md, joyero-stato.md).
- Ogni push su `main` si pubblica su https://joyero.vercel.app.
- Web: Vite + Preact in `src/`, testi in `src/i18n/es.js`. `npm test`, `npm run build`.
- Script Google Apps Script in `apps-script/`. Test: `node --test apps-script/test/pruebas.test.cjs`. Ogni modifica allo script va data a Rachele tutta insieme e applicata da lei a mano (Deploy > Manage deployments > New version, mai "New deployment").
- Seguire joyero-prodotto.md e la tavola di stile (il wireframe è storico); chiedere prima di aggiungere funzioni o testi non previsti.
