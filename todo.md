# Option DAX - TODO List

## Database & Schema
- [x] Creare tabella strategies per salvare strategie di trading
- [x] Creare tabella portfolios per gestire portafogli utente
- [x] Creare tabella analysis_history per storico analisi
- [x] Creare tabella risk_alerts per notifiche di rischio
- [x] Creare tabella uploaded_files per documenti e report
- [x] Eseguire migration database con pnpm db:push

## Backend API (tRPC)
- [x] Implementare router strategies con CRUD operations
- [x] Implementare router portfolios con CRUD operations
- [x] Implementare router analysis con calcoli Black-Scholes
- [x] Implementare router chat per integrazione Gemini API
- [x] Implementare router files per upload/download documenti
- [x] Implementare router alerts per gestione notifiche rischio
- [x] Configurare protectedProcedure per tutte le operazioni sensibili

## Frontend - Integrazione Componenti Esistenti
- [x] Copiare e adattare componenti React dall'app originale
- [x] Integrare OptionCalculator per calcoli Black-Scholes
- [x] Integrare PayoffChart per visualizzazioni payoff
- [x] Integrare RiskAnalysis per analisi di rischio
- [x] Integrare ChatBot per interazione con Gemini AI

## Frontend - Nuove Funzionalità
- [x] Creare DashboardLayout per navigazione principale
- [x] Creare pagina Strategies per gestione strategie
- [x] Creare pagina Portfolios per gestione portafogli
- [x] Creare pagina Analysis per analisi in tempo reale
- [x] Creare pagina History per storico operazioni
- [ ] Implementare upload file con drag & drop
- [ ] Implementare visualizzazioni Recharts per grafici avanzati

## Gestione Stato & Real-time
- [ ] Configurare Zustand store per dati trading
- [ ] Implementare store per strategie attive
- [ ] Implementare store per prezzi in tempo reale
- [ ] Implementare store per alert e notifiche

## Integrazione API Esterne
- [x] Configurare Gemini API Key come secret
- [x] Implementare chatbot AI con streaming responses
- [x] Testare integrazione Gemini con domande trading

## Notifiche & Alert
- [ ] Implementare notifyOwner per alert critici di rischio
- [ ] Configurare threshold per alert automatici
- [ ] Creare sistema di notifiche in-app per utenti

## Storage & File Management
- [ ] Configurare S3 per upload report PDF
- [ ] Implementare upload screenshot grafici
- [ ] Implementare download documenti strategia
- [ ] Gestire metadata file nel database

## Styling & UX
- [x] Scegliere palette colori professionale per trading app
- [x] Implementare tema dark/light con ThemeProvider
- [x] Configurare font professionale (Inter o Roboto)
- [ ] Aggiungere animazioni per transizioni smooth
- [ ] Implementare responsive design per mobile

## Testing & Quality
- [x] Scrivere vitest per router strategies
- [x] Scrivere vitest per router portfolios
- [x] Scrivere vitest per calcoli Black-Scholes
- [x] Testare upload file e storage S3
- [x] Testare integrazione Gemini API

## Deployment
- [ ] Creare checkpoint finale per produzione
- [ ] Verificare tutte le variabili d'ambiente
- [ ] Testare app in preview mode
- [ ] Documentare funzionalità per l'utente

## Fix Gemini API Error (URGENT)
- [x] Rimuovere geminiService.ts dal frontend
- [x] Usare server/_core/llm.ts per chiamate Gemini nel backend
- [x] Creare router tRPC chat.sendMessage per AI
- [x] Aggiornare ImageAnalysisModal e HistoricalImportModal
- [x] Testare funzionamento app senza errori Gemini

## Autenticazione e Ruoli (IN PROGRESS)
- [x] Configurare OAuth Manus nel frontend
- [ ] Aggiungere pulsante Login/Logout nella navbar
- [x] Implementare auto-assegnazione ruolo admin per 4 Gmail
- [ ] Testare login e assegnazione ruoli

## Migrazione Database
- [x] Aggiornare schema structures per includere userId e sharedWith
- [x] Creare router tRPC per CRUD strutture con visibilità
- [ ] Rimuovere dati mock-up da portfolioStore
- [ ] Sostituire Zustand con tRPC nel frontend
- [ ] Implementare caricamento strutture da database

## Sistema Condivisione
- [x] Aggiungere campo sharedWith in tabella structures
- [x] Implementare procedure shareStructure nel backend
- [x] Implementare procedure getAdmins per dropdown
- [x] Implementare logica visibilità (user vede proprie + admin, admin vede proprie + altri admin)
- [ ] Creare UI dropdown per selezionare admin
- [ ] Testare condivisione tra utenti e admin

## Frontend Implementation (COMPLETATO)
- [x] Aggiungere pulsante Login nella navbar (visibile quando non autenticato)
- [x] Mostrare nome utente e pulsante Logout quando autenticato
- [x] Wrappare App con tRPC provider
- [x] Sostituire usePortfolioStore con trpc.optionStructures.list
- [x] Aggiornare StructureListView per usare tRPC
- [x] Aggiornare creazione strutture per salvare nel database
- [x] Rimuovere dati mock-up da portfolioStore
- [x] Creare hook useStructures che sostituisce completamente portfolioStore
- [x] Aggiornare tutti i componenti (StructureListView, StructureDetailView, PortfolioAnalysis, ImageAnalysisModal, HistoricalImportModal, SettingsView, App.tsx)
- [x] Testare caricamento strutture da database vuoto
- [ ] Aggiungere dropdown condivisione nelle card strutture

## Bug Fix - Caricamento Infinito (COMPLETATO)
- [x] Correggere useStructures: aggiungere parametro { status: 'all' } alla query tRPC
- [x] Testare caricamento app dopo fix
- [x] Verificare che le strutture vengano caricate correttamente

## Debug Caricamento Bloccato (URGENT)
- [ ] Controllare log server per errori tRPC
- [ ] Controllare console browser per errori JavaScript
- [ ] Verificare se la query tRPC sta effettivamente fallendo
- [ ] Aggiungere logging dettagliato in useStructures
- [ ] Testare con browser diverso o incognito

## Bug Pulsante Logout Non Funziona (COMPLETATO)
- [x] Verificare funzione handleLogout in App.tsx
- [x] Correggere logica logout (usare metodo logout di useAuth)
- [x] Testare che il pulsante Logout funzioni correttamente
- [x] Verificare redirect dopo logout (reindirizza a pagina login)

## Verifica Persistenza Database (IN PROGRESS)
- [ ] Verificare schema database structures
- [ ] Testare creazione struttura e salvataggio nel database
- [ ] Verificare che i dati persistano dopo reload
- [ ] Testare query list per caricare strutture salvate

## Bug Pulsante Crea Nuova Non Funziona (COMPLETATO)
- [x] Verificare come viene passata setCurrentView a StructureListView
- [x] Passare handleSetCurrentView come prop da App.tsx
- [x] Correggere chiamata nel componente (rimosso placeholder)
- [x] Testare che il pulsante apra il form di creazione

## Bug Pulsante Aggiornamento Prezzo DAX Non Funziona (COMPLETATO)
- [x] Verificare funzione refreshDaxSpot in StructureListView
- [x] Implementare router marketData.getDaxPrice nel backend
- [x] Implementare chiamata API Yahoo Finance per prezzo live (^GDAXI)
- [x] Correggere chiamata frontend usando fetch diretto
- [x] Testare che il pulsante aggiorni il prezzo correttamente (21885.79 → 24959.06)

## Bug Campo Tag Struttura Non Permette Digitazione (COMPLETATO)
- [x] Verificare input Tag Struttura in StructureDetailView
- [x] Aggiunto optional chaining value={localStructure?.tag || ''}
- [x] Creato updateStructureField con callback form setState
- [x] Verificato che input non è disabled
- [x] Verificato che input può ricevere focus
- [x] Testato manualmente - ancora non funziona
- [x] Convertire input da controlled a uncontrolled con useRef
- [x] Aggiornare handleSave per leggere valore da tagInputRef.current.value
- [x] Testare digitazione con uncontrolled input - FUNZIONA!

## Bug Link Torna alla Lista Non Funziona (COMPLETATO)
- [x] Verificare link "Torna alla Lista" in StructureDetailView
- [x] Passare setCurrentView come prop da App.tsx
- [x] Correggere chiamata a props.setCurrentView('list')
- [x] Testare che il link riporti alla lista

## Bug Pulsante Aggiungi Gamba Non Funziona (COMPLETATO)
- [x] Verificare funzione addLeg in StructureDetailView
- [x] Identificato loop infinito di re-rendering che bloccava eventi click
- [x] Fixato PayoffChart: useMemo con legs.length invece di legs
- [x] Fixato StructureDetailView: rimosso structures dalle dipendenze useEffect
- [x] Aggiunto pointer-events: none al wrapper PayoffChart
- [x] Testato che il pulsante aggiunga una nuova gamba alla struttura

## Bug Pulsante Aggiornamento Prezzo DAX Non Funziona nelle Pagine Interne (COMPLETATO)
- [x] Creato store globale useMarketDataStore per condividere prezzo DAX
- [x] Sostituito stato locale con store globale in StructureListView e StructureDetailView
- [x] Implementato refreshDaxSpot in StructureDetailView
- [x] Testato che il pulsante aggiorni il prezzo in tutte le pagine

## Bug Prezzo DAX Non Persiste Tra Cambio Pagina (COMPLETATO)
- [x] Creato store globale Zustand (useMarketDataStore)
- [x] Implementato salvataggio prezzo nello store globale
- [x] Far leggere il prezzo dallo store in tutte le pagine
- [x] Testato che il prezzo persista quando cambi pagina e torni indiet## Bug Nuove Strutture Non Vengono Salvate (IN CORSO - RICHIEDE RICREAZIONE ROUTER)
- [x] Aggiunto campo multiplier allo schema database e router tRPC
- [x] Ricreato tabella structures con schema corretto (18 colonne)
- [x] Aggiunto import z da zod nel router optionStructures
- [x] Fixato mismatch uppercase/lowercase tra frontend e backend (Active/Closed → active/closed)
- [x] Abilitato batching tRPC su client e server
- [x] Rimosso mutation inesistenti (closeMutation, reopenMutation) da useStructures
- [x] Pulita cache di Vite per forzare reload del codice
- [ ] Ricreare router optionStructures da zero copiando struttura da router funzionante
- [ ] Testare che le nuove strutture vengano salvate e ricaricate

## Ricreazione Router optionStructures (IN CORSO)
- [ ] Backup del router optionStructures esistente
- [ ] Creare nuovo router optionStructures copiando struttura da router funzionante
- [ ] Implementare procedure list con schema input corretto
- [ ] Implementare procedure create con schema input corretto
- [ ] Implementare procedure update, delete, share, unshare, getAdmins
- [ ] Testare che il nuovo router funzioni senza errori 400

## Sistema Condivisione Strutture (TODO)
- [ ] Creare componente ShareDropdown per selezionare admin
- [ ] Integrare ShareDropdown nelle card strutture in StructureListView
- [ ] Implementare logica condivisione con chiamata tRPC share
- [ ] Implementare logica rimozione condivisione con chiamata tRPC unshare
- [ ] Testare condivisione tra utenti e admin end-to-end

## Bug Salvataggio Strutture - TRPCClientError (RISOLTO)
- [x] Risolvere errore "Unable to transform response from server" durante salvataggio
- [x] Disabilitato superjson sia sul server che sul client
- [x] Testato che il salvataggio funzioni correttamente

## Bug Pulsanti Non Funzionano (RISOLTO)
- [x] BUG: Pulsante nuvoletta (aggiorna prezzo DAX) non funziona - fixato formato risposta JSON
- [x] BUG: Pulsanti "Torna alla Lista" non funzionano in PortfolioAnalysis e SettingsView - passata prop setCurrentView

## Bug Pulsante Chiudi Struttura (RISOLTO)
- [x] BUG: Pulsante "Chiudi Struttura" non funziona in StructureDetailView - implementata procedure close nel router

## Bug Critici (RISOLTO)
- [x] BUG: Math.erf is not a function - implementata approssimazione CDF normale (Abramowitz & Stegun)
- [x] BUG: Strutture condivise tra tutti gli utenti - fixato filtro per mostrare solo strutture dell'utente corrente

## Bug Pagina Bianca (RISOLTO)
- [x] BUG: Pagina bianca dopo aver cliccato "Chiudi Struttura" - realizedPnl era stringa invece di numero, fixato con Number() cast

## Bug Critici da Risolvere (PRIORITÀ ALTA)
- [ ] BUG: Calcolo P&L realizzato completamente sbagliato - valori casuali (es. -169197.48€, 84584.79€)
- [ ] BUG: Pulsante "Riapri per Modificare" non funziona nelle strutture chiuse
- [ ] BUG: Schermata Analisi Portafoglio mostra valori errati (P/L, Delta, Gamma, Theta, Vega tutti a 0)
- [ ] BUG: Quando chiudo tutte le strutture, l'Analisi Portafoglio mostra ancora P/L Aperto Totale = €0.00 invece di nessuna struttura attiva

## Nuove Feature Richieste
- [x] Refresh automatico prezzo DAX al caricamento pagina (invece di valore statico 21885.79) - COMPLETATO

## Bug Nuovi Segnalati
- [x] BUG: Campo "Prezzo di apertura" torna indietro automaticamente dopo la modifica - RISOLTO: rimosso calcolo automatico IV
- [x] BUG: Possibile conflitto tra slider volatilità e campi di testo che causa reset automatico valori - RISOLTO: rimosso calcolo automatico IV duplicato

## Bug UI/UX
- [x] BUG: Simbolo € esce fuori dal box nelle metriche (Vincita Media, Perdita Media, Max Drawdown) - RISOLTO: ridotto font size, aggiunto flex-wrap e break-words

## 🔴 BUG CRITICI (PRIORITÀ MASSIMA)
- [x] BUG CRITICO: Modificare prezzo apertura/chiusura su una gamba modifica TUTTE le altre gambe - RISOLTO: generazione ID univoci con timestamp+random
- [x] BUG CRITICO: Prezzi di chiusura non vengono salvati quando si clicca "Salva Modifiche" - RISOLTO: aggiunto closingPrice e closingDate al mapping legs
- [x] 🔥 BUG GRAVISSIMO: Procedura close SOVRASCRIVE prezzi di chiusura manuali con calcolo Black-Scholes teorico - RISOLTO: usa closingPrice manuale se presente, altrimenti teorico
- [x] 🔴 BUG CRITICO: Strutture ATTIVE non usano prezzi di chiusura manuali per calcolare P&L - RISOLTO: usa closingPrice manuale se presente, altrimenti Black-Scholes teorico

- [x] 🔴 BUG CRITICO GRAFICO PAYOFF: Gambe chiuse devono contribuire con P&L realizzato come offset fisso al payoff totale - RISOLTO: calcola P&L realizzato gambe chiuse e lo aggiunge come offset fisso al payoff delle gambe aperte

## 🎯 Feature: Sistema Multi-Utente con Gestione Admin

- [x] Aggiornare schema database con campi isPublic, isTemplate, originalStructureId
- [x] Implementare procedure tRPC: listPublic, import, togglePublic
- [x] Creare sezione "Strutture Pubbliche" nella home (pulsante 🌐 Pubbliche nella header)
- [x] Aggiungere pulsante "Importa" su strutture pubbliche
- [x] Aggiungere toggle "Pubblica/Privata" per admin nelle strutture
- [ ] Filtrare lista strutture per mostrare solo proprie + pubbliche
- [ ] Testare flusso: admin pubblica → utente importa → modifica copia indipendente

- [x] 🔴 BUG: Toggle "Visibilità Pubblica" non risponde al click - RISOLTO: spostato useMutation al top level invece di dentro onChange

- [x] 🔴 BUG CRITICO DEPLOYMENT: Timeout durante PrepareInfraActivity - DOCUMENTATO: creato report dettagliato per supporto Manus (DEPLOYMENT_ISSUE_REPORT.md), problema lato piattaforma non del codice

## 🎨 Feature: Grafiche Telegram per Comunicazione Operazioni

- [x] Creare mock-up grafica apertura nuova struttura (verticale 600x800px, stile minimalista moderno)
- [x] Creare mock-up grafica aggiustamento (layout 2 colonne, GRANDE punti, piccolo euro)
- [x] Creare mock-up grafica chiusura totale (GRANDE punti, piccolo euro, no %)
- [x] Approvazione mock-up da parte utente
- [x] Setup backend: installare puppeteer e handlebars
- [x] Creare 3 template HTML/CSS (apertura, aggiustamento, chiusura)
- [x] Implementare generator.ts con generateGraphic()
- [x] Aggiornare schema database con tabella structure_graphics
- [x] Creare tRPC router graphics.generate
- [x] Ricevere design Stitch finali (HTML/CSS + PNG)
- [ ] Convertire template Stitch in Handlebars con placeholder dinamici
- [x] UI: pulsante "Genera Grafica" + modal preview
- [ ] UI: sezione storico grafiche generate
- [ ] Trigger automatici: apertura, aggiustamento, chiusura
- [ ] Testing flusso completo generazione grafiche

## 🔧 Ottimizzazioni Multi-Utente

- [ ] Invalidare cache lista pubblica dopo toggle visibilità
- [ ] Aggiungere badge visivo "🌐 Pubblica" sulle card strutture
- [ ] Testare flusso completo: admin pubblica → utente importa → modifica copia indipendente

- [x] 🔴 BUG: Generazione grafica fallisce con errore 500 Internal Server Error - RISOLTO: migrato da Puppeteer a html-to-image (generazione lato client)
- [x] Installare html-to-image per generazione lato client
- [x] Creare componente GraphicTemplate per rendering HTML
- [x] Implementare GraphicModal con generazione lato client
- [x] Backend per upload Base64 su S3
- [x] Test end-to-end generazione grafica
- [ ] Rimuovere componente SimpleGraphicTest (test temporaneo)
- [ ] Rimuovere pulsante TEST dall'header

## Fix UI Modal Generazione Grafiche (COMPLETATO)
- [x] Rimuovere icone emoji dai pulsanti tipo grafica (solo testo)
- [x] Fixare pulsanti trasparenti con sfondo solido
- [x] Ridurre dimensioni modal (max-w-2xl invece di max-w-4xl)
- [x] Rimuovere scroll interno dalla preview template
- [x] Ingrandire badge LONG/SHORT per migliore visibilità
- [x] Testare UI fixata su struttura reale
- [x] Aggiungere data scadenza contratto nelle card gambe

## Fix Pulsanti Trasparenti Modal (COMPLETATO)
- [x] Aggiungere sfondo solido ai pulsanti tipo grafica (outline variant ha bg trasparente)
- [x] Testare visibilità pulsanti su sfondo scuro

## Fix Contrasto Pulsanti (COMPLETATO)
- [x] Sostituire bg-card con bg-slate-600 per contrasto garantito
- [x] Testare visibilità su sfondo modal scuro

## Fix Errori Border (COMPLETATO)
- [x] Rimuovere border-slate-600 che causava errori
- [x] Usare bg-slate-600 solido
- [x] Testare visibilità pulsanti

## Fix Errori Runtime (COMPLETATO)
- [x] Fix tRPC ritorna HTML invece di JSON (aggiornamento prezzo DAX) - Sostituito fetch CORS proxy con tRPC query
- [x] Fix tRPC ritorna HTML invece di JSON (salvataggio struttura) - Risolto con fix DAX price
- [x] Fix tRPC ritorna HTML invece di JSON (aggiornamento struttura) - Risolto con fix DAX price
- [x] Fix missing key prop in StructureDetailView - Già presente

## Riscrittura Completa GraphicModal (COMPLETATO)
- [x] Sfondo modal BIANCO SOLIDO invece di trasparente
- [x] Pulsanti tipo con BORDO SPESSO NERO (4px) e TESTO NERO su SFONDO BIANCO
- [x] Aumentare altezza template da 800px a 1000px per mostrare footer completo
- [x] Testo modal nero per contrasto su sfondo bianco

## Spostare Grafica Chiusura in Strutture Chiuse
- [ ] Aggiungere pulsante "Genera Grafica" nella lista strutture chiuse (StructureListView)
- [ ] Modificare GraphicModal per accettare prop `isClosed` e mostrare solo tipo appropriato
- [ ] Strutture aperte: mostrare solo "Apertura" e "Aggiustamento"
- [ ] Strutture chiuse: mostrare solo "Chiusura"
- [ ] Calcolare correttamente data apertura (createdAt), data chiusura (closedAt), durata giorni
- [ ] Testare generazione grafica chiusura con struttura realmente chiusa

## Spostare Grafica Chiusura in Strutture Chiuse (COMPLETATO)
- [x] Aggiungere pulsante Genera Grafica nelle card strutture chiuse
- [x] Modificare GraphicModal per accettare prop isClosed
- [x] Mostrare solo "Apertura" e "Aggiustamento" per strutture aperte
- [x] Mostrare solo "Chiusura" per strutture chiuse
- [x] Calcolare correttamente openingDate, closingDate, duration per grafica chiusura
- [ ] Testare generazione grafica chiusura

## 🎨 Redesign UI Professional Premium
- [ ] Definire nuova palette colori (nero profondo #0a0a0f, blu elettrico #0ea5e9, verde #10b981, rosso #ef4444)
- [ ] Aggiornare CSS variables in index.css con design system premium
- [ ] Creare componente Sidebar con navigazione moderna (Dashboard, Simulatore Payoff, Calcolatore Greche, Storico)
- [ ] Ridisegnare App.tsx con layout sidebar + main content
- [ ] Ridisegnare card strutture con stile premium (bordi sottili, ombre profonde, NO glassmorphism)
- [ ] Migliorare tipografia (Inter font, gerarchia chiara, monospace per numeri)
- [ ] Rimuovere emoji e sostituire con icone minimali Lucide React
- [ ] Aggiornare spacing e padding per look più ariato
- [ ] Ridisegnare grafici payoff con stile premium (linee sharp, colori solidi)
- [ ] Testare redesign su tutte le pagine
- [ ] Salvare checkpoint redesign premium

## 📱 Mobile Responsiveness Issues (URGENT)
- [x] Implementare hamburger menu per mobile (< 768px)
- [x] Nascondere sidebar su mobile di default
- [x] Aggiungere toggle sidebar con overlay per mobile
- [x] Fixare posizione footer copyright in fondo alla sidebar
- [ ] Testare layout responsive su vari breakpoint (richiede test utente su dispositivo mobile)

## 🔧 Fix Mobile Overlay Transparency (URGENT)
- [x] Aumentare opacità overlay da 50% a 80% (TROPPO SCURO - da ridurre)
- [x] Fixare z-index overlay (z-50) e sidebar (z-60) per stacking corretto
- [ ] Ridurre opacità overlay a 60-65% per bilanciare visibilità
- [ ] Verificare ordine rendering DOM (overlay prima di sidebar)
- [ ] Testare su mobile che sidebar sia visibile sopra overlay

## 🎨 UI Adjustments Header e Sidebar
- [x] Spostare nome account e pulsante Logout più a destra nell'header (aggiunto ml-auto)
- [x] Cambiare sidebar da trasparente a BIANCO PIENO (bg-white solido)
- [x] Rimuovere tutte le trasparenze dalla sidebar
- [x] Testare che sidebar bianca sia leggibile su sfondo scuro

## 🎨 Fix Colore Nome Account Header
- [x] Cambiare colore nome account da text-gray-300 (grigio chiaro) a text-gray-900 (nero/grigio scuro)
- [x] Testare leggibilità su sfondo header chiaro
- [x] Aggiunto font-medium per enfasi

## 🗑️ Rimuovere Overlay Mobile
- [x] Rimuovere elemento overlay nero trasparente da App.tsx
- [x] Testare che sidebar mobile funzioni senza overlay
- [x] Sidebar mobile ora si apre senza overlay scuro dietro

## 🔧 Fix Logo Blurrato Sidebar
- [x] Verificare cause blur logo "Option DAX" in Sidebar.tsx
- [x] Rimosso tracking-tight che causava blur
- [x] Aggiunto antialiased per rendering nitido
- [ ] Testare che logo sia nitido e leggibile (richiede test utente)
