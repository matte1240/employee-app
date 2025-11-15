#!/bin/bash

##############################################################################
# Employee App - Server Setup Script
# 
# Questo script configura automaticamente un server (staging o production)
# con Docker, Docker Compose, e l'applicazione Employee App.
#
# Usage:
#   ./scripts/setup-server.sh staging
#   ./scripts/setup-server.sh production
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment parameter
ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
  echo -e "${RED}❌ Errore: Specifica l'ambiente (staging o production)${NC}"
  echo "Usage: $0 [staging|production]"
  exit 1
fi

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
  echo -e "${RED}❌ Errore: Ambiente deve essere 'staging' o 'production'${NC}"
  exit 1
fi

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Employee App - Setup Server ${ENVIRONMENT^^}${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
  echo -e "${RED}❌ Non eseguire questo script come root!${NC}"
  echo "Usa un utente normale con sudo access."
  exit 1
fi

# Function to print step
print_step() {
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}▶ $1${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to check command success
check_success() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ $1${NC}"
  else
    echo -e "${RED}❌ $1 FAILED${NC}"
    exit 1
  fi
}

# 1. Update system
print_step "1. Aggiornamento sistema"
sudo apt update
sudo apt upgrade -y
check_success "Sistema aggiornato"

# 2. Install Docker
print_step "2. Installazione Docker"
if command -v docker &> /dev/null; then
  echo -e "${YELLOW}⚠️  Docker già installato: $(docker --version)${NC}"
else
  echo "Downloading Docker installation script..."
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sudo sh /tmp/get-docker.sh
  rm /tmp/get-docker.sh
  check_success "Docker installato"
  
  # Add user to docker group
  sudo usermod -aG docker $USER
  echo -e "${YELLOW}⚠️  IMPORTANTE: Devi fare logout/login per applicare docker group!${NC}"
fi

# 3. Install Docker Compose
print_step "3. Installazione Docker Compose"
sudo apt install -y docker-compose-plugin
check_success "Docker Compose installato"

# Verify installations
echo ""
echo "Docker version:"
docker --version
echo "Docker Compose version:"
docker compose version

# 4. Install additional tools
print_step "4. Installazione strumenti aggiuntivi"
sudo apt install -y git curl wget vim ufw
check_success "Strumenti installati"

# 5. Configure firewall
print_step "5. Configurazione firewall"
echo "Configuring UFW..."
sudo ufw --force enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

if [ "$ENVIRONMENT" = "staging" ]; then
  sudo ufw allow 3001/tcp  # Staging app port
else
  sudo ufw allow 3000/tcp  # Production app port
fi

sudo ufw status
check_success "Firewall configurato"

# 6. Create application directory
print_step "6. Creazione directory applicazione"
APP_DIR="/opt/employee-app"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR
check_success "Directory creata: $APP_DIR"

# 7. Clone repository
print_step "7. Clone repository"
cd $APP_DIR
if [ -d ".git" ]; then
  echo -e "${YELLOW}⚠️  Repository già clonato, pulling latest changes...${NC}"
  git fetch origin
  git checkout $ENVIRONMENT
  git pull origin $ENVIRONMENT
else
  echo "Cloning repository..."
  git clone https://github.com/matte1240/employee-app.git .
  git checkout $ENVIRONMENT
fi
check_success "Repository clonato/aggiornato"

# 8. Create backups directory
mkdir -p backups/database
check_success "Directory backups creata"

# 9. Generate .env.docker template
print_step "8. Generazione file .env.docker"

# Generate random passwords
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

cat > $APP_DIR/.env.docker << EOF
# Database Configuration
DB_PASSWORD=$DB_PASSWORD

# NextAuth Configuration
NEXTAUTH_URL=https://${ENVIRONMENT}.example.com
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Email Configuration (optional for staging, required for production)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@${ENVIRONMENT}.example.com
EOF

chmod 600 $APP_DIR/.env.docker
check_success ".env.docker creato"

echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Modifica il file .env.docker con le tue credenziali!${NC}"
echo -e "${YELLOW}   Posizione: $APP_DIR/.env.docker${NC}"
echo ""
echo "   Devi configurare:"
echo "   - NEXTAUTH_URL (il dominio del tuo server)"
echo "   - EMAIL_SERVER_USER (se usi email)"
echo "   - EMAIL_SERVER_PASSWORD (se usi email)"
echo ""
echo "   Le password DB e NEXTAUTH_SECRET sono già generate casualmente."
echo ""

# 10. Setup Docker Compose file
print_step "9. Configurazione Docker Compose"
if [ "$ENVIRONMENT" = "staging" ]; then
  COMPOSE_FILE="docker-compose.staging.yml"
else
  COMPOSE_FILE="docker-compose.yml"
fi

if [ -f "$APP_DIR/$COMPOSE_FILE" ]; then
  echo -e "${GREEN}✅ File $COMPOSE_FILE già presente${NC}"
else
  echo -e "${RED}❌ File $COMPOSE_FILE non trovato!${NC}"
  exit 1
fi

# 11. Setup systemd service (optional)
print_step "10. Setup systemd service (opzionale)"
read -p "Vuoi creare un systemd service per avvio automatico? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  SERVICE_FILE="/etc/systemd/system/employee-app-${ENVIRONMENT}.service"
  
  sudo tee $SERVICE_FILE > /dev/null << EOF
[Unit]
Description=Employee App ${ENVIRONMENT^^}
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/docker compose -f $COMPOSE_FILE up -d
ExecStop=/usr/bin/docker compose -f $COMPOSE_FILE down
User=$USER
Group=$USER

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable employee-app-${ENVIRONMENT}.service
  check_success "Systemd service creato e abilitato"
fi

# Summary
print_step "✅ Setup completato!"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Setup Completato con Successo!              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Riepilogo:${NC}"
echo ""
echo "  Directory app:     $APP_DIR"
echo "  Environment:       $ENVIRONMENT"
echo "  Compose file:      $COMPOSE_FILE"
echo "  Config file:       $APP_DIR/.env.docker"
echo ""
echo -e "${YELLOW}⚠️  PROSSIMI PASSI OBBLIGATORI:${NC}"
echo ""
echo "1️⃣  Modifica il file .env.docker:"
echo "   vim $APP_DIR/.env.docker"
echo ""
echo "2️⃣  IMPORTANTE: Fai logout e login per applicare il gruppo docker:"
echo "   exit"
echo "   ssh user@server  # riconnetti"
echo ""
echo "3️⃣  Dopo il login, testa Docker:"
echo "   docker ps"
echo ""
echo "4️⃣  Avvia l'applicazione:"
echo "   cd $APP_DIR"
if [ "$ENVIRONMENT" = "staging" ]; then
  echo "   docker compose -f docker-compose.staging.yml up -d"
else
  echo "   docker compose up -d"
fi
echo ""
echo "5️⃣  Controlla i logs:"
if [ "$ENVIRONMENT" = "staging" ]; then
  echo "   docker compose -f docker-compose.staging.yml logs -f"
else
  echo "   docker compose logs -f"
fi
echo ""
echo "6️⃣  Configura i GitHub Secrets (vedi docs/DEPLOYMENT_GUIDE.md)"
echo ""
echo -e "${GREEN}🎉 Il server è pronto per il deployment!${NC}"
echo ""
