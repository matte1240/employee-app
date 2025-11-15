# 📦 Release Guide

Guida completa per creare release del progetto Employee Work Hours Tracker.

---

## 🎯 Overview

Il progetto usa **GitHub Actions** per automatizzare:
- Build delle immagini Docker
- Push su GitHub Container Registry (ghcr.io)
- Creazione di release GitHub con changelog
- Tagging semantico delle versioni

---

## 🚀 Come Creare una Release

### Metodo 1: Release Automatica con Tag (Consigliato)

```bash
# 1. Assicurati di essere sul branch main/master
git checkout main
git pull origin main

# 2. Crea un tag con semantic versioning
git tag -a v1.0.0 -m "Release v1.0.0: Initial production release"

# 3. Pusha il tag su GitHub
git push origin v1.0.0

# 4. GitHub Actions si attiva automaticamente e:
#    - Buildi l'immagine Docker
#    - Pusha su ghcr.io/matte1240/employee-app:1.0.0
#    - Crea la release GitHub con changelog
```

### Metodo 2: Release Manuale da GitHub UI

1. Vai su **GitHub.com** → tuo repository
2. Click su **Releases** (nella sidebar destra)
3. Click su **Draft a new release**
4. Compila:
   - **Tag**: `v1.0.0` (crea nuovo tag)
   - **Title**: `Release v1.0.0`
   - **Description**: Descrivi le modifiche
5. Click su **Publish release**

---

## 📋 Semantic Versioning

Usa il formato **vMAJOR.MINOR.PATCH**:

```
v1.0.0  → Prima versione stabile
v1.1.0  → Nuove funzionalità (backward-compatible)
v1.1.1  → Bug fix
v2.0.0  → Breaking changes
```

### Esempi Pratici

| Tipo di Modifica | Esempio Tag | Quando Usarlo |
|------------------|-------------|---------------|
| **Bug fix** | `v1.0.1` | Corretto un bug senza nuove feature |
| **Nuova feature** | `v1.1.0` | Aggiunta gestione permessi |
| **Breaking change** | `v2.0.0` | Cambio API incompatibile |
| **Pre-release** | `v1.0.0-beta.1` | Testing prima del rilascio |
| **Release candidate** | `v1.0.0-rc.1` | Candidato per produzione |

---

## 🐳 Immagini Docker Generate

Quando crei un tag `v1.2.3`, vengono generate queste immagini:

```
ghcr.io/matte1240/employee-app:1.2.3      # Versione specifica
ghcr.io/matte1240/employee-app:1.2        # Minor version
ghcr.io/matte1240/employee-app:1          # Major version
ghcr.io/matte1240/employee-app:latest     # Latest stable
```

### Usare le Immagini nel docker-compose.yml

```yaml
services:
  app:
    # Opzione 1: Versione specifica (consigliato per produzione)
    image: ghcr.io/matte1240/employee-app:1.2.3
    
    # Opzione 2: Latest minor version
    image: ghcr.io/matte1240/employee-app:1.2
    
    # Opzione 3: Latest stable (aggiornamenti automatici)
    image: ghcr.io/matte1240/employee-app:latest
```

---

## 📝 Conventional Commits (Opzionale ma Consigliato)

Per generare changelog automatici più leggibili, usa questi prefissi nei commit:

```bash
# Nuove funzionalità
git commit -m "feat: aggiungi esportazione PDF report"

# Bug fix
git commit -m "fix: correggi calcolo ore straordinario"

# Documentazione
git commit -m "docs: aggiorna README con istruzioni Docker"

# Refactoring
git commit -m "refactor: ristruttura componente calendario"

# Performance
git commit -m "perf: ottimizza query database per dashboard"

# Test
git commit -m "test: aggiungi test unitari per API hours"

# Chore (maintenance)
git commit -m "chore: aggiorna dipendenze npm"
```

### Formato Completo

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Esempio:**
```bash
git commit -m "feat(dashboard): aggiungi filtro per mese corrente

- Implementato dropdown per selezione mese
- Aggiunto state management con useState
- Ottimizzate query API con date range

Closes #42"
```

---

## 🔄 Workflow Completo di Release

### 1. Preparazione

```bash
# Assicurati che tutto sia committato
git status

# Aggiorna il branch principale
git checkout main
git pull origin main

# (Opzionale) Aggiorna CHANGELOG.md manualmente
nano docs/CHANGELOG.md
git add docs/CHANGELOG.md
git commit -m "docs: aggiorna CHANGELOG per v1.0.0"
git push origin main
```

### 2. Creazione Tag

```bash
# Crea tag annotato (include messaggio)
git tag -a v1.0.0 -m "Release v1.0.0

Modifiche principali:
- Implementato sistema di tracking ore con calendario
- Aggiunto dashboard admin con overview team
- Supporto Docker Compose per deployment
- Autenticazione NextAuth con sessioni JWT"

# Verifica il tag
git tag -l
git show v1.0.0

# Pusha il tag
git push origin v1.0.0
```

### 3. Monitorare la Build

```bash
# Vai su GitHub Actions
# https://github.com/matte1240/employee-app/actions

# Osserva il workflow "Release & Docker Build"
# Durata: ~5-10 minuti
```

### 4. Verifica Release

```bash
# Vai su GitHub Releases
# https://github.com/matte1240/employee-app/releases

# Controlla:
# ✓ Release pubblicata con changelog
# ✓ Immagini Docker linkate
# ✓ Tag corretto
```

### 5. Testa l'Immagine Docker

```bash
# Pull dell'immagine rilasciata
docker pull ghcr.io/matte1240/employee-app:1.0.0

# Testa con docker-compose
docker compose down
# Modifica docker-compose.yml con la nuova versione
docker compose up -d
docker compose logs -f app
```

---

## 🛠️ Comandi Utili

### Gestione Tag

```bash
# Lista tutti i tag
git tag -l

# Cerca tag specifici
git tag -l "v1.*"

# Mostra dettagli tag
git show v1.0.0

# Elimina tag locale
git tag -d v1.0.0

# Elimina tag remoto
git push origin --delete v1.0.0

# Pusha tutti i tag
git push origin --tags
```

### Rollback Release

```bash
# Se hai pushato un tag errato
git tag -d v1.0.0                    # Elimina locale
git push origin --delete v1.0.0     # Elimina remoto

# Ricrea il tag corretto
git tag -a v1.0.0 -m "Messaggio corretto"
git push origin v1.0.0

# NOTA: La release GitHub va eliminata manualmente dalla UI
```

### Testare Docker Image Localmente

```bash
# Build locale con stesso Dockerfile
docker build -t employee-app:test .

# Testa il container
docker run -d \
  -p 3001:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="test" \
  -e NEXTAUTH_URL="http://localhost:3001" \
  employee-app:test

# Verifica logs
docker logs -f <container_id>
```

---

## 📊 Strategia di Release Consigliata

### Ambiente di Sviluppo (dev branch)
```bash
# Push su dev triggera build automatica
git push origin dev

# Immagine: ghcr.io/matte1240/employee-app:dev
```

### Pre-release (beta/rc)
```bash
# Tag con suffisso
git tag -a v1.0.0-beta.1 -m "Beta 1 per testing"
git push origin v1.0.0-beta.1

# Immagine: ghcr.io/matte1240/employee-app:1.0.0-beta.1
```

### Release Stabile (produzione)
```bash
# Tag senza suffisso
git tag -a v1.0.0 -m "Release stabile"
git push origin v1.0.0

# Immagini:
# - ghcr.io/matte1240/employee-app:1.0.0
# - ghcr.io/matte1240/employee-app:latest
```

---

## 🔐 Setup GitHub Container Registry

### 1. Abilita GitHub Packages

Il repository è già configurato. GitHub Actions usa `GITHUB_TOKEN` automaticamente.

### 2. Pull Immagini Pubbliche (no auth)

```bash
# Se il repository è pubblico
docker pull ghcr.io/matte1240/employee-app:latest
```

### 3. Pull Immagini Private (con auth)

```bash
# Crea Personal Access Token su GitHub
# Settings → Developer settings → Personal access tokens → Tokens (classic)
# Scope: read:packages

# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull
docker pull ghcr.io/matte1240/employee-app:latest
```

---

## 🚨 Troubleshooting

### Workflow Non Parte

**Problema:** Pusho il tag ma GitHub Actions non si attiva

**Soluzione:**
```bash
# Verifica che il workflow file esista
ls -la .github/workflows/release.yml

# Verifica che il tag abbia formato corretto
git tag -l
# Deve essere: v1.0.0, v1.2.3, ecc.

# Controlla i logs di GitHub Actions
# https://github.com/matte1240/employee-app/actions
```

### Build Fallisce

**Problema:** Docker build fallisce con errore

**Soluzione:**
```bash
# Testa build locale
docker build -t test-build .

# Controlla i logs su GitHub Actions
# Verifica Dockerfile syntax
# Verifica che tutte le dipendenze siano in package.json
```

### Immagine Non Pushata

**Problema:** Build completa ma immagine non appare su ghcr.io

**Soluzione:**
- Verifica permessi su GitHub Actions: `Settings → Actions → General → Workflow permissions → Read and write`
- Controlla logs del job `build-and-release`
- Assicurati che `GITHUB_TOKEN` abbia permesso `packages: write`

---

## 📚 Risorse

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Multi-platform Builds](https://docs.docker.com/build/building/multi-platform/)

---

## ✅ Checklist Pre-Release

Prima di creare una release:

- [ ] Tutti i test passano
- [ ] Build locale funziona: `npm run build`
- [ ] Docker build locale funziona: `docker build -t test .`
- [ ] Documentazione aggiornata
- [ ] CHANGELOG.md aggiornato (opzionale, si auto-genera)
- [ ] Nessun bug critico aperto
- [ ] Testato in ambiente staging/dev
- [ ] Branch main/master aggiornato
- [ ] Tag con formato corretto: `v1.2.3`

---

**Last Updated**: November 2025
