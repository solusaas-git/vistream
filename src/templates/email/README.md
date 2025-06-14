# 📧 Système de Templates d'Email Vistream

Ce dossier contient tous les templates d'email utilisés par l'application Vistream. Le système utilise la bibliothèque `juice` pour l'inline styling, garantissant une compatibilité maximale avec tous les clients email (Gmail, Outlook, Yahoo, etc.).

## 🏗️ Architecture

### Structure des fichiers
```
src/templates/email/
├── base.html                 # Template de base avec CSS
├── welcome.html             # Email de bienvenue
├── password-reset.html      # Réinitialisation de mot de passe
├── otp-verification.html    # Vérification OTP
├── smtp-test.html           # Test de configuration SMTP
└── README.md               # Cette documentation
```

### Composants principaux
- **`base.html`** : Template principal avec CSS responsive et compatible email
- **Templates spécifiques** : Contenu spécifique à chaque type d'email
- **`src/lib/email-templates.ts`** : Service de génération des templates
- **`src/lib/email.ts`** : Service d'envoi d'email utilisant les templates

## 🎨 Fonctionnalités CSS

### Compatibilité Email
- **Inline styling** automatique avec `juice`
- **Reset CSS** pour les clients email
- **Responsive design** avec media queries
- **Support dark mode** (limité)
- **Polices système** pour une meilleure compatibilité

### Classes CSS disponibles
- `.email-container` : Conteneur principal (600px max)
- `.email-header` : En-tête avec gradient
  - `.welcome` : Style bienvenue (bleu/violet)
  - `.reset` : Style réinitialisation (rouge/orange)
  - `.otp` : Style OTP (bleu/violet)
- `.email-content` : Contenu principal
- `.btn` : Bouton principal
  - `.btn-reset` : Bouton rouge pour reset
- `.info-box` : Boîte d'information avec bordure gauche
- `.alert-box` : Boîte d'alerte avec bordure
- `.otp-code` : Affichage du code OTP
- `.email-footer` : Pied de page

## 🔧 Utilisation

### Créer un nouvel email
1. **Créer le template HTML** dans ce dossier
2. **Ajouter la fonction de génération** dans `email-templates.ts`
3. **Ajouter la fonction d'envoi** dans `email.ts`

### Variables disponibles
Les templates utilisent la syntaxe `{{variable}}` :
- `{{title}}` : Titre de l'email (dans `<title>`)
- `{{firstName}}` : Prénom de l'utilisateur
- `{{lastName}}` : Nom de famille
- `{{dashboardUrl}}` : URL du tableau de bord
- `{{resetUrl}}` : URL de réinitialisation
- `{{otp}}` : Code OTP
- `{{smtpName}}` : Nom de la configuration SMTP (test)
- `{{smtpHost}}` : Serveur SMTP (test)
- `{{smtpPort}}` : Port SMTP (test)
- `{{smtpSecurity}}` : Type de sécurité (test)
- `{{testEmail}}` : Email de destination (test)
- `{{testDate}}` : Date du test
- `{{testTime}}` : Heure du test

### Exemple de template
```html
<div class="email-header welcome">
  <h1>🎉 Nouveau Template</h1>
  <p>Description du template</p>
</div>

<div class="email-content">
  <h2>Bonjour {{firstName}} !</h2>
  <p>Contenu de votre email...</p>
  
  <div class="info-box">
    <h3>Information importante</h3>
    <p>Détails supplémentaires...</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{actionUrl}}" class="btn">
      Bouton d'action
    </a>
  </div>
  
  <div class="email-footer">
    <p>Cet email a été envoyé par Vistream</p>
  </div>
</div>
```

## 🧪 Tests

### Tester les templates
```bash
# Générer des aperçus HTML de tous les templates
npm run test:email-templates

# Tester spécifiquement le template SMTP
npm run test:smtp-template

# Les fichiers de test sont générés dans scripts/email-previews/
# - welcome-preview.html
# - password-reset-preview.html
# - otp-verification-preview.html
# - smtp-test-preview.html
```

### Prévisualiser dans le navigateur
Ouvrez les fichiers HTML générés dans votre navigateur pour voir le rendu final avec l'inline styling appliqué.

## 📱 Responsive Design

### Breakpoints
- **Desktop** : 600px et plus
- **Mobile** : Moins de 600px

### Adaptations mobiles
- Conteneur pleine largeur
- Padding réduit (20px)
- Boutons pleine largeur
- Tailles de police ajustées
- Code OTP plus petit

## 🎯 Bonnes Pratiques

### CSS Email
1. **Toujours utiliser des tables** pour la structure complexe
2. **Inline styles** pour la compatibilité maximale
3. **Éviter les CSS modernes** (flexbox, grid)
4. **Tester sur plusieurs clients** email
5. **Utiliser des couleurs web-safe**

### Contenu
1. **Texte alternatif** pour les images
2. **Liens absolus** uniquement
3. **Appels à l'action clairs**
4. **Contenu concis** et scannable
5. **Footer informatif**

### Performance
1. **Images optimisées** et hébergées
2. **CSS minimal** et efficace
3. **HTML valide** et sémantique
4. **Taille totale < 100KB**

## 🔄 Configuration SMTP

Le système utilise automatiquement le serveur SMTP actif configuré dans l'interface admin (`/admin/settings`). Plus besoin de variables d'environnement SMTP !

### Avantages
- ✅ Configuration centralisée
- ✅ Changement à chaud
- ✅ Interface graphique
- ✅ Test intégré
- ✅ Gestion multi-serveurs

## 🚀 Déploiement

### Variables d'environnement requises
```env
APP_URL=https://votre-domaine.com
```

### Variables SMTP (optionnelles)
Les variables SMTP dans `.env` ne sont plus requises car le système utilise la configuration de la base de données.

## 📚 Ressources

### Outils de test email
- [Litmus](https://litmus.com/) - Test multi-clients
- [Email on Acid](https://www.emailonacid.com/) - Test et validation
- [Can I Email](https://www.caniemail.com/) - Support CSS

### Documentation
- [Juice Documentation](https://github.com/Automattic/juice)
- [Email CSS Guide](https://www.campaignmonitor.com/css/)
- [HTML Email Best Practices](https://templates.mailchimp.com/development/html/)

---

💡 **Conseil** : Testez toujours vos emails sur plusieurs clients avant la mise en production ! 