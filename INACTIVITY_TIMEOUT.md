# Sistema di Timeout per Inattività

## Panoramica
Il sistema implementa un timeout automatico di **30 minuti di inattività** che forza il logout dell'utente per motivi di sicurezza.

## Componenti Implementati

### 1. Configurazione NextAuth (`lib/auth.ts`)
- **`session.maxAge`**: Impostato a 30 minuti (1800 secondi)
- **JWT Callback**: 
  - Traccia `lastActivity` timestamp nel token JWT
  - Verifica la scadenza della sessione ad ogni richiesta
  - Invalida il token se l'inattività supera i 30 minuti
  - Aggiorna `lastActivity` quando trigger è "update"

### 2. Hook Activity Tracker (`hooks/use-activity-tracker.ts`)
Hook React personalizzato che:
- **Monitora eventi di attività**: mousedown, keydown, scroll, touchstart, click
- **Aggiorna la sessione**: ogni 5 minuti se l'utente è attivo
- **Verifica inattività**: controlla ogni minuto se sono passati 30 minuti senza attività
- **Forza logout**: reindirizza a login con messaggio se scaduta

### 3. Activity Tracker Component (`components/activity-tracker.tsx`)
Componente client che:
- Renderizza `null` (invisibile)
- Utilizza l'hook `useActivityTracker`
- Si integra nel layout dashboard

### 4. Dashboard Layout (`app/dashboard/layout.tsx`)
- Include `<ActivityTracker />` per monitorare tutte le pagine protette
- Verifica la sessione lato server prima del render

### 5. Login Page (`app/page.tsx`)
- Mostra messaggio quando `?expired=true` nel URL
- Design consistente con altri messaggi di notifica

## Flusso di Funzionamento

### Scenario 1: Utente Attivo
1. Utente fa login → `lastActivity` impostato nel JWT
2. Utente interagisce (click, scroll, etc.) → timestamp aggiornato localmente
3. Ogni 5 minuti → `update()` chiama il JWT callback con trigger "update"
4. JWT callback aggiorna `lastActivity` nel token
5. Sessione rimane valida

### Scenario 2: Utente Inattivo (30+ minuti)
1. Utente non interagisce per 30 minuti
2. Check interval (ogni minuto) rileva inattività > 30 minuti
3. Alert mostrato: "Your session has expired due to inactivity"
4. Redirect a `/?expired=true`
5. Messaggio arancione mostrato nella login page

### Scenario 3: Verifica Server-Side
1. Utente fa richiesta API o naviga
2. NextAuth verifica il JWT
3. Se `lastActivity` è troppo vecchio → token invalidato
4. Redirect automatico a login

## Configurazione

### Modificare il Timeout
Per cambiare la durata del timeout, modifica in 3 punti:

**1. `lib/auth.ts` - Session maxAge**
```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 60, // Cambia qui (in secondi)
}
```

**2. `lib/auth.ts` - JWT Callback**
```typescript
const thirtyMinutes = 30 * 60 * 1000; // Cambia qui (in millisecondi)
```

**3. `hooks/use-activity-tracker.ts`**
```typescript
const THIRTY_MINUTES = 30 * 60 * 1000; // Cambia qui (in millisecondi)
```

### Modificare Frequenza Aggiornamenti
In `hooks/use-activity-tracker.ts`:
```typescript
const UPDATE_INTERVAL = 5 * 60 * 1000; // Aggiorna sessione ogni X minuti
const CHECK_INTERVAL = 60 * 1000; // Controlla inattività ogni X secondi
```

## Sicurezza

### Vantaggi
- **Doppia verifica**: Client-side + Server-side
- **Token JWT**: Nessun bisogno di database session storage
- **Invalidazione automatica**: Token scade naturalmente
- **Activity tracking**: Solo eventi significativi aggiornano la sessione

### Considerazioni
- Eventi tracciati sono passivi (`{ passive: true }`) per performance
- `update()` chiamata solo se utente è attivo (riduce chiamate API)
- Alert nativo per massima visibilità (può essere personalizzato)

## Testing

### Test Manuale
1. Login nell'applicazione
2. Non interagire per 30 minuti
3. Verificare che appaia alert e redirect a login
4. Controllare messaggio arancione sulla login page

### Test Rapido (per sviluppo)
Modifica temporaneamente i timeout a 2 minuti:
```typescript
// In lib/auth.ts e use-activity-tracker.ts
const thirtyMinutes = 2 * 60 * 1000; // 2 minuti invece di 30
```

## Troubleshooting

### Sessione non scade
- Verifica che `ActivityTracker` sia incluso nel layout
- Controlla console per errori
- Verifica che `NEXTAUTH_SECRET` sia configurato in `.env`

### Logout troppo frequente
- Aumenta `maxAge` in `authOptions`
- Verifica che eventi di activity siano tracciati correttamente
- Controlla se `update()` viene chiamato regolarmente

### Alert non appare
- Verifica che l'hook `useActivityTracker` sia in esecuzione
- Controlla che `status === "authenticated"` sia true
- Debug con `console.log` nel check interval
