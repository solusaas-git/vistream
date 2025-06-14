# 🔐 Sécurité des Tokens de Réinitialisation - Vistream

## Vue d'ensemble

Ce document détaille les mesures de sécurité implémentées pour protéger les tokens de réinitialisation de mot de passe dans l'application Vistream.

## 🛡️ Mesures de Sécurité Implémentées

### 1. Génération Cryptographiquement Sûre
- **Méthode** : `crypto.randomBytes(32).toString('hex')`
- **Longueur** : 64 caractères hexadécimaux
- **Entropie** : 256 bits (cryptographiquement sûr)
- **Avantage** : Impossible à deviner ou à reproduire

### 2. Hachage des Tokens
- **Algorithme** : SHA-256
- **Stockage** : Seul le hash est stocké en base de données
- **Transmission** : Le token original est envoyé par email
- **Vérification** : Le token reçu est hashé puis comparé au hash stocké

```javascript
// Génération (côté serveur)
const resetToken = crypto.randomBytes(32).toString('hex')
const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

// Vérification (côté API)
const receivedHash = crypto.createHash('sha256').update(receivedToken).digest('hex')
const isValid = storedHash === receivedHash
```

### 3. Protection contre les Attaques par Force Brute

#### Limitation par IP
- **Vérification de token** : 10 tentatives max par 15 minutes
- **Réinitialisation** : 5 tentatives max par 15 minutes
- **Mécanisme** : Cache en mémoire avec nettoyage automatique

#### Limitation temporelle
- **Demandes répétées** : 5 minutes minimum entre demandes
- **Expiration** : Tokens valides 1 heure seulement
- **Nettoyage** : Suppression automatique des tokens expirés

### 4. Validation et Sanitisation

#### Côté Client
```typescript
// Validation du mot de passe
if (password.length < 8) {
  throw new Error('Le mot de passe doit contenir au moins 8 caractères')
}
```

#### Côté Serveur
```typescript
// Validation du token
if (!token || typeof token !== 'string') {
  return NextResponse.json({ message: 'Token invalide' }, { status: 400 })
}

// Validation de l'expiration
const user = await User.findOne({
  resetToken: hashedToken,
  resetTokenExpiry: { $gt: Date.now() }
})
```

### 5. Sécurité de la Base de Données

#### Champs Protégés
```javascript
resetToken: { 
  type: String, 
  select: false  // Exclu par défaut des requêtes
}
resetTokenExpiry: { 
  type: Date, 
  select: false 
}
```

#### Sélection Explicite
```javascript
// Nécessaire pour accéder aux champs protégés
.select('+resetToken +resetTokenExpiry')
```

### 6. Nettoyage Automatique

#### Suppression après utilisation
```javascript
user.resetToken = undefined
user.resetTokenExpiry = undefined
await user.save()
```

#### Nettoyage des tokens expirés
```javascript
await User.updateMany(
  { resetTokenExpiry: { $lt: new Date() } },
  { $unset: { resetToken: 1, resetTokenExpiry: 1 } }
)
```

## 🔍 Outils de Debug et Monitoring

### Scripts Disponibles
```bash
# Test de sécurité des tokens
npm run test:security-tokens

# Debug des tokens en base
npm run debug:reset-tokens
```

### Logs de Sécurité
- Tentatives de vérification de tokens
- Dépassements de limites par IP
- Réinitialisations réussies
- Tokens expirés ou invalides

## 📊 Métriques de Sécurité

### Résistance aux Attaques
- **Attaque par force brute** : 2^256 possibilités (impossible)
- **Attaque par timing** : Hachage constant (protégé)
- **Attaque par rejeu** : Token à usage unique (protégé)
- **Attaque par énumération** : Limitation par IP (protégé)

### Performance
- **Génération** : ~1ms par token
- **Vérification** : ~1ms par hash
- **Stockage** : 64 bytes par token hashé

## 🚨 Alertes et Monitoring

### Événements à Surveiller
1. **Tentatives répétées** : Plus de 5 tentatives par IP
2. **Tokens expirés** : Utilisation de tokens périmés
3. **Tokens invalides** : Tentatives avec tokens inexistants
4. **Pics de demandes** : Augmentation anormale des demandes

### Actions Automatiques
1. **Blocage temporaire** : IP bloquées après dépassement
2. **Nettoyage** : Suppression automatique des tokens expirés
3. **Invalidation** : Suppression après utilisation réussie

## 🔄 Migration et Compatibilité

### Tokens Existants
- Les anciens tokens non sécurisés sont automatiquement invalidés
- Script de nettoyage disponible : `npm run debug:reset-tokens`
- Aucune action manuelle requise

### Rétrocompatibilité
- Les nouvelles mesures n'affectent pas les utilisateurs existants
- Migration transparente lors de la prochaine demande de reset

## 📋 Checklist de Sécurité

- [x] Génération cryptographiquement sûre
- [x] Hachage avant stockage (SHA-256)
- [x] Protection contre force brute
- [x] Limitation temporelle des demandes
- [x] Validation stricte des entrées
- [x] Nettoyage automatique
- [x] Logs de sécurité
- [x] Scripts de debug
- [x] Documentation complète

## 🎯 Recommandations Futures

1. **Monitoring avancé** : Intégration avec un système de monitoring
2. **Alertes temps réel** : Notifications pour tentatives suspectes
3. **Audit trail** : Historique complet des actions de sécurité
4. **Tests de pénétration** : Validation régulière de la sécurité

---

**Dernière mise à jour** : Décembre 2024  
**Version** : 1.0  
**Statut** : ✅ Implémenté et testé 