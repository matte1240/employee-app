#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}" )" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

CONFIG_FILE=".env"
BACKUP_SUFFIX="$(date +%Y%m%d_%H%M%S)"

# Associative array to hold key/value pairs
declare -A VALUES

log() {
  printf "\n👉 %s\n" "$1"
}

error() {
  printf "\n❌ %s\n" "$1" >&2
  exit 1
}

ensure_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    error "Comando richiesto non trovato: $1"
  fi
}

ensure_dependencies() {
  ensure_cmd docker
  if ! docker compose version >/dev/null 2>&1; then
    error "Docker Compose v2 è richiesto (usa 'docker compose')."
  fi
}

trim_quotes() {
  local value="$1"
  value="${value#\"}"
  value="${value%\"}"
  echo "$value"
}

load_existing_values() {
  if [[ -f "$CONFIG_FILE" ]]; then
    while IFS='=' read -r raw_key raw_value; do
      [[ -z "$raw_key" || "$raw_key" =~ ^# ]] && continue
      local key="$(echo "$raw_key" | tr -d ' ')"
      local value="$(trim_quotes "${raw_value:-}")"
      VALUES[$key]="$value"
    done < "$CONFIG_FILE"
  fi
}

default_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 32 | tr -d '\n'
  else
    head -c 48 /dev/urandom | base64 | tr -d '\n' | cut -c1-48
  fi
}

prompt_var() {
  local key="$1"
  local label="$2"
  local fallback="$3"
  local secret_mode="${4:-false}"

  local current="${VALUES[$key]:-}"
  if [[ -z "$current" ]]; then
    if [[ "$fallback" == "__AUTO_SECRET__" ]]; then
      current="$(default_secret)"
    else
      current="$fallback"
    fi
  fi

  local display="$current"
  if [[ "$secret_mode" == "true" && -n "$display" ]]; then
    display="********"
  fi

  local prompt="$label"
  if [[ -n "$display" ]]; then
    prompt+=" [$display]"
  fi
  prompt+=" : "

  local input
  if [[ "$secret_mode" == "true" ]]; then
    read -r -s -p "$prompt" input
    echo
  else
    read -r -p "$prompt" input
  fi

  if [[ -z "$input" ]]; then
    input="$current"
  fi

  VALUES[$key]="$input"
}

write_env_file() {
  if [[ -f "$CONFIG_FILE" ]]; then
    cp "$CONFIG_FILE" "${CONFIG_FILE}.${BACKUP_SUFFIX}.bak"
    log "Backup creato: ${CONFIG_FILE}.${BACKUP_SUFFIX}.bak"
  fi

  {
    printf 'POSTGRES_USER="%s"\n' "${VALUES[POSTGRES_USER]}"
    printf 'POSTGRES_PASSWORD="%s"\n' "${VALUES[POSTGRES_PASSWORD]}"
    printf 'POSTGRES_DB="%s"\n' "${VALUES[POSTGRES_DB]}"
    printf 'DB_PORT="%s"\n' "${VALUES[DB_PORT]}"
    printf 'APP_PORT="%s"\n' "${VALUES[APP_PORT]}"
    printf 'APP_URL="%s"\n' "${VALUES[APP_URL]}"
    printf 'NEXTAUTH_URL="%s"\n' "${VALUES[NEXTAUTH_URL]}"
    printf 'NEXTAUTH_SECRET="%s"\n' "${VALUES[NEXTAUTH_SECRET]}"
    printf 'EMAIL_HOST="%s"\n' "${VALUES[EMAIL_HOST]}"
    printf 'EMAIL_USER="%s"\n' "${VALUES[EMAIL_USER]}"
    printf 'EMAIL_PASSWORD="%s"\n' "${VALUES[EMAIL_PASSWORD]}"
    printf 'EMAIL_FROM_NAME="%s"\n' "${VALUES[EMAIL_FROM_NAME]}"
  } > "$CONFIG_FILE"

  log "File $CONFIG_FILE aggiornato."
}

ensure_project_dirs() {
  mkdir -p backups/database logs
  chmod 770 backups/database logs >/dev/null 2>&1 || true
}

run_deploy() {
  log "Avvio deploy Docker..."
  docker compose up -d --build
}

validate_required_values() {
  local missing=()
  local required_keys=(POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB APP_URL NEXTAUTH_URL NEXTAUTH_SECRET)
  for key in "${required_keys[@]}"; do
    if [[ -z "${VALUES[$key]:-}" ]]; then
      missing+=("$key")
    fi
  done

  if (( ${#missing[@]} > 0 )); then
    error "Le seguenti variabili non possono essere vuote: ${missing[*]}"
  fi
}

print_summary() {
  local app_url="${VALUES[APP_URL]:-http://localhost:3001}"
  local setup_url="${app_url%/}/setup"
  cat <<EOF
\n✅ Deploy completato
   - App URL: $app_url
   - NextAuth URL: ${VALUES[NEXTAUTH_URL]:-http://localhost:3001}
   - Porta DB esposta sull'host: ${VALUES[DB_PORT]:-5433}
\nSe questo era il primo avvio, apri $setup_url per creare l'utente amministratore iniziale.
EOF
}

main() {
  log "Controllo dipendenze..."
  ensure_dependencies

  log "Carico eventuali variabili esistenti..."
  load_existing_values

  log "Configuriamo l'ambiente (.env). Lascia vuoto per mantenere il valore corrente."

  prompt_var "POSTGRES_USER" "Database user" "app"
  prompt_var "POSTGRES_PASSWORD" "Database password" "SecureDockerPassword123" true
  prompt_var "POSTGRES_DB" "Database name" "employee_tracker"
  prompt_var "DB_PORT" "Porta esposta del DB" "5433"
  prompt_var "APP_PORT" "Porta esposta dell'app" "3001"
  prompt_var "APP_URL" "URL pubblico dell'app" "http://localhost:3001"
  prompt_var "NEXTAUTH_URL" "NextAuth URL" "${VALUES[APP_URL]:-http://localhost:3001}"
  prompt_var "NEXTAUTH_SECRET" "NextAuth secret" "__AUTO_SECRET__" true
  prompt_var "EMAIL_HOST" "SMTP host" "smtp.gmail.com"
  prompt_var "EMAIL_USER" "SMTP user" ""
  prompt_var "EMAIL_PASSWORD" "SMTP password" "" true
  prompt_var "EMAIL_FROM_NAME" "Nome mittente email" "Time Tracker"

    validate_required_values
  write_env_file
  ensure_project_dirs
  run_deploy
  print_summary
}

main "$@"
