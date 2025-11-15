# Configurazione Email con Gmail

Questa guida spiega come configurare l'invio di email tramite Gmail per l'applicazione Time Tracker.

## 📋 Prerequisiti

- Un account Gmail attivo
- Autenticazione a 2 fattori (2FA) abilitata sul tuo account Google

## 🔐 Generare una App Password di Gmail

Google richiede l'uso di **App Password** anziché la password normale per accedere via SMTP da applicazioni esterne.

### Passaggi:

1. **Vai alle impostazioni del tuo account Google**
   - Accedi a [myaccount.google.com](https://myaccount.google.com)

2. **Abilita l'autenticazione a 2 fattori (se non già fatto)**
   - Vai su "Sicurezza" → "Verifica in due passaggi"
   - Segui i passaggi per configurare 2FA

3. **Genera una App Password**
   - Vai su "Sicurezza" → "Verifica in due passaggi" → "Password per le app"
   - Oppure vai direttamente a: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Seleziona "Posta" come app e "Altro (nome personalizzato)" come dispositivo
   - Inserisci un nome (es. "Time Tracker App")
   - Clicca su "Genera"
   - **Copia la password a 16 caratteri** che appare (senza spazi)

## ⚙️ Configurare le Variabili d'Ambiente

1. **Modifica il file `.env`** nella root del progetto con le tue credenziali:

```env
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=tuo-indirizzo@gmail.com
EMAIL_PASSWORD=abcd-efgh-ijkl-mnop  # La App Password a 16 caratteri
EMAIL_FROM_NAME=Time Tracker
```

**⚠️ Importante:**
- Usa la **App Password a 16 caratteri**, NON la tua password Gmail normale
- NON committare il file `.env` su Git (è già in `.gitignore`)
- Mantieni questa password sicura e privata

## 🧪 Testare la Configurazione

Puoi testare l'invio email in diversi modi:

### 1. Creare un nuovo utente (come Admin)
Quando crei un nuovo utente dall'interfaccia admin, verrà automaticamente inviata un'email di benvenuto con le credenziali.

### 2. Reset password (come Admin)
Quando resetti la password di un utente, verrà inviata un'email con la nuova password temporanea.

### 3. Test manuale via API
Puoi testare la funzione di verifica connessione:

```typescript
// Aggiungi questo a un file di test
import { verifyEmailConnection } from '@/lib/email';

await verifyEmailConnection();
// Se vedi "✅ Server email pronto per l'invio" funziona!
```

## 📧 Funzionalità Email Implementate

L'app invia email automaticamente in questi casi:

1. **Email di Benvenuto** (`sendWelcomeEmail`)
   - Quando viene creato un nuovo utente
   - Contiene username e password temporanea
   - Design HTML responsive con branding

2. **Email Reset Password** (`sendPasswordResetEmail`)
   - Quando un admin resetta la password di un utente
   - Contiene la nuova password temporanea
   - Include avvisi di sicurezza

3. **Email Notifica Generica** (`sendNotificationEmail`)
   - Funzione generica per future estensioni
   - Personalizzabile con HTML e testo

## 🎨 Template Email

Le email includono:
- ✅ Design HTML responsive
- ✅ Versione plain text per compatibilità
- ✅ Branding con colori dell'app
- ✅ Link diretto al login
- ✅ Istruzioni chiare per l'utente

## 🔧 Risoluzione Problemi

### "Invalid credentials" o "Authentication failed"
- Verifica di aver copiato correttamente la App Password (16 caratteri)
- Assicurati che 2FA sia abilitato sul tuo account Google
- Rigenera una nuova App Password se necessario

### "Connection timeout"
- Verifica la tua connessione internet
- Controlla che il firewall non blocchi la porta 587
- Prova a usare porta 465 con `secure: true` in `lib/email.ts`

### Email non arrivano
- Controlla la cartella spam/posta indesiderata
- Verifica che l'indirizzo email del destinatario sia corretto
- Controlla i log del server per errori

### Limiti di invio Gmail
- Gmail ha limiti di invio (circa 500 email/giorno per account gratuiti)
- Per volumi elevati, considera di usare servizi come SendGrid, AWS SES, o Mailgun

## 🚀 Deployment in Produzione

Per deployment in produzione:

1. **Configura le variabili d'ambiente sul server**:
   ```bash
   export EMAIL_HOST=smtp.gmail.com
   export EMAIL_USER=your-production-email@gmail.com
   export EMAIL_PASSWORD=your-app-password
   export EMAIL_FROM_NAME="Your Company Time Tracker"
   ```

2. **Considera un servizio email dedicato**:
   - Per ambienti di produzione, è consigliabile usare servizi come:
     - [SendGrid](https://sendgrid.com) - 100 email/giorno gratis
     - [AWS SES](https://aws.amazon.com/ses/) - Pay-as-you-go
     - [Mailgun](https://www.mailgun.com) - 5000 email/mese gratis
   - Questi servizi offrono migliori deliverability, analytics, e limiti più alti

3. **Modifica `lib/email.ts`** per il nuovo provider se necessario

## 📚 Documentazione Correlata

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Google App Passwords](https://support.google.com/accounts/answer/185833)

## 🔒 Sicurezza

- ✅ Password memorizzate come hash nel database
- ✅ Password in chiaro solo nell'email (via TLS)
- ✅ App Password separate dalla password Gmail principale
- ✅ Email inviate su connessione TLS criptata (porta 587)
- ⚠️ Ricorda agli utenti di cambiare la password temporanea al primo login!
