# 🚀 Development Setup Guide

Guida rapida per iniziare lo sviluppo con Docker.

## 📋 Opzioni di Sviluppo

Puoi sviluppare in **due modi**:

### 1️⃣ Locale (senza Docker) - Raccomandato per sviluppo attivo

```bash
# Setup iniziale
cp .env.example .env
npm install
npm run prisma:migrate

# Avvia dev server
npm run dev
```

**Pro**: Hot reload velocissimo, debugging facile  
**Contro**: Richiede Node.js locale

---

### 2️⃣ Docker Development (con hot reload)

```bash
# Setup iniziale
cp .env.example .env

# Avvia tutto in Docker (con hot reload!)
npm run docker:dev

# Oppure rebuild se hai cambiato dipendenze
npm run docker:dev:build
```

**Pro**: Ambiente identico a production, isolato  
**Contro**: Leggermente più lento del dev locale

---

## 🐳 Comandi Docker Development

```bash
# Avvia containers (app + database)
npm run docker:dev

# Rebuild e avvia (dopo modifiche a package.json o Dockerfile)
npm run docker:dev:build

# Ferma tutto
npm run docker:dev:down

# Vedi logs in tempo reale
npm run docker:dev:logs

# Oppure usa direttamente docker compose
docker compose -f docker-compose.dev.yml up
docker compose -f docker-compose.dev.yml down
```

---

## 🔧 Hot Reload in Docker

Il `docker-compose.dev.yml` è configurato per hot reload:

- ✅ Modifiche al codice → Reload automatico
- ✅ Database persistente (volume Docker)
- ✅ Node modules isolati
- ✅ Migrazioni automatiche all'avvio
- ✅ Porta 3000 esposta

---

## 🗂️ File di Configurazione

| File | Uso |
|------|-----|
| `docker-compose.dev.yml` | Development locale con Docker |
| `docker-compose.staging.yml` | Staging server |
| `docker-compose.yml` | Production server |
| `.env` | Variabili d'ambiente (usa .env.example come template) |

---

## 🛠️ Workflow Tipico

```bash
# 1. Clone e setup
git clone <repo>
cd employee-app
cp .env.example .env

# 2. Scegli modalità development

# Opzione A: Locale
npm install
npm run dev

# Opzione B: Docker
npm run docker:dev

# 3. Accedi all'app
# http://localhost:3000
```

---

## 📊 Gestione Database

### Con Docker Dev

```bash
# Applicare nuova migrazione
docker compose -f docker-compose.dev.yml exec app npx prisma migrate dev

# Seed database
docker compose -f docker-compose.dev.yml exec app npx prisma db seed

# Prisma Studio (GUI)
docker compose -f docker-compose.dev.yml exec app npx prisma studio
```

### Locale

```bash
npm run prisma:migrate    # Crea e applica migrazione
npm run prisma:seed       # Popola database
npx prisma studio         # Apri GUI
```

---

## 🔍 Troubleshooting

### Hot reload non funziona in Docker

Assicurati di aver montato i volumi correttamente in `docker-compose.dev.yml`:
```yaml
volumes:
  - .:/app
  - /app/node_modules
  - /app/.next
```

### Porta già in uso

Cambia porta in `.env`:
```env
APP_PORT=3001
```

### Database connection error

Verifica che il container DB sia healthy:
```bash
docker compose -f docker-compose.dev.yml ps
```

---

## 🚀 Deployment

Quando sei pronto per il deployment:

1. **Staging**: Merge `dev` → `staging` → Auto-deploy
2. **Production**: Merge `staging` → `main` → Auto-deploy

Vedi `docs/DEPLOYMENT_GUIDE.md` per dettagli.

---

**Fatto con ❤️ per uno sviluppo veloce e produttivo!**
