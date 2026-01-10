# 42 Dashboard Ultimate 🟢

Extension **GNOME Shell** ultra-rapide pour suivre en temps réel ton **Logtime**, ton **Wallet**, tes **évaluations**, et voir si **tes amis sont présents au cluster**.

![Preview](preview.png)

---

## ⚡ Installation rapide

1. Ouvre un terminal dans le dossier du projet  
2. Lance le script d’installation :

```bash
git clone https://github.com/BalkamFR/logtime.git logtime@42 && cd logtime@42 && chmod +x install.sh && ./install.sh

```

3. Redémarre GNOME Shell :
- `Alt + F2`
- tape `r`
- appuie sur **Entrée**

---

## 🔑 Configuration de l’API 42

Pour que l’extension puisse récupérer tes données (Logtime, Wallet, Amis), tu dois créer une **application OAuth** sur l’Intra 42.

---

### Étape 1 : Créer l’application

Rends-toi sur :  
👉 https://profile.intra.42.fr/oauth/applications/new

Remplis le formulaire :

- **Name** : `Gnome Dashboard` (ou ce que tu veux)
- **Redirect URI** : `http://localhost`  
  _(obligatoire mais non utilisée)_
- **Scopes** : `public`  
  _(suffisant pour lire le profil et les locations)_

Clique sur **Submit**.

---

### Étape 2 : Récupérer les clés

Une fois l’application créée, tu obtiendras :

- **UID** → Client ID
- **SECRET** → Client Secret

Copie-les soigneusement.

---

### Étape 3 : Entrer les clés dans l’extension

1. Ouvre **Extensions GNOME** (icône 🧩)
2. Trouve **42 Dashboard Ultimate**
3. Clique sur **Paramètres (⚙️)**

Dans la section **Identification 42** :

- Colle ton **UID**
- Colle ton **SECRET**
- Entre ton **login 42** (ex: `papilaz`)

Ferme la fenêtre.  
👉 L’extension se rafraîchit automatiquement.

---

## 📅 Fonctionnalités

### 🕒 Logtime
- Compteur précis en **temps réel**
- Affichage heures + minutes

### 🎯 Objectif mensuel
- Barre de progression configurable  
  _(ex : 150h / mois)_

### 📊 Statistiques
- Wallet
- Points de correction
- Niveau

### 👥 Amis
- Voir qui est **en ligne**
- Voir sur **quel poste**
- Logtime de la journée
- Accès rapide au profil Intra

### 📆 Calendrier partagé
- Clique sur un ami
- Consulte son **historique de logtime**

---

## 🧩 Compatibilité

- GNOME Shell
- Linux (X11 / Wayland)
- Compte Intra 42 requis

---

## 🔒 Sécurité & confidentialité

- Aucune donnée stockée sur un serveur externe
- Les tokens OAuth sont utilisés uniquement pour interroger l’API 42
- Données conservées localement

---

## 📜 Licence

Projet personnel — usage libre pour les étudiants 42.
