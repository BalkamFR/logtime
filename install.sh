#!/bin/bash

# --- CONFIGURATION ---
UUID="logtime@42"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"

# Couleurs
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}🚀 Installation de 42 Dashboard Ultimate (Mode Cluster)...${NC}"

# 1. Nettoyage et Installation
if [ ! -d "$EXT_DIR" ]; then
    mkdir -p "$EXT_DIR"
else
    rm -rf "$EXT_DIR"/*
fi

cp -r * "$EXT_DIR" 2>/dev/null
rm "$EXT_DIR/install.sh" "$EXT_DIR/README.md" 2>/dev/null

# 2. Compilation et Activation
echo -e "⚙️  Configuration..."
glib-compile-schemas "$EXT_DIR"
gnome-extensions enable "$UUID"

echo -e "${GREEN}✅ Fichiers installés.${NC}"

# 3. LE REDÉMARRAGE (Méthode 42)
echo -e "${RED}🔄 RESET DU SHELL EN COURS...${NC}"
sleep 1



# On vérifie qu'on ne fait pas ça si par hasard tu es sur Wayland (ce qui te déconnecterait)
if [ "$XDG_SESSION_TYPE" == "x11" ]; then
    # killall -9 est brutal : il tue le processus immédiatement.
    # gnome-session va détecter la mort du shell et le respawn instantanément.
    killall -9 gnome-shell
else
    echo -e "⚠️  Tu n'es pas sous X11. Fais Alt+F2, r, Entrée."
fi

echo -e "\n${YELLOW}⚠️  ACTION REQUISE : CONFIGURATION API${NC}"
echo -e "   Pour que tes heures s'affichent, tu dois configurer ta clé API."
echo -e "   👉 ${CYAN}Lis le fichier README.md pour les instructions !${NC}"
echo -e "   (Sinon l'extension restera bloquée ou vide)"