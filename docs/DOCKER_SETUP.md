# Docker Deployment - Setup Completato

## 📦 File Creati

### File Docker
- **`Dockerfile`**: Multi-stage build ottimizzato per Next.js 16
- **`docker-compose.yml`**: Orchestrazione di app + PostgreSQL
- **`.dockerignore`**: Esclusioni per build efficienti
- **`docker-deploy.sh`**: Script helper per operazioni comuni

### Documentazione
- **`DOCKER.md`**: Guida completa al deployment Docker

### Configurazione
- **`.env.docker.example`**: Template configurazione (già presente)
- **`next.config.ts`**: Aggiunto `output: 'standalone'`
- **`package.json`**: Aggiunti script npm per Docker

## 🚀 Comandi Quick Start

### Deployment Completo
```bash
# Metodo 1: Script helper (raccomandato)
./docker-deploy.sh deploy

# Metodo 2: NPM script
npm run docker:deploy

# Metodo 3: Manuale
npm run docker:build
npm run docker:up
```

### Comandi Utili
```bash
# Visualizza logs
npm run docker:logs

# Riavvia container
npm run docker:restart

# Ferma tutto
npm run docker:down

# Stato container
docker compose --env-file .env.docker ps
```

## 🔧 Struttura Docker

### Multi-Stage Build
1. **deps**: Installa dipendenze production
2. **builder**: Build Next.js + genera Prisma Client
3. **runner**: Immagine finale ottimizzata (~200MB)

### Servizi
- **app**: Next.js in produzione (porta 3000)
- **postgres**: PostgreSQL 16 (porta 5433)

### Volumi
- `postgres_data`: Dati database (persistenti)
- `./logs`: Log applicazione (bind mount)
- `./backups/database`: Backup database (bind mount)

## ⚙️ Configurazione Automatica

### Migrazioni Database
Le migrazioni Prisma vengono eseguite automaticamente all'avvio del container app:
```bash
npx prisma migrate deploy
```

### Health Checks
- **App**: GET /api/auth/session ogni 30s
- **PostgreSQL**: pg_isready ogni 10s

### Restart Policy
Entrambi i container usano `restart: unless-stopped` per alta disponibilità.

## 📊 Caratteristiche

✅ Build multi-stage ottimizzato
✅ Next.js standalone output
✅ Prisma Client generato automaticamente
✅ Health checks automatici
✅ Migrazioni database automatiche
✅ Volumi persistenti
✅ Log strutturati
✅ Backup directory montata
✅ Networking isolato
✅ Non-root user per sicurezza

## 🛠️ Prossimi Passi

### Per Sviluppo Locale
```bash
# 1. Verifica .env.docker
cat .env.docker

# 2. Deploy
./docker-deploy.sh deploy

# 3. Seed database (opzionale)
./docker-deploy.sh seed

# 4. Accedi all'app
open http://localhost:3000
```

### Per Produzione
1. Aggiorna `.env.docker`:
   - `NEXTAUTH_URL` → dominio pubblico
   - `POSTGRES_PASSWORD` → password sicura
   - `NEXTAUTH_SECRET` → nuovo secret (`openssl rand -base64 32`)

2. Configura reverse proxy (Nginx/Caddy)

3. Setup SSL/TLS (Let's Encrypt)

4. Configura backup automatici

Vedi `DOCKER.md` per dettagli completi.

## 📝 Note

- Il build iniziale richiede ~5-10 minuti
- L'app sarà disponibile su http://localhost:3000
- Il database sarà su localhost:5433
- I dati sono persistiti in volumi Docker
- Usa `./docker-deploy.sh clean` per reset completo (rimuove dati!)

---

**Status**: ✅ Configurazione completata - Pronto per il deployment!
