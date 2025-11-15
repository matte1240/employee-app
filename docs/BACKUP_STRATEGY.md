# Strategia di Backup del Database

## Panoramica
Il sistema implementa una strategia completa di backup automatico per il database PostgreSQL con:
- **Backup giornalieri automatici** (ogni notte alle 2:00)
- **Cleanup automatico settimanale** (domenica alle 3:00)
- **Compressione gzip** per ridurre lo spazio su disco
- **Retention policy configurabile** (default: 30 giorni, minimo 7 backup)

## Comandi Disponibili

### Backup Manuale
```bash
npm run backup:db
```
Crea un backup immediato del database con timestamp. Il backup viene salvato in `backups/database/` e compresso automaticamente.

**Output:**
- File: `backups/database/backup_YYYYMMDD_HHMMSS.sql.gz`
- Mostra dimensione file e totale backup esistenti

### Restore Database
```bash
npm run restore:db backup_20241112_140000.sql.gz
```
Ripristina il database da un backup specifico.

**⚠️ ATTENZIONE:** Questa operazione:
- Termina tutte le connessioni attive al database
- Elimina il database esistente
- Ricrea il database e ripristina i dati dal backup
- Richiede conferma esplicita (`yes`)

**Dopo il restore:**
```bash
npm run prisma:deploy
```
Per applicare eventuali migrazioni mancanti.

### Cleanup Backups
```bash
# Usa policy di default (30 giorni, minimo 7 backup)
npm run backup:cleanup

# Configurazione personalizzata
bash scripts/cleanup-backups.sh <giorni> <min_backups>

# Esempio: mantieni 60 giorni, minimo 14 backup
bash scripts/cleanup-backups.sh 60 14
```

Rimuove i backup vecchi secondo la retention policy, mantenendo sempre un numero minimo di backup recenti per sicurezza.

## Backup Automatici con PM2

### Configurazione Cron Jobs
Il file `ecosystem.config.js` include due cron job PM2:

#### 1. Backup Giornaliero
- **Schedule:** Ogni giorno alle 2:00 AM
- **App name:** `db-backup-cron`
- **Logs:** `logs/backup-out.log`, `logs/backup-error.log`

#### 2. Cleanup Settimanale
- **Schedule:** Ogni domenica alle 3:00 AM
- **App name:** `backup-cleanup-cron`
- **Policy:** 30 giorni retention, minimo 7 backup
- **Logs:** `logs/cleanup-out.log`, `logs/cleanup-error.log`

### Gestione Cron Jobs

```bash
# Avvia tutti i processi PM2 (app + cron jobs)
npm run pm2:start

# Verifica stato
pm2 list

# Visualizza logs backup
pm2 logs db-backup-cron

# Visualizza logs cleanup
pm2 logs backup-cleanup-cron

# Forza backup manuale (test)
pm2 trigger db-backup-cron restart

# Stop cron job backup
pm2 stop db-backup-cron

# Restart cron job backup
pm2 restart db-backup-cron
```

### Modificare Schedule Cron
Modifica `ecosystem.config.js`:

```javascript
{
  name: 'db-backup-cron',
  cron_restart: '0 2 * * *', // Formato cron standard
  // Minuto Ora GiornoMese Mese GiornoSettimana
}
```

**Esempi:**
- `0 2 * * *` - Ogni giorno alle 2:00
- `0 */6 * * *` - Ogni 6 ore
- `0 3 * * 0` - Ogni domenica alle 3:00
- `30 1 1 * *` - Primo giorno del mese alle 1:30

## Struttura File

```
employee-app/
├── scripts/
│   ├── backup-db.sh          # Script backup principale
│   ├── restore-db.sh         # Script restore con safety checks
│   └── cleanup-backups.sh    # Script retention policy
├── backups/
│   └── database/
│       ├── backup_20241112_020000.sql.gz
│       ├── backup_20241111_020000.sql.gz
│       └── ...
└── logs/
    ├── backup-out.log        # Log output backup cron
    ├── backup-error.log      # Log errori backup cron
    ├── cleanup-out.log       # Log output cleanup cron
    └── cleanup-error.log     # Log errori cleanup cron
```

## Requisiti di Sistema

### Pacchetti PostgreSQL Client
Gli script richiedono i tool client PostgreSQL:

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# Fedora/RHEL
sudo dnf install postgresql

# macOS
brew install postgresql
```

**Tool utilizzati:**
- `pg_dump` - per creare backup
- `psql` - per ripristinare e query
- `dropdb`, `createdb` - per restore completo

### Variabili d'Ambiente
Il file `.env` deve contenere:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

Gli script parsano automaticamente `DATABASE_URL` per estrarre:
- User
- Password
- Host
- Port
- Database name

## Best Practices

### 1. Test del Backup
Dopo aver configurato i backup, testa il processo completo:

```bash
# 1. Crea un backup
npm run backup:db

# 2. Verifica che il file esista
ls -lh backups/database/

# 3. (SOLO IN AMBIENTE DI TEST) Prova il restore
npm run restore:db backup_XXXXXXXX_XXXXXX.sql.gz
```

### 2. Monitoraggio
Controlla regolarmente i log dei cron job:

```bash
# Verifica ultimo backup
tail -50 logs/backup-out.log

# Controlla errori
tail -50 logs/backup-error.log

# Stato PM2 dei cron
pm2 list | grep cron
```

### 3. Spazio Disco
Monitora lo spazio disco della directory backup:

```bash
# Dimensione totale backup
du -sh backups/database/

# Lista backup con dimensioni
ls -lh backups/database/ | tail -20
```

### 4. Offsite Backup
**IMPORTANTE:** I backup locali proteggono solo da errori logici (cancellazioni accidentali, corruption).

Per disaster recovery completo, implementa backup offsite:

#### Opzione A: rsync su server remoto
```bash
# Aggiungi a cron o PM2
rsync -avz backups/database/ user@remote-server:/backups/employee-app/
```

#### Opzione B: S3/Cloud Storage
```bash
# Usando AWS CLI
aws s3 sync backups/database/ s3://my-bucket/employee-app-backups/
```

#### Opzione C: Backup service PostgreSQL
Molti provider cloud (AWS RDS, DigitalOcean, Supabase) offrono backup automatici integrati.

### 5. Retention Policy Consigliata

| Ambiente | Retention | Min Backups | Frequenza |
|----------|-----------|-------------|-----------|
| Sviluppo | 7 giorni | 3 backup | Giornaliera |
| Staging | 14 giorni | 7 backup | Giornaliera |
| Produzione | 30+ giorni | 14 backup | Giornaliera + oraria* |

\* Per produzione, considera backup orari durante le ore lavorative.

### 6. Sicurezza Backup

I file di backup contengono dati sensibili:

```bash
# Imposta permessi restrittivi
chmod 700 backups/
chmod 600 backups/database/*

# Solo owner può leggere/scrivere
ls -la backups/
```

### 7. Test Restore Periodico
Esegui test di restore regolari (mensili) per verificare:
- Integrità dei backup
- Tempo di ripristino
- Procedure documentate
- Familiarità del team

## Troubleshooting

### Errore: "DATABASE_URL not found"
Verifica che `.env` sia presente e contenga `DATABASE_URL`:
```bash
cat .env | grep DATABASE_URL
```

### Errore: "pg_dump: command not found"
Installa PostgreSQL client tools (vedi sezione Requisiti).

### Errore: "Permission denied"
Rendi eseguibili gli script:
```bash
chmod +x scripts/*.sh
```

### Backup troppo grandi
1. Verifica dimensione database: `du -sh backups/`
2. Considera backup incrementali o differenziali
3. Ottimizza cleanup: riduci retention days

### Cron job PM2 non parte
```bash
# Verifica configurazione PM2
pm2 show db-backup-cron

# Controlla errori startup
pm2 logs db-backup-cron --err --lines 50

# Restart manuale
pm2 restart db-backup-cron
```

### Restore fallisce con errori di permessi
Verifica che l'utente del database abbia privilegi:
```sql
-- Connetti come superuser
GRANT ALL PRIVILEGES ON DATABASE your_db TO your_user;
```

## Recovery Scenarios

### Scenario 1: Cancellazione accidentale dati
```bash
# 1. Identifica ultimo backup buono
ls -lt backups/database/ | head -10

# 2. Restore
npm run restore:db backup_XXXXXXXX_XXXXXX.sql.gz

# 3. Verifica dati
npm run prisma:studio
```

### Scenario 2: Corruption database
```bash
# 1. Stop applicazione
npm run pm2:stop

# 2. Backup stato corrente (anche se corrupted)
npm run backup:db

# 3. Restore da backup precedente
npm run restore:db backup_XXXXXXXX_XXXXXX.sql.gz

# 4. Restart applicazione
npm run pm2:restart
```

### Scenario 3: Migration fallita
```bash
# 1. Restore pre-migration
npm run restore:db backup_prima_migration.sql.gz

# 2. Fix migration
# (edita file migration in prisma/migrations/)

# 3. Riprova migration
npm run prisma:deploy
```

## Note Finali

- **Non committare mai backup in Git** (già in `.gitignore`)
- **Testa sempre i backup prima di affidarti ad essi**
- **Documenta modifiche alla strategia di backup**
- **Monitora lo spazio disco regolarmente**
- **Considera backup offsite per produzione**
