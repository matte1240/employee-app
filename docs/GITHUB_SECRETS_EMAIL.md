# Configurazione Secrets Email per GitHub Actions

## 📋 Secrets da Aggiungere su GitHub

Vai su **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions** e aggiungi i seguenti secrets:

### Email Configuration Secrets

| Nome Secret | Valore | Descrizione |
|-------------|--------|-------------|
| `EMAIL_HOST` | `smtp.gmail.com` | Server SMTP di Gmail |
| `EMAIL_PORT` | `587` | Porta SMTP con STARTTLS |
| `EMAIL_USER` | `tua-email@gmail.com` | Email Gmail completa |
| `EMAIL_PASSWORD` | `xxxx xxxx xxxx xxxx` | App Password di Gmail (16 caratteri) |
| `EMAIL_FROM_NAME` | `Ivicolors` | Nome mittente nelle email |

## 🔑 Come Ottenere la App Password di Gmail

1. Vai su [Google Account Security](https://myaccount.google.com/security)
2. Abilita la **verifica in due passaggi** (se non è già attiva)
3. Vai su **App passwords** (Password per le app)
4. Seleziona:
   - **App**: Mail
   - **Device**: Other (Custom name) → scrivi "GitHub Actions"
5. Google genererà una password di 16 caratteri (es: `abcd efgh ijkl mnop`)
6. **Copia questa password** (senza spazi) e usala come valore per `EMAIL_PASSWORD`

## ✅ Verifica Secrets Esistenti

Assicurati di avere anche questi secrets già configurati:

### Staging Secrets
- `STAGING_DATABASE_URL`
- `STAGING_NEXTAUTH_SECRET`
- `STAGING_NEXTAUTH_URL`
- `STAGING_SSH_KEY`
- `STAGING_USER`
- `STAGING_IP`

### Production Secrets
- `PRODUCTION_DATABASE_URL`
- `PRODUCTION_NEXTAUTH_SECRET`
- `PRODUCTION_NEXTAUTH_URL`
- `PRODUCTION_SSH_KEY`
- `PRODUCTION_USER`
- `PRODUCTION_IP`

### Bastion Secrets
- `BASTION_SSH_KEY`
- `BASTION_USER`
- `BASTION_IP`

## 🚀 Workflow Aggiornati

I file `.github/workflows/deploy-staging.yml` e `.github/workflows/deploy-production.yml` sono stati aggiornati per:

1. ✅ Passare le variabili email via SSH
2. ✅ Creare il file `.env` con tutte le variabili necessarie
3. ✅ Funzionalità email disponibili automaticamente dopo il deploy

## 📝 Cosa Succede al Deploy

Quando fai push su `dev` (staging) o `main` (production), il workflow:

1. Si connette al server via bastion
2. Clona/aggiorna il repository
3. Crea il file `.env` con TUTTE le variabili (database + auth + email)
4. Installa dipendenze
5. Esegue build
6. Applica migrazioni database
7. Riavvia l'app con PM2

## ⚠️ Note Importanti

- **NON committare mai** il file `.env` con i secrets reali
- I secrets email sono **condivisi** tra staging e production (stessa Gmail)
- Se vuoi email diverse per staging/production, crea secrets separati:
  - `STAGING_EMAIL_USER` / `PRODUCTION_EMAIL_USER`
  - `STAGING_EMAIL_PASSWORD` / `PRODUCTION_EMAIL_PASSWORD`
  - E aggiorna i workflow di conseguenza

## 🧪 Test dopo il Deploy

Dopo aver aggiunto i secrets e fatto il deploy:

1. Vai sulla pagina di **Gestione Utenti** (o Gestione Utenti DEV)
2. Crea un nuovo utente
3. Verifica che l'email arrivi correttamente
4. Controlla i log PM2 per eventuali errori email:
   ```bash
   npx pm2 logs app-staging --lines 50
   ```

## 🔍 Debug

Se le email non funzionano:

1. Verifica che i secrets siano stati aggiunti correttamente su GitHub
2. Controlla i log del workflow GitHub Actions per errori
3. SSH nel server e verifica il file `.env`:
   ```bash
   ssh staging "cat ~/development-webapp/.env | grep EMAIL"
   ```
4. Controlla i log PM2 per errori di invio email
5. Verifica che la App Password di Gmail sia corretta e non scaduta

## 📚 Riferimenti

- [EMAIL_SETUP.md](./EMAIL_SETUP.md) - Guida completa setup email
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
