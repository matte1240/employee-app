# 🚀 Deployment Guide

Guida completa per configurare il deployment automatico su server Staging e Production separati.

## 📋 Indice

- [Panoramica](#panoramica)
- [Prerequisiti](#prerequisiti)
- [Setup Server](#setup-server)
- [Configurazione GitHub Secrets](#configurazione-github-secrets)
- [Workflow di Deployment](#workflow-di-deployment)
- [Troubleshooting](#troubleshooting)
- [Rollback e Recovery](#rollback-e-recovery)

---

## 🎯 Panoramica

L'applicazione utilizza **due server separati** per Staging e Production:

```
┌─────────────────┐
│   GitHub Repo   │
│                 │
│   dev branch    │ ─────► Build Docker :dev
│                 │
│ staging branch  │ ─────► Build + Deploy → 🟡 Staging Server
│                 │
│   main branch   │ ─────► Build + Deploy → 🟢 Production Server
│                 │
│   v*.*.* tag    │ ─────► GitHub Release + Docker :latest
└─────────────────┘
```

### Workflow Automatici

| Workflow | Trigger | Azione |
|----------|---------|--------|
| **docker-build.yml** | Push su `dev` o `main` | Build immagine Docker |
| **deploy-staging.yml** | Push su `staging` | Build + Deploy su server staging |
| **deploy-production.yml** | Push su `main` | Build + Deploy su server production |
| **release.yml** | Tag `v*.*.*` | Crea release GitHub + Docker :latest |

---

## ✅ Prerequisiti

### 1. Server Requirements

Entrambi i server (staging e production) devono avere:

```bash
# Sistema operativo
Ubuntu 22.04 LTS (consigliato) o superiore

# Software richiesto
- Docker Engine 24.0+
- Docker Compose v2.20+
- Git 2.34+
- curl
- openssh-server
```

### 2. Installazione Software sui Server

#### Staging Server Setup

```bash
# Connetti al server staging
ssh user@staging-server.example.com

# Aggiorna sistema
sudo apt update && sudo apt upgrade -y

# Installa Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installa Docker Compose
sudo apt install docker-compose-plugin

# Verifica installazione
docker --version
docker compose version
```

#### Production Server Setup

```bash
# Connetti al server production
ssh user@production-server.example.com

# Ripeti gli stessi comandi del server staging
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo apt install docker-compose-plugin

docker --version
docker compose version
```

### 3. Creazione Directory Applicazione

#### Su Staging Server

```bash
# Crea directory app
sudo mkdir -p /opt/employee-app
sudo chown $USER:$USER /opt/employee-app
cd /opt/employee-app

# Clona repository
git clone https://github.com/matte1240/employee-app.git .
git checkout staging

# Crea directory per backups
mkdir -p backups/database

# Crea file .env
cat > .env << 'EOF'
# Database
POSTGRES_USER=app
POSTGRES_PASSWORD=strong_staging_password_here
POSTGRES_DB=employee_tracker
DB_PORT=5433

# NextAuth
NEXTAUTH_URL=https://staging.example.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# App
APP_PORT=3001
APP_URL=https://staging.example.com

# Email (opzionale per staging)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Time Tracker
EOF

# Imposta permessi
chmod 600 .env
```

#### Su Production Server

```bash
# Crea directory app
sudo mkdir -p /opt/employee-app
sudo chown $USER:$USER /opt/employee-app
cd /opt/employee-app

# Clona repository
git clone https://github.com/matte1240/employee-app.git .
git checkout main

# Crea directory per backups
mkdir -p backups/database

# Crea file .env (con credenziali production!)
cat > .env << 'EOF'
# Database
POSTGRES_USER=app
POSTGRES_PASSWORD=very_strong_production_password_here
POSTGRES_DB=employee_tracker
DB_PORT=5433

# NextAuth
NEXTAUTH_URL=https://production.example.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32-different-from-staging

# App
APP_PORT=3000
APP_URL=https://production.example.com

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Time Tracker Production
EOF

# Imposta permessi
chmod 600 .env
```

### 4. Genera Chiavi SSH per Deployment

Le chiavi SSH permettono a GitHub Actions di connettersi ai server.

#### Genera chiave per Staging

```bash
# Sul tuo computer locale (NON sul server)
ssh-keygen -t ed25519 -C "github-actions-staging" -f ~/.ssh/gh_actions_staging

# Copia chiave pubblica sul server staging
ssh-copy-id -i ~/.ssh/gh_actions_staging.pub user@staging-server.example.com

# Testa connessione
ssh -i ~/.ssh/gh_actions_staging user@staging-server.example.com "echo 'Staging SSH OK!'"
```

#### Genera chiave per Production

```bash
# Sul tuo computer locale
ssh-keygen -t ed25519 -C "github-actions-production" -f ~/.ssh/gh_actions_production

# Copia chiave pubblica sul server production
ssh-copy-id -i ~/.ssh/gh_actions_production.pub user@production-server.example.com

# Testa connessione
ssh -i ~/.ssh/gh_actions_production user@production-server.example.com "echo 'Production SSH OK!'"
```

#### Mostra chiavi private (da salvare nei secrets GitHub)

```bash
# Chiave staging (salvare questo output)
cat ~/.ssh/gh_actions_staging

# Chiave production (salvare questo output)
cat ~/.ssh/gh_actions_production
```

⚠️ **IMPORTANTE**: Le chiavi private vanno salvate nei GitHub Secrets, MAI committate nel repository!

---

## 🔐 Configurazione GitHub Secrets

Vai su: **GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret**

### Secrets per Staging

| Secret Name | Valore | Descrizione |
|-------------|--------|-------------|
| `STAGING_HOST` | `staging.example.com` | Hostname o IP del server staging |
| `STAGING_USER` | `deploy-user` | Username SSH per staging |
| `STAGING_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Chiave privata SSH (tutto il contenuto di `gh_actions_staging`) |
| `STAGING_PORT` | `22` | Porta SSH (opzionale, default 22) |
| `STAGING_APP_DIR` | `/opt/employee-app` | Directory dell'app sul server |

### Secrets per Production

| Secret Name | Valore | Descrizione |
|-------------|--------|-------------|
| `PRODUCTION_HOST` | `production.example.com` | Hostname o IP del server production |
| `PRODUCTION_USER` | `deploy-user` | Username SSH per production |
| `PRODUCTION_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Chiave privata SSH (tutto il contenuto di `gh_actions_production`) |
| `PRODUCTION_PORT` | `22` | Porta SSH (opzionale, default 22) |
| `PRODUCTION_APP_DIR` | `/opt/employee-app` | Directory dell'app sul server |

### Come Aggiungere un Secret

1. Vai su: `https://github.com/matte1240/employee-app/settings/secrets/actions/new`
2. Inserisci il **Name** (es. `STAGING_HOST`)
3. Inserisci il **Secret** (es. `staging.example.com`)
4. Clicca **Add secret**
5. Ripeti per tutti i secrets necessari

### Verifica Secrets

Dopo aver aggiunto tutti i secrets, dovresti avere:

```
Repository Secrets (10):
✅ STAGING_HOST
✅ STAGING_USER
✅ STAGING_SSH_KEY
✅ STAGING_PORT
✅ STAGING_APP_DIR
✅ PRODUCTION_HOST
✅ PRODUCTION_USER
✅ PRODUCTION_SSH_KEY
✅ PRODUCTION_PORT
✅ PRODUCTION_APP_DIR
```

---

## 🔄 Workflow di Deployment

### 1. Deploy su Staging (Automatico)

```bash
# Sviluppa su dev
git checkout dev
# ... modifiche ...
git add .
git commit -m "feat: nuova feature"
git push origin dev

# Quando pronto per test, merge su staging
git checkout staging
git merge dev
git push origin staging

# ⚡ GitHub Actions automaticamente:
# 1. Build immagine Docker :staging
# 2. Push su ghcr.io
# 3. SSH al server staging
# 4. Pull immagine
# 5. docker compose down
# 6. docker compose up -d
# 7. Health check
```

**Monitoraggio**: https://github.com/matte1240/employee-app/actions

### 2. Deploy su Production (Automatico)

```bash
# Dopo test OK su staging
git checkout main
git merge staging
git push origin main

# ⚡ GitHub Actions automaticamente:
# 1. Backup database
# 2. Build immagine Docker :main
# 3. Push su ghcr.io
# 4. SSH al server production
# 5. Pull immagine
# 6. Prisma migrate deploy
# 7. Rolling update (zero-downtime)
# 8. Health check
# 9. Cleanup immagini vecchie
```

### 3. Deploy Manuale (Emergency)

Se i workflow automatici falliscono, puoi deployare manualmente:

#### Staging Manual Deploy

```bash
# Connetti al server staging
ssh user@staging-server.example.com

# Navigate to app
cd /opt/employee-app

# Pull changes
git fetch origin
git checkout staging
git pull origin staging

# Pull latest image
docker compose -f docker-compose.staging.yml pull

# Restart
docker compose -f docker-compose.staging.yml down
docker compose -f docker-compose.staging.yml up -d

# Check logs
docker compose -f docker-compose.staging.yml logs -f --tail=50
```

#### Production Manual Deploy

```bash
# Connetti al server production
ssh user@production-server.example.com

# Navigate to app
cd /opt/employee-app

# Backup database FIRST!
docker compose exec db pg_dump -U employee_user employee_db > "backups/database/manual-backup-$(date +%Y-%m-%d).sql"

# Pull changes
git fetch origin
git checkout main
git pull origin main

# Pull latest image
docker compose pull

# Apply migrations
docker compose run --rm app npx prisma migrate deploy

# Restart
docker compose down
docker compose up -d

# Check logs
docker compose logs -f --tail=50
```

---

## 🛠️ Troubleshooting

### Deployment Fallisce

#### 1. Verifica SSH Connection

```bash
# Testa connessione SSH dal tuo computer
ssh -i ~/.ssh/gh_actions_staging user@staging-server.example.com

# Se funziona dal tuo PC ma non da GitHub Actions:
# - Verifica che il secret STAGING_SSH_KEY contenga l'intera chiave privata
# - Verifica che non ci siano spazi extra all'inizio/fine
# - Verifica che il formato sia corretto (BEGIN/END OPENSSH PRIVATE KEY)
```

#### 2. Docker Login Fails

```bash
# Sul server, testa login manuale
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u your-username --password-stdin

# Se fallisce:
# - Verifica che GITHUB_TOKEN abbia permesso packages:read
# - Verifica che l'immagine sia pubblica o che il token abbia accesso
```

#### 3. Container Non Si Avvia

```bash
# Sul server, controlla logs
docker compose logs app --tail=100

# Problemi comuni:
# - DATABASE_URL errato in .env
# - NEXTAUTH_SECRET mancante
# - Porta 3000 già occupata
```

#### 4. Database Connection Error

```bash
# Verifica che il database sia healthy
docker compose ps
docker compose logs db --tail=50

# Testa connessione manuale
docker compose exec db psql -U employee_user -d employee_db

# Se fallisce:
# - Verifica POSTGRES_PASSWORD in .env
# - Verifica che il container db sia in stato "Up (healthy)"
```

### Health Check Fails

```bash
# Sul server, testa health endpoint
curl http://localhost:3000/api/health

# Se fallisce:
# - Controlla che l'app sia in ascolto su porta 3000
# - Controlla logs: docker compose logs app
# - Verifica che NextAuth sia configurato correttamente
```

### Migration Failures

```bash
# Sul server production, applica manualmente
docker compose run --rm app npx prisma migrate deploy

# Se fallisce:
# - Controlla che la connessione DB funzioni
# - Verifica che le migrazioni siano committate nel repo
# - Controlla prisma/migrations/ nel container
```

---

## 🔙 Rollback e Recovery

### Quick Rollback (Production)

Se il deployment causa problemi immediati:

```bash
# Connetti al server production
ssh user@production-server.example.com
cd /opt/employee-app

# Opzione 1: Rollback al commit precedente
git log --oneline -5  # Trova commit precedente
git checkout PREVIOUS_COMMIT_SHA
docker compose pull
docker compose down
docker compose up -d

# Opzione 2: Usa immagine precedente
docker images | grep employee-app  # Trova tag precedente
# Modifica docker-compose.yml per usare :sha-xyz invece di :main
docker compose up -d

# Opzione 3: Restore database backup
# SE hai backup recente e dati corrotti
docker compose down
# Restore database (vedi sotto)
docker compose up -d
```

### Database Restore

```bash
# Sul server production
cd /opt/employee-app

# Lista backups disponibili
ls -lh backups/database/

# Stop app (ma non DB!)
docker compose stop app

# Restore backup
cat backups/database/backup-YYYY-MM-DD.sql | docker compose exec -T db psql -U employee_user employee_db

# Restart app
docker compose start app

# Verifica
docker compose logs app --tail=50
```

### Emergency Maintenance Mode

Se devi mettere il sito in manutenzione:

```bash
# Sul server production
cd /opt/employee-app

# Stop app container only
docker compose stop app

# Create temporary maintenance page
docker run -d --name maintenance \
  -p 3000:80 \
  -v $(pwd)/maintenance.html:/usr/share/nginx/html/index.html:ro \
  nginx:alpine

# Create maintenance.html first:
cat > maintenance.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Manutenzione</title>
  <style>
    body {
      font-family: system-ui;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔧 Manutenzione in Corso</h1>
    <p>Torneremo online a breve. Grazie per la pazienza!</p>
  </div>
</body>
</html>
EOF

# Quando pronto, rimuovi manutenzione
docker stop maintenance && docker rm maintenance
docker compose up -d app
```

---

## 📊 Monitoring

### Check Services Status

```bash
# Staging
ssh user@staging-server.example.com 'cd /opt/employee-app && docker compose -f docker-compose.staging.yml ps'

# Production
ssh user@production-server.example.com 'cd /opt/employee-app && docker compose ps'
```

### View Logs Remotely

```bash
# Staging logs
ssh user@staging-server.example.com 'cd /opt/employee-app && docker compose -f docker-compose.staging.yml logs --tail=50 -f'

# Production logs
ssh user@production-server.example.com 'cd /opt/employee-app && docker compose logs --tail=50 -f'
```

### Health Checks

```bash
# Staging health check
curl https://staging.example.com/api/health

# Production health check
curl https://production.example.com/api/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

---

## 🎯 Best Practices

1. **Sempre testa su staging prima di production**
   - Merge dev → staging
   - Testa funzionalità
   - Solo dopo merge staging → main

2. **Backup automatici**
   - Production deployment fa backup automatico
   - Conserva almeno 7 giorni di backup
   - Testa restore periodicamente

3. **Monitoraggio**
   - Controlla GitHub Actions dopo ogni push
   - Imposta notifiche per deployment failures
   - Controlla logs regolarmente

4. **Zero-downtime deployment**
   - Production usa rolling update
   - Health checks prima di dichiarare successo
   - Rollback automatico in caso di errori

5. **Sicurezza**
   - Mai committare secrets nel repo
   - Usa chiavi SSH dedicate per deploy
   - Ruota passwords regolarmente
   - Mantieni .env fuori da git (già in .gitignore)

---

## 📚 Risorse Aggiuntive

- [GitHub Actions SSH Action](https://github.com/appleboy/ssh-action)
- [Docker Compose Best Practices](https://docs.docker.com/compose/production/)
- [PostgreSQL Backup & Restore](https://www.postgresql.org/docs/current/backup.html)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Fatto con ❤️ per deployment sicuri e affidabili!**
