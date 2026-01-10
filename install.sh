#!/bin/bash

# --- CONFIGURATION ---
UUID="logtime@papilaz"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"

# Couleurs pour le style
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Installation de 42 Dashboard Ultimate...${NC}"

# 1. Créer le dossier de destination
if [ ! -d "$EXT_DIR" ]; then
    mkdir -p "$EXT_DIR"
    echo -e "📁 Dossier créé : $EXT_DIR"
else
    echo -e "♻️  Nettoyage de l'ancienne version..."
    rm -rf "$EXT_DIR"/*
fi

# 2. Copier les fichiers
# On copie tout sauf le script d'install et le readme
cp -r * "$EXT_DIR" 2>/dev/null
# On retire les fichiers inutiles du dossier cible s'ils ont été copiés
rm "$EXT_DIR/install.sh" 2>/dev/null
rm "$EXT_DIR/README.md" 2>/dev/null

echo -e "jq  Fichiers copiés."

# 3. Compiler le schéma GSettings (Vital pour les paramètres)
echo -e "xg  Compilation des schémas..."
glib-compile-schemas "$EXT_DIR"

# 4. Activer l'extension
echo -e "ww  Activation de l'extension..."
gnome-extensions enable "$UUID"

echo -e "\n${GREEN}✅ INSTALLATION TERMINÉE !${NC}"
echo -e "-----------------------------------------------------"
echo -e "⚠️  IMPORTANT : Si c'est la première installation ou si"
echo -e "    l'affichage bug, redémarre GNOME Shell :"
echo -e "    1. Appuie sur ${CYAN}Alt + F2${NC}"
echo -e "    2. Tape ${CYAN}r${NC}"
echo -e "    3. Appuie sur ${CYAN}Entrée${NC}"
echo -e "-----------------------------------------------------"