#!/bin/bash

# --- CONFIGURATION ---
UUID="logtime@42"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"

# Couleurs pour le style
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Installation de 42 Dashboard Ultimate...${NC}"

# 1. Créer le dossier de destination
if [ ! -d "$EXT_DIR" ]; then
    mkdir -p "$EXT_DIR"
else
    echo -e "♻️  Nettoyage de l'ancienne version..."
    rm -rf "$EXT_DIR"/*
fi

# 2. Copier les fichiers
# On copie tout sauf le script d'install et le readme
cp -r * "$EXT_DIR" 2>/dev/null
# Nettoyage des fichiers non nécessaires dans la destination
rm "$EXT_DIR/install.sh" 2>/dev/null
rm "$EXT_DIR/README.md" 2>/dev/null
echo -e "📂 Fichiers copiés."

# 3. Compiler le schéma GSettings
echo -e "⚙️  Compilation des schémas..."
glib-compile-schemas "$EXT_DIR"

# 4. Gestion de l'activation
# On désactive d'abord pour être sûr que GNOME prenne en compte le changement d'état
gnome-extensions disable "$UUID" 2>/dev/null
echo -e "🔌 Activation de l'extension..."
gnome-extensions enable "$UUID"

echo -e "\n${GREEN}✅ INSTALLATION DES FICHIERS TERMINÉE !${NC}"

# 5. AUTO-RELOAD (La partie magique)
# On vérifie si on est sur X11 (Standard 42) ou Wayland
if [ "$XDG_SESSION_TYPE" == "x11" ]; then
    echo -e "${YELLOW}🔄 Redémarrage automatique de GNOME Shell... (L'écran va clignoter)${NC}"
    sleep 1
    # Cette commande simule exactement Alt+F2 puis 'r'
    busctl --user call org.gnome.Shell /org/gnome/Shell org.gnome.Shell Eval s 'global.reexec_self()'
    
    echo -e "${GREEN}✨ Tout est prêt !${NC}"
else
    # Sur Wayland, le redémarrage du shell tue la session, on ne peut pas le faire auto.
    echo -e "${YELLOW}⚠️  Tu es sous Wayland (ou session inconnue).${NC}"
    echo -e "   Le redémarrage auto n'est pas supporté sans déconnexion."
    echo -e "   Si l'extension ne s'affiche pas, déconnecte-toi et reconnecte-toi."
fi