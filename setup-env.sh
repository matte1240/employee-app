#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Employee App Environment Setup ===${NC}"

# 1. Update and Install Basic Tools
echo -e "${GREEN}Step 1: Updating system and installing curl...${NC}"
sudo apt-get update
sudo apt-get install -y curl git build-essential

# 2. Install Node.js via NVM
echo -e "${GREEN}Step 2: Installing Node.js (via NVM)...${NC}"
if ! command -v node &> /dev/null; then
    # Install NVM
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    
    # Load NVM immediately
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Install Node LTS
    nvm install 22
    nvm use 22
    nvm alias default 22
    
    echo "Node.js $(node -v) installed."
else
    echo "Node.js is already installed: $(node -v)"
fi

# 3. Install Docker
echo -e "${GREEN}Step 3: Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    echo "Docker installed. NOTE: You will need to log out and log back in for Docker permissions to work."
else
    echo "Docker is already installed."
fi

# 4. Install Project Dependencies
echo -e "${GREEN}Step 4: Installing project dependencies...${NC}"
# Ensure we are using the just-installed node
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if [ -f "package.json" ]; then
    npm install
else
    echo "package.json not found, skipping npm install."
fi

# 5. Setup Environment Variables
echo -e "${GREEN}Step 5: Checking configuration...${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "Created .env from .env.example"
    fi
fi

echo -e "${BLUE}=== Setup Complete! ===${NC}"
echo "Please run the following command to apply Docker group changes (or log out and back in):"
echo "newgrp docker"
echo ""
echo "Then you can start the database with:"
echo "docker compose up -d postgres"
echo ""
echo "And start the app with:"
echo "npm run dev"
