const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// Simple User schema for reading
const UserSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  role: String,
  affiliationCode: String,
  isActive: Boolean
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', UserSchema)

async function showAffiliationCodes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    console.log('\n📋 CODES D\'AFFILIATION EXISTANTS')
    console.log('=' .repeat(50))

    // Get all users with affiliation codes
    const usersWithCodes = await User.find({
      role: 'user',
      affiliationCode: { $exists: true, $ne: null, $ne: '' },
      isActive: true
    }).sort({ createdAt: -1 })

    if (usersWithCodes.length === 0) {
      console.log('❌ Aucun utilisateur avec code d\'affiliation trouvé')
      return
    }

    console.log(`\n👥 ${usersWithCodes.length} utilisateur(s) avec code d'affiliation:\n`)

    usersWithCodes.forEach((user, index) => {
      const pattern = analyzePattern(user.affiliationCode)
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`)
      console.log(`   📧 ${user.email}`)
      console.log(`   🔢 Code: ${user.affiliationCode} (${pattern})`)
      console.log(`   📅 Créé: ${user.createdAt.toLocaleDateString('fr-FR')}`)
      console.log()
    })

    // Show pattern statistics
    const patterns = usersWithCodes.map(u => analyzePattern(u.affiliationCode))
    const patternCounts = patterns.reduce((acc, pattern) => {
      acc[pattern] = (acc[pattern] || 0) + 1
      return acc
    }, {})

    console.log('📊 STATISTIQUES DES PATTERNS:')
    Object.entries(patternCounts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([pattern, count]) => {
        console.log(`   ${pattern}: ${count} code(s)`)
      })

    console.log(`\n💡 CONSEILS POUR VOS COMMERCIAUX:`)
    console.log(`   • Les codes sont conçus pour être faciles à retenir`)
    console.log(`   • Chaque commercial a un code unique`)
    console.log(`   • Les clients peuvent utiliser le code lors de l'inscription`)
    console.log(`   • URL format: /auth/signup?plan=PLAN&affiliation=CODE`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

function analyzePattern(code) {
  if (!code) return 'Aucun'
  
  // Check patterns
  if (/^(\d)\1{3}$/.test(code)) return 'AAAA (répétition)'
  if (/^(\d)(\d)\1\2$/.test(code)) return 'ABAB (alternance)'
  if (/^(\d)(\d)\2\1$/.test(code)) return 'ABBA (miroir)'
  if (/^1234|2345|3456|4567|5678|6789$/.test(code)) return 'Séquentiel ↗'
  if (/^9876|8765|7654|6543|5432|4321$/.test(code)) return 'Séquentiel ↘'
  if (/^20[2-3]\d$/.test(code)) return 'Année'
  if (/^\d000$/.test(code)) return 'Millier rond'
  
  return 'Aléatoire'
}

// Run if called directly
if (require.main === module) {
  showAffiliationCodes()
}

module.exports = { showAffiliationCodes, analyzePattern } 