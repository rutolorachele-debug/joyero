# Joyero · aggiornamenti dello script

Elenco delle modifiche allo script Apps Script raccolte durante il lavoro sul frontend.
Si applicano **tutte insieme**, in un unico aggiornamento, quando Claude lo segnala.

## Stato

- Versione installata nel tuo Sheet e nel modello: **2** (19/10/2026)
- Prossima versione: **3**, nessuna modifica in attesa

## Versione 2 (installata il 19/10/2026)

| # | File | Cosa cambia | Perché | Decisa il |
|---|------|-------------|--------|-----------|
| 1 | Code.gs | Nell'importazione, una joya già presente che la persona rispunta nella 3.2 viene salvata come doppione invece di essere saltata. | Decisione di Rachele: le joyas già presenti si possono riselezionare e restano come doppioni. | 19/10/2026 |
| 2 | Code.gs | Ogni nuova joya arriva dalla web con un suo codice. Se la stessa richiesta arriva due volte (per esempio la connessione cade proprio mentre salvi e la web riprova), lo script non crea una seconda riga. Vale sia per "Guardar" sia per l'importazione a blocchi. | Requisito "non perdere mai dati" senza creare doppioni quando la rete è instabile. | 19/10/2026 |
| 4 | Code.gs, Codigo.html | "Mostrar mi código" non usa più l'indirizzo che lo script trova da solo (era quello di prova e dava errore 404 sul sito). La prima volta chiede di incollare la URL della pubblicazione, controlla che funzioni e solo allora mostra il código. | Errore trovato nella prima prova vera: il código conteneva l'indirizzo sbagliato. | 19/10/2026 |
| 3 | Code.gs | Se il link risulta già presente, lo script non crea più tipi o temi nuovi prima che tu abbia confermato "Guardar igualmente". | Correzione: prima un tema nuovo poteva comparire anche se poi annullavi. | 19/10/2026 |

Le modifiche riguardano solo il codice: **le schede, le colonne e i dati dello Sheet non cambiano**.

## Come applicare l'aggiornamento (quando arriva)

Claude ti manderà i file nuovi completi. Poi:

### Nel tuo Sheet personale
1. Apri lo Sheet **Joyero** > menu **Extensions > Apps Script**.
2. Per ogni file indicato nella tabella: aprilo a sinistra, cancella tutto il contenuto, incolla la nuova versione.
3. Salva con **Ctrl+S** (Cmd+S su Mac).
4. In alto a destra: **Deploy > Manage deployments**.
5. Clicca la **matita ✏️** sulla pubblicazione esistente.
6. In **Version** scegli **New version**, poi **Deploy**.

⚠️ **Non usare "New deployment"**: crea un indirizzo nuovo e il tuo código smette di funzionare su tutti i dispositivi. Con "Manage deployments" indirizzo e código restano uguali.

### Nella copia modello (quella per gli amici)
Solo i passi 1-3. Il modello non si pubblica.

### Controllo finale
Apri la app Joyero e verifica che le joyas si carichino. Se compare un errore, scrivilo a Claude con uno screenshot.

## Storico

| Versione | Data | Contenuto |
|----------|------|-----------|
| 1 | 19/10/2026 | Prima installazione: lettura e scrittura, categorie, metadati, classificazione, importazione a blocchi, menu "Mostrar mi código". |
| 2 | 19/10/2026 | Modifiche 1-4 della tabella sopra. |
