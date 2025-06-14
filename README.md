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

## 🛠️ Installation

### 1. Cloner le projet
```bash
git clone <repository-url>
cd vistream
```

### 2. Installer les dépendances
```bash
npm install
```

**Note**: Toutes les dépendances backend sont maintenant incluses dans le projet :
- `mongoose` - ODM MongoDB
- `bcryptjs` - Hachage de mots de passe
- `jsonwebtoken` - Gestion des tokens JWT
- `nodemailer` - Service d'email
- Types TypeScript inclus

### 3. Configuration de l'environnement

Créer un fichier `.env.local` à la racine du projet :

```env
# Base de données MongoDB
MONGODB_URI=mongodb://vistream:owTWo84Nf2JL5q5zsdjkljdf@176.9.26.121:27017/VISTREAM?directConnection=true

# Secrets JWT (changez ces valeurs en production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000

# Configuration Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@vistream.net
FROM_NAME=Vistream

# Configuration Application
APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Configuration Email (Gmail)

Pour utiliser Gmail comme service SMTP :

1. Activez l'authentification à 2 facteurs sur votre compte Gmail
2. Générez un "Mot de passe d'application" :
   - Allez dans Paramètres Google → Sécurité
   - Authentification à 2 facteurs → Mots de passe d'application
   - Sélectionnez "Autre" et nommez-le "Vistream"
   - Utilisez ce mot de passe dans `SMTP_PASS`

### 5. Créer un utilisateur administrateur
```bash
npm run create-admin
```

Cela crée un utilisateur administrateur avec :
- Email : `admin@vistream.net`
- Mot de passe : `admin123456`

### 6. Démarrer le serveur de développement
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

## 🗄️ Structure de la Base de Données

### Collection `users`
```javascript
{
  _id: ObjectId,
  email: String (unique),
  firstName: String,
  lastName: String,
  phonePrefix: String,
  phoneNumber: String,
  password: String (hashed),
  role: String (enum: 'admin', 'user', 'customer', default: 'customer'),
  isVerified: Boolean,
  isActive: Boolean,
  otp: String (nullable),
  otpExpiry: Date (nullable),
  resetToken: String (nullable),
  resetTokenExpiry: Date (nullable),
  lastLogin: Date (nullable),
  loginAttempts: Number,
  lockUntil: Date (nullable),
  createdAt: Date,
  updatedAt: Date
}
```

## 👥 Système de Rôles

L'application implémente un système de rôles à trois niveaux :

### 🔴 Admin
- **Accès complet** à toutes les fonctionnalités
- **Gestion des utilisateurs** : créer, modifier, supprimer
- **Panel d'administration** : `/admin`
- **Statistiques et analytics** de la plateforme
- **Configuration système**

### 🔵 User (Utilisateur)
- **Consultation des abonnements** de tous les clients
- **Gestion de son profil**
- **Accès au dashboard** utilisateur

### 🟢 Customer (Client)
- **Consultation de son abonnement** uniquement
- **Gestion de son profil**
- **Accès limité** aux fonctionnalités

### Hiérarchie des Permissions
```
Admin > User > Customer
```

Les utilisateurs avec un rôle supérieur peuvent accéder aux fonctionnalités des rôles inférieurs.

## 🔐 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription utilisateur (rôle 'customer' par défaut)
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/verify-otp` - Vérification OTP
- `POST /api/auth/resend-otp` - Renvoyer OTP
- `POST /api/auth/forgot-password` - Demande de réinitialisation
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Informations utilisateur connecté

### Administration (Admin uniquement)
- `GET /api/admin/users` - Liste des utilisateurs avec pagination et filtres
- `POST /api/admin/users` - Créer un nouvel utilisateur
- `GET /api/admin/users/[id]` - Détails d'un utilisateur
- `PUT /api/admin/users/[id]` - Modifier un utilisateur
- `DELETE /api/admin/users/[id]` - Supprimer un utilisateur (soft delete)

### Exemple d'utilisation

#### Inscription
```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean@example.com',
    phonePrefix: '+33',
    phoneNumber: '612345678',
    password: 'motdepasse123'
  })
})
```

#### Connexion
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'jean@example.com',
    password: 'motdepasse123',
    rememberMe: true
  })
})
```

## 🛡️ Sécurité

- **Mots de passe hachés** avec bcrypt (12 rounds)
- **Tokens JWT** avec expiration (24h pour l'accès, 7j pour le refresh)
- **Cookies HTTP-only** pour les tokens
- **Validation des données** avec Zod
- **Protection CSRF** avec SameSite cookies
- **Middleware de protection** des routes sensibles

## 🚦 Routes Protégées

- `/dashboard` - Nécessite une authentification
- `/auth/*` - Redirige vers le dashboard si déjà connecté

## 📱 Pages Disponibles

### Authentification
- `/auth/login` - Connexion
- `/auth/signup` - Inscription
- `/auth/activate` - Activation par OTP
- `/auth/forgot-password` - Récupération de mot de passe

### Application
- `/` - Page d'accueil
- `/dashboard` - Tableau de bord utilisateur (tous les rôles)

### Administration (Admin uniquement)
- `/admin` - Dashboard administrateur
- `/admin/users` - Gestion des utilisateurs
- `/admin/settings` - Paramètres système

### Pages Institutionnelles
- `/about` - À propos
- `/blog` - Blog
- `/careers` - Carrières
- `/help` - Centre d'aide
- `/docs` - Documentation
- `/api` - Référence API
- `/legal` - Mentions légales
- `/privacy` - Politique de confidentialité
- `/security` - Sécurité

## 🔧 Développement

### Scripts disponibles
```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # Linting ESLint
npm run create-admin # Créer un utilisateur administrateur
```

### Structure du projet
```
src/
├── app/
│   ├── api/auth/           # API Routes d'authentification
│   ├── auth/               # Pages d'authentification
│   ├── dashboard/          # Dashboard utilisateur
│   └── [autres-pages]/     # Pages institutionnelles
├── components/
│   ├── ui/                 # Composants UI (shadcn)
│   └── layout/             # Composants de layout
├── lib/
│   ├── mongodb.ts          # Connexion MongoDB
│   ├── auth.ts             # Utilitaires d'authentification
│   └── email.ts            # Service d'email
└── middleware.ts           # Middleware de protection des routes
```

## 🚀 Déploiement

### Variables d'environnement de production
Assurez-vous de définir toutes les variables d'environnement en production :

- Changez tous les secrets (`JWT_SECRET`, etc.)
- Configurez `NODE_ENV=production`
- Utilisez HTTPS (`NEXTAUTH_URL` avec https)
- Configurez un service email professionnel

### Recommandations
- Utilisez un service MongoDB managé (MongoDB Atlas)
- Configurez un service email transactionnel (SendGrid, Mailgun)
- Activez HTTPS et les en-têtes de sécurité
- Surveillez les logs et les erreurs

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Contactez l'équipe de développement
- Consultez la documentation dans `/docs`

---

**Vistream** - Streaming vidéo intelligent avec IA 🎥✨ 