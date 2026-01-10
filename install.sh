#!/bin/bash

# --- CONFIGURATION ---
UUID="logtime@42"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"

# Couleurs
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}🚀 Installation de 42 Dashboard...${NC}"

# 1. Nettoyage et Copie
if [ ! -d "$EXT_DIR" ]; then mkdir -p "$EXT_DIR"; else rm -rf "$EXT_DIR"/*; fi
cp -r * "$EXT_DIR" 2>/dev/null
rm "$EXT_DIR/install.sh" "$EXT_DIR/README.md" 2>/dev/null

# 2. Compilation et Activation
glib-compile-schemas "$EXT_DIR"
gnome-extensions enable "$UUID"

echo -e "${GREEN}✅ Fichiers installés.${NC}"

# 3. RAPPEL IMPORTANT (API KEY)
echo -e "\n${YELLOW}⚠️  ACTION REQUISE : CONFIGURATION API${NC}"
echo -e "   Pour que tes heures s'affichent, tu dois configurer ta clé API."
echo -e "   👉 ${CYAN}Lis le fichier README.md pour les instructions !${NC}"
echo -e "   (Sinon l'extension restera bloquée ou vide)"

# 4. PAUSE ET REDÉMARRAGE
echo -e "\n${RED}Appuie sur [ENTRÉE] pour redémarrer le Shell et finir...${NC}"
read

if [ "$XDG_SESSION_TYPE" == "x11" ]; then
    echo -e "🔄 Redémarrage..."
    killall -9 gnome-shell
else
    echo -e "⚠️  Tu n'es pas sous X11. Fais Alt+F2, r, Entrée."
fi