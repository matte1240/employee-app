# Docker Deployment Guide

## 🐳 Panoramica

Questa applicazione è pronta per il deployment Docker con:
- **Next.js 16** in produzione
- **PostgreSQL 16** come database
- **Multi-stage build** per immagini ottimizzate
- **Health checks** automatici
- **Volume persistenti** per dati e backup

## 📋 Prerequisiti

- Docker Engine 24.0+ 
- Docker Compose 2.0+
- File `.env.docker` configurato (vedi sotto)

## 🚀 Quick Start

### 1. Configurazione Ambiente

Assicurati che il file `.env.docker` sia configurato correttamente:

```bash
# Verifica la presenza del file
ls -la .env.docker

# Se necessario, modifica le variabili
nano .env.docker
```

Variabili chiave:
- `POSTGRES_PASSWORD`: Password sicura per il database
- `NEXTAUTH_SECRET`: Segreto per NextAuth (genera con `openssl rand -base64 32`)
- `NEXTAUTH_URL`: URL dell'applicazione (es. `http://localhost:3000`)

### 2. Deploy Completo (Metodo Rapido)

```bash
# Usa lo script helper per deploy completo
./docker-deploy.sh deploy
```

Questo comando:
1. ✅ Costruisce le immagini Docker
2. ✅ Avvia i container
3. ✅ Esegue le migrazioni del database
4. ✅ Verifica lo stato dei servizi

### 3. Deploy Manuale (Step by Step)

```bash
# 1. Build delle immagini
npm run docker:build
# oppure: docker compose --env-file .env.docker build

# 2. Avvio dei container
npm run docker:up
# oppure: docker compose --env-file .env.docker up -d

# 3. Verifica lo stato
docker compose --env-file .env.docker ps

# 4. Esegui migrazioni (già automatiche al primo avvio)
docker compose --env-file .env.docker exec app npx prisma migrate deploy
```

### 4. Verifica Deployment

```bash
# Controlla i container
docker compose --env-file .env.docker ps

# Visualizza i logs
docker compose --env-file .env.docker logs -f app
docker compose --env-file .env.docker logs -f postgres

# Testa l'applicazione
curl http://localhost:3000/api/auth/session
```

L'applicazione sarà disponibile su:
- **App**: http://localhost:3000
- **Database**: localhost:5433

## 📝 Comandi Docker Helper

Lo script `docker-deploy.sh` fornisce comandi utili:

```bash
# Deploy completo
./docker-deploy.sh deploy

# Build immagini
./docker-deploy.sh build

# Avvia container
./docker-deploy.sh start

# Ferma container
./docker-deploy.sh stop

# Riavvia container
./docker-deploy.sh restart

# Visualizza logs (app)
./docker-deploy.sh logs

# Visualizza logs (postgres)
./docker-deploy.sh logs postgres

# Esegui migrazioni
./docker-deploy.sh migrate

# Seed database
./docker-deploy.sh seed

# Stato container
./docker-deploy.sh status

# Shell nel container
./docker-deploy.sh exec sh

# Cleanup completo (rimuove volumi!)
./docker-deploy.sh clean
```

## 📦 NPM Scripts

```bash
# Build immagini
npm run docker:build

# Avvia container
npm run docker:up

# Ferma container
npm run docker:down

# Visualizza logs
npm run docker:logs

# Riavvia container
npm run docker:restart

# Deploy completo
npm run docker:deploy
```

## 🗂️ Struttura Volumi

```
employee-app/
├── logs/                    # Logs applicazione (montato in container)
├── backups/database/        # Backup database (montato in container)
└── db_data/                 # Dati PostgreSQL (gestito da Docker volume)
```

## 🔧 Troubleshooting

### Container non parte

```bash
# Verifica i logs
docker compose --env-file .env.docker logs

# Ricostruisci le immagini
docker compose --env-file .env.docker build --no-cache

# Verifica le variabili d'ambiente
docker compose --env-file .env.docker config
```

### Errori di connessione database

```bash
# Verifica che PostgreSQL sia healthy
docker compose --env-file .env.docker ps

# Controlla i logs del database
docker compose --env-file .env.docker logs postgres

# Riavvia solo il database
docker compose --env-file .env.docker restart postgres
```

### Reset completo

```bash
# ATTENZIONE: Rimuove tutti i dati!
docker compose --env-file .env.docker down -v
docker compose --env-file .env.docker up -d
```

## 🔒 Migrazioni Database

Le migrazioni vengono eseguite automaticamente all'avvio del container app.

Per eseguirle manualmente:

```bash
# Esegui migrazioni
docker compose --env-file .env.docker exec app npx prisma migrate deploy

# Seed database (utenti di test)
docker compose --env-file .env.docker exec app npx prisma db seed
```

## 🌐 Deploy in Produzione

### Modifiche necessarie per produzione:

1. **Variabili d'ambiente**:
   - Aggiorna `NEXTAUTH_URL` con il dominio pubblico
   - Usa password sicure per `POSTGRES_PASSWORD`
   - Genera nuovo `NEXTAUTH_SECRET`

2. **Reverse Proxy** (Nginx/Caddy):
   ```nginx
   server {
       listen 80;
       server_name example.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **SSL/TLS**:
   - Usa Let's Encrypt con Certbot
   - Oppure configura un reverse proxy con SSL

4. **Backup automatici**:
   ```bash
   # Aggiungi a crontab
   0 2 * * * docker compose --env-file /path/to/.env.docker exec postgres \
       pg_dump -U app employee_tracker > /backups/backup-$(date +\%Y\%m\%d).sql
   ```

## 📊 Monitoring

```bash
# Stats in tempo reale
docker stats

# Health check manuale
docker inspect employee-tracker-app | grep -A 10 Health

# Logs strutturati
docker compose --env-file .env.docker logs --tail=100 --follow app
```

## 🛠️ Sviluppo vs Produzione

| Aspetto | Sviluppo | Produzione (Docker) |
|---------|----------|---------------------|
| Server | `npm run dev` | Docker container |
| Database | PostgreSQL locale | PostgreSQL container |
| Hot Reload | ✅ Sì | ❌ No (rebuild richiesto) |
| Ottimizzazioni | ❌ No | ✅ Sì (standalone output) |
| PM2 | ✅ Sì (opzionale) | ❌ No (gestito da Docker) |

## 📚 Risorse

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)

---

**Nota**: Assicurati che i file `Dockerfile`, `docker-compose.yml` e `.dockerignore` siano aggiornati prima del deployment.
