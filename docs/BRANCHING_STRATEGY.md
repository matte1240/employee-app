# 🌿 Git Branching Strategy

Strategia di branching e deployment per Employee Work Hours Tracker.

---

## 🎯 Struttura Branch

```
dev (development)
  ↓ merge quando pronto per test
staging (pre-production)
  ↓ merge quando testato e approvato
main (production)
  ↓ tag per release
v1.0.0, v1.1.0, v2.0.0...
```

---

## 📋 Descrizione Branch

### 🔧 `dev` - Development
- **Scopo**: Sviluppo attivo quotidiano
- **Stabilità**: Instabile, può contenere codice in progress
- **Deploy**: Nessun deploy automatico (solo build Docker)
- **Protezione**: Nessuna

**Uso:**
```bash
git checkout dev
# sviluppo quotidiano
git add .
git commit -m "feat: nuova feature"
git push origin dev
```

**Trigger:**
- ✅ Build Docker → `ghcr.io/matte1240/employee-app:dev`
- ✅ Test automatici (se configurati)

---

### 🧪 `staging` - Staging/Pre-Production
- **Scopo**: Testing in ambiente simile a produzione
- **Stabilità**: Stabile, pronto per test
- **Deploy**: Deploy automatico su server staging
- **Protezione**: Richiede PR da `dev`

**Uso:**
```bash
# Merge dev → staging quando pronto per test
git checkout staging
git pull origin staging
git merge dev
git push origin staging
```

**Trigger:**
- ✅ Build Docker → `ghcr.io/matte1240/employee-app:staging`
- ✅ Deploy automatico su server staging
- ✅ Test di integrazione

**Server Staging:**
- URL: `https://staging.yourdomain.com`
- Database: Copia dei dati di produzione (anonimizzati)
- Scopo: Test finali, demo stakeholder, QA

---

### 🚀 `main` - Production
- **Scopo**: Codice in produzione
- **Stabilità**: Solo codice testato e approvato
- **Deploy**: Richiede tag manuale per release
- **Protezione**: 
  - Richiede PR da `staging`
  - Richiede review obbligatoria
  - Status check devono passare

**Uso:**
```bash
# Merge staging → main dopo test ok
git checkout main
git pull origin main
git merge staging
git push origin main
```

**Trigger:**
- ✅ Build Docker → `ghcr.io/matte1240/employee-app:main`
- ⚠️ Nessun deploy automatico (serve tag per release)

---

### 🏷️ Tag `v*.*.*` - Production Releases
- **Scopo**: Release versionate in produzione
- **Stabilità**: Massima, solo da `main`
- **Deploy**: Deploy automatico su produzione

**Uso:**
```bash
# Dalla main, crea release
git checkout main
./release.sh 1.0.0

# Oppure manualmente
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

**Trigger:**
- ✅ Build Docker multi-platform → `ghcr.io/matte1240/employee-app:1.0.0`
- ✅ Tag `latest` → `ghcr.io/matte1240/employee-app:latest`
- ✅ GitHub Release con changelog
- ✅ Deploy automatico su produzione (opzionale)

---

## 🔄 Workflow Completo

### 1️⃣ Sviluppo Feature

```bash
# Crea feature branch da dev (opzionale)
git checkout dev
git checkout -b feature/nome-feature

# Sviluppo
# ... modifiche ...

# Commit con conventional commits
git add .
git commit -m "feat(scope): descrizione feature"

# Push e crea PR verso dev
git push origin feature/nome-feature
# Crea PR su GitHub: feature/nome-feature → dev

# Dopo merge PR
git checkout dev
git pull origin dev
```

**Risultato:**
- Codice su `dev`
- Immagine Docker: `ghcr.io/matte1240/employee-app:dev`

---

### 2️⃣ Deploy Staging per Test

```bash
# Quando dev è stabile e pronto per test
git checkout staging
git pull origin staging
git merge dev

# Risolvi eventuali conflitti
# Verifica che tutto sia ok
git push origin staging
```

**Risultato:**
- Codice su `staging`
- Immagine Docker: `ghcr.io/matte1240/employee-app:staging`
- Deploy automatico su server staging
- Team può testare su https://staging.yourdomain.com

**Test da fare:**
- ✅ Funzionalità nuove
- ✅ Regressioni
- ✅ Performance
- ✅ Mobile responsive
- ✅ Browser compatibility
- ✅ User acceptance (stakeholder)

---

### 3️⃣ Deploy Production

```bash
# Dopo test ok su staging
git checkout main
git pull origin main
git merge staging
git push origin main

# Verifica build su main
# Controlla GitHub Actions
```

**Risultato:**
- Codice su `main`
- Immagine Docker: `ghcr.io/matte1240/employee-app:main`
- ⚠️ NON ancora in produzione (serve release)

---

### 4️⃣ Release Production

```bash
# Dalla main, crea tag release
git checkout main

# Opzione 1: Script automatico (consigliato)
./release.sh 1.0.0

# Opzione 2: Manuale
git tag -a v1.0.0 -m "Release v1.0.0

Modifiche principali:
- Feature 1
- Feature 2
- Bug fix 3"

git push origin v1.0.0
```

**Risultato:**
- GitHub Release creata
- Immagine Docker: 
  - `ghcr.io/matte1240/employee-app:1.0.0`
  - `ghcr.io/matte1240/employee-app:latest`
- Deploy su produzione (manuale o automatico)

---

## 🐳 Immagini Docker per Ambiente

### Development
```bash
# Build automatico su push a dev
docker pull ghcr.io/matte1240/employee-app:dev

# Uso locale
docker-compose.yml:
  image: ghcr.io/matte1240/employee-app:dev
```

### Staging
```bash
# Build automatico su push a staging
docker pull ghcr.io/matte1240/employee-app:staging

# Server staging
docker-compose.staging.yml:
  image: ghcr.io/matte1240/employee-app:staging
```

### Production (Main)
```bash
# Build automatico su push a main
docker pull ghcr.io/matte1240/employee-app:main

# Per test pre-release
docker-compose.yml:
  image: ghcr.io/matte1240/employee-app:main
```

### Production (Release)
```bash
# Build su tag v*.*.*
docker pull ghcr.io/matte1240/employee-app:1.0.0
docker pull ghcr.io/matte1240/employee-app:latest

# Server produzione
docker-compose.production.yml:
  image: ghcr.io/matte1240/employee-app:1.0.0  # Versione fissa
  # oppure
  image: ghcr.io/matte1240/employee-app:latest  # Sempre ultima
```

---

## 🔐 Branch Protection Rules

### Configurazione su GitHub

#### `main` Branch
- ✅ Require pull request before merging
- ✅ Require approvals: 1
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Include administrators
- ✅ Do not allow bypassing

#### `staging` Branch
- ✅ Require pull request before merging
- ✅ Require status checks to pass
- ⚠️ Require approvals: 0 (opzionale)

#### `dev` Branch
- ⚠️ No protection (libertà di sviluppo)

---

## 📅 Cadenza Consigliata

### Frequenza Merge

- **dev → staging**: Ogni fine settimana o quando feature complete
- **staging → main**: Ogni 2-4 settimane o quando sprint completato
- **main → v*.*.* release**: Ogni milestone importante o bug fix critici

### Esempio Timeline

```
Settimana 1-2:
├── dev: sviluppo features 1, 2, 3
└── staging: test vecchia versione

Settimana 3 (venerdì):
├── dev → staging (merge)
└── staging: test nuove features

Settimana 4:
├── staging: fix bug trovati in test
└── staging → main (merge)
└── main: tag v1.1.0

Settimana 4 (rilascio):
└── v1.1.0 → produzione
```

---

## 🚨 Hotfix Critici

Per bug critici in produzione:

```bash
# 1. Crea hotfix branch da main
git checkout main
git checkout -b hotfix/critical-bug-fix

# 2. Fix il bug
git add .
git commit -m "fix: critical security issue"

# 3. Merge direttamente a main
git checkout main
git merge hotfix/critical-bug-fix
git push origin main

# 4. Tag immediato
git tag -a v1.0.1 -m "Hotfix: critical bug"
git push origin v1.0.1

# 5. Backport a staging e dev
git checkout staging
git merge main
git push origin staging

git checkout dev
git merge staging
git push origin dev
```

---

## 📊 Riepilogo Trigger GitHub Actions

| Branch/Tag | Workflow | Docker Image | Deploy |
|------------|----------|--------------|--------|
| `dev` | docker-build.yml | `app:dev` | ❌ |
| `staging` | staging.yml | `app:staging` | ✅ Staging |
| `main` | docker-build.yml | `app:main` | ❌ |
| `v*.*.*` | release.yml | `app:1.0.0`, `app:latest` | ✅ Production |

---

## 🔗 Comandi Quick Reference

```bash
# Setup iniziale branches
git checkout -b staging
git push origin staging

git checkout -b main
git push origin main

# Workflow giornaliero
git checkout dev
git pull origin dev
# ... sviluppo ...
git push origin dev

# Deploy staging
git checkout staging
git merge dev
git push origin staging

# Deploy production
git checkout main
git merge staging
git push origin main

# Release
./release.sh 1.0.0
```

---

**Last Updated**: November 2025
