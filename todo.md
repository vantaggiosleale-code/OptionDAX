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
