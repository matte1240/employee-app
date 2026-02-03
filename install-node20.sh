#!/bin/bash
# Script per aggiornare Node.js a versione 20 LTS

echo "🔄 Aggiornando Node.js a versione 20 LTS..."

# Aggiungi la repository NodeSource per Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Installa Node.js 20
sudo apt-get install -y nodejs

# Verifica la versione installata
echo "✅ Node.js version:"
node --version
echo "✅ npm version:"
npm --version

echo "🎉 Aggiornamento completato!"
echo "Ora puoi eseguire:"
echo "  npm run build"
echo "  npm run dev"