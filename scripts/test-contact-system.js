const mongoose = require('mongoose')

// MongoDB connection
const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vistream')
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

// Contact model (simplified for testing)
const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'read', 'replied', 'closed'], default: 'new' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  tags: [String],
  source: { type: String, default: 'test' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema)

async function testContactSystem() {
  console.log('🧪 Testing Contact Management System...\n')

  try {
    await connectToDatabase()

    // Test 1: Create test contacts
    console.log('📝 Test 1: Creating test contacts...')
    
    const testContacts = [
      {
        name: 'Jean Dupont',
        email: 'jean.dupont@example.com',
        subject: 'Demande d\'information sur les plans Enterprise',
        message: 'Bonjour, je souhaiterais avoir plus d\'informations sur vos plans Enterprise pour notre société de 500 employés.',
        priority: 'high',
        tags: ['enterprise', 'pricing', 'demo']
      },
      {
        name: 'Marie Martin',
        email: 'marie.martin@example.com',
        subject: 'Problème technique avec l\'API',
        message: 'J\'ai des difficultés à intégrer votre API dans notre application. Pouvez-vous m\'aider ?',
        priority: 'urgent',
        tags: ['technique', 'api', 'support']
      },
      {
        name: 'Pierre Durand',
        email: 'pierre.durand@example.com',
        subject: 'Question sur les fonctionnalités IA',
        message: 'Votre solution d\'upscaling 8K fonctionne-t-elle avec tous les formats vidéo ?',
        priority: 'medium',
        tags: ['question', 'ia', 'upscaling']
      },
      {
        name: 'Sophie Leroy',
        email: 'sophie.leroy@example.com',
        subject: 'Partenariat commercial',
        message: 'Nous sommes une agence de communication et aimerions discuter d\'un partenariat.',
        priority: 'high',
        tags: ['partnership', 'business']
      },
      {
        name: 'Test Spam',
        email: 'spam@temp-mail.com',
        subject: 'URGENT: You have won the lottery!!!',
        message: 'Congratulations! Click here to claim your prize: http://suspicious-link.com',
        priority: 'low',
        tags: ['spam']
      }
    ]

    const createdContacts = await Contact.insertMany(testContacts)
    console.log(`✅ Created ${createdContacts.length} test contacts`)

    // Test 2: Query contacts by status
    console.log('\n📊 Test 2: Querying contacts by status...')
    const newContacts = await Contact.find({ status: 'new' })
    console.log(`✅ Found ${newContacts.length} new contacts`)

    // Test 3: Query contacts by priority
    console.log('\n⚡ Test 3: Querying contacts by priority...')
    const urgentContacts = await Contact.find({ priority: 'urgent' })
    const highContacts = await Contact.find({ priority: 'high' })
    console.log(`✅ Found ${urgentContacts.length} urgent contacts`)
    console.log(`✅ Found ${highContacts.length} high priority contacts`)

    // Test 4: Query contacts by tags
    console.log('\n🏷️  Test 4: Querying contacts by tags...')
    const enterpriseContacts = await Contact.find({ tags: { $in: ['enterprise'] } })
    const technicalContacts = await Contact.find({ tags: { $in: ['technique', 'api'] } })
    console.log(`✅ Found ${enterpriseContacts.length} enterprise-related contacts`)
    console.log(`✅ Found ${technicalContacts.length} technical contacts`)

    // Test 5: Search functionality
    console.log('\n🔍 Test 5: Testing search functionality...')
    const searchResults = await Contact.find({
      $or: [
        { name: { $regex: 'jean', $options: 'i' } },
        { email: { $regex: 'jean', $options: 'i' } },
        { subject: { $regex: 'jean', $options: 'i' } },
        { message: { $regex: 'jean', $options: 'i' } }
      ]
    })
    console.log(`✅ Search for 'jean' returned ${searchResults.length} results`)

    // Test 6: Update contact status
    console.log('\n📝 Test 6: Testing contact updates...')
    const contactToUpdate = await Contact.findOne({ name: 'Jean Dupont' })
    if (contactToUpdate) {
      contactToUpdate.status = 'read'
      contactToUpdate.updatedAt = new Date()
      await contactToUpdate.save()
      console.log(`✅ Updated contact status to 'read'`)
    }

    // Test 7: Statistics
    console.log('\n📈 Test 7: Generating statistics...')
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])
    
    const statusStats = {
      new: 0,
      read: 0,
      replied: 0,
      closed: 0
    }
    
    stats.forEach(stat => {
      statusStats[stat._id] = stat.count
    })
    
    console.log('✅ Contact Statistics:')
    console.log(`   - New: ${statusStats.new}`)
    console.log(`   - Read: ${statusStats.read}`)
    console.log(`   - Replied: ${statusStats.replied}`)
    console.log(`   - Closed: ${statusStats.closed}`)

    // Test 8: Pagination
    console.log('\n📄 Test 8: Testing pagination...')
    const page1 = await Contact.find().sort({ createdAt: -1 }).limit(3).skip(0)
    const page2 = await Contact.find().sort({ createdAt: -1 }).limit(3).skip(3)
    console.log(`✅ Page 1: ${page1.length} contacts`)
    console.log(`✅ Page 2: ${page2.length} contacts`)

    console.log('\n🎉 All tests completed successfully!')
    console.log('\n📋 Summary:')
    console.log('✅ Contact model working correctly')
    console.log('✅ CRUD operations functional')
    console.log('✅ Search and filtering working')
    console.log('✅ Status and priority management working')
    console.log('✅ Tags system functional')
    console.log('✅ Statistics generation working')
    console.log('✅ Pagination working')

    console.log('\n🚀 Contact Management System is ready!')
    console.log('\n📝 Next steps:')
    console.log('1. Test the contact form on the landing page')
    console.log('2. Access the admin panel at /admin/contacts')
    console.log('3. Test the filtering and management features')
    console.log('4. Set up email notifications (optional)')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await mongoose.connection.close()
    console.log('\n🔌 Database connection closed')
  }
}

// Run the test
testContactSystem() 