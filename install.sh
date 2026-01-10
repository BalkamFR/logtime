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

echo -e "${CYAN}🚀 Installation de 42 Dashboard Ultimate...${NC}"

# ... (Le début du script reste identique : création dossier, copie, compile) ...
# Je remets le début pour être sûr que tu as le contexte, mais tu peux garder le tien
if [ ! -d "$EXT_DIR" ]; then mkdir -p "$EXT_DIR"; else rm -rf "$EXT_DIR"/*; fi
cp -r * "$EXT_DIR" 2>/dev/null
rm "$EXT_DIR/install.sh" "$EXT_DIR/README.md" 2>/dev/null
glib-compile-schemas "$EXT_DIR"
gnome-extensions disable "$UUID" 2>/dev/null
gnome-extensions enable "$UUID"

echo -e "${GREEN}✅ FICHIERS INSTALLÉS.${NC}"

# --- PARTIE MODIFIÉE : LE REDÉMARRAGE ---

# Vérification stricte : Est-ce qu'on est sur X11 ?
if [ "$XDG_SESSION_TYPE" == "x11" ]; then
    echo -e "${YELLOW}🔄 Redémarrage forcé de GNOME Shell...${NC}"
    sleep 1
    
    # Envoie le signal SIGQUIT (3) à gnome-shell.
    # Sur X11, le système va voir que le shell a "planté" et le relancer immédiatement.
    # Tes fenêtres ouvertes ne seront PAS fermées.
    killall -3 gnome-shell
    
else
    # Sécurité pour ne pas casser une session Wayland (si tu l'utilises chez toi)
    echo -e "${RED}⚠️  Attention : Tu n'es pas sous X11 ($XDG_SESSION_TYPE).${NC}"
    echo -e "   Je ne peux pas redémarrer le shell automatiquement sans te déconnecter."
    echo -e "   Fais la combinaison manuelle : Alt+F2, tape 'r', Entrée."
fi