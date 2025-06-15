# Vistream - Plateforme de Streaming Vidéo IA

Une plateforme moderne de streaming vidéo avec intelligence artificielle, construite avec Next.js, MongoDB et une architecture d'authentification complète.

## 🚀 Fonctionnalités

### Frontend
- **Interface moderne** avec Next.js 15 et Tailwind CSS
- **Authentification complète** : inscription, connexion, activation par OTP, récupération de mot de passe
- **Dashboard utilisateur** avec analytics et gestion de vidéos
- **Pages institutionnelles** : À propos, Blog, Carrières, Aide, Documentation, etc.
- **Design responsive** avec composants shadcn/ui
- **Animations fluides** avec Framer Motion

### Backend (Production-Ready)
- **Authentification JWT** avec tokens d'accès et de rafraîchissement
- **Mongoose ODM** avec modèles, validation et middleware
- **Système OTP** pour la vérification d'email avec expiration
- **Hachage de mots de passe** avec bcrypt (12 rounds)
- **Rate limiting** par IP et endpoint
- **Gestion d'erreurs** centralisée et logging
- **Middleware de protection** des routes
- **Gestion des cookies** HTTP-only sécurisés
- **Validation des données** avec Zod
- **Configuration de production** avec validation d'environnement

## 📋 Prérequis

- Node.js 18+ 
- MongoDB (local ou distant)
- Compte email SMTP (Gmail recommandé)

