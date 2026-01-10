# ============================================================
# 42 Dashboard Ultimate 🟢
# Extension GNOME Shell pour suivre :
# - Logtime
# - Wallet
# - Évaluations
# - Présence des amis au cluster
# ============================================================

EXTENSION_NAME = 42-dashboard-ultimate

# ------------------------------------------------------------
# 🎯 Aide (commande par défaut)
# ------------------------------------------------------------
help:
	@echo ""
	@echo "📦 42 Dashboard Ultimate - Makefile"
	@echo ""
	@echo "Commandes disponibles :"
	@echo "  make install        Installer l’extension"
	@echo "  make restart        Redémarrer GNOME Shell"
	@echo "  make config         Instructions de configuration API 42"
	@echo "  make features       Liste des fonctionnalités"
	@echo ""

# ------------------------------------------------------------
# ⚡ Installation rapide
# ------------------------------------------------------------
install:
	chmod +x install.sh
	./install.sh
	@echo ""
	@echo "✅ Installation terminée"
	@echo "➡️  Lancez : make restart"

# ------------------------------------------------------------
# 🔄 Redémarrage GNOME Shell
# ------------------------------------------------------------
restart:
	@echo "🔄 Redémarrage de GNOME Shell"
	@echo "Utilisez : Alt + F2 → r → Entrée"

# ------------------------------------------------------------
# 🔑 Configuration API 42
# ------------------------------------------------------------
config:
	@echo ""
	@echo "🔑 Configuration de l’API 42"
	@echo ""
	@echo "1️⃣ Créer une application sur l’Intra"
	@echo "   https://profile.intra.42.fr/oauth/applications/new"
	@echo ""
	@echo "   - Name         : Gnome Dashboard"
	@echo "   - Redirect URI: http://localhost"
	@echo "   - Scopes      : public"
	@echo ""
	@echo "2️⃣ Récupérer les clés"
	@echo "   - UID    (Client ID)"
	@echo "   - SECRET (Client Secret)"
	@echo ""
	@echo "3️⃣ Entrer les clés dans GNOME Extensions"
	@echo "   - Extensions → 42 Dashboard Ultimate → ⚙️"
	@echo "   - UID"
	@echo "   - SECRET"
	@echo "   - Login 42 (ex: papilaz)"
	@echo ""
	@echo "ℹ️  L’extension se rafraîchit automatiquement"

# ------------------------------------------------------------
# 📅 Fonctionnalités
# ------------------------------------------------------------
features:
	@echo ""
	@echo "📅 Fonctionnalités"
	@echo ""
	@echo "🕒 Logtime"
	@echo "  - Temps réel (heures + minutes)"
	@echo ""
	@echo "🎯 Objectif mensuel"
	@echo "  - Barre de progression (ex: 150h)"
	@echo ""
	@echo "📊 Statistiques"
	@echo "  - Wallet"
	@echo "  - Points de correction"
	@echo "  - Niveau"
	@echo ""
	@echo "👥 Amis"
	@echo "  - En ligne / hors ligne"
	@echo "  - Poste utilisé"
	@echo "  - Logtime du jour"
	@echo ""
	@echo "🔗 Accès rapide"
	@echo "  - Profil Intra"
	@echo ""
	@echo "📆 Calendrier partagé"
	@echo "  - Historique de logtime des amis"
	@echo ""
