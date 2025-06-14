const mongoose = require('mongoose')

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vistream')
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

// Define schemas
const PlanSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: String,
  period: String,
  highlight: Boolean,
  features: [String],
  isActive: Boolean,
  order: Number,
  slug: String
}, { timestamps: true })

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  planId: String,
  planName: String,
  planPrice: String,
  planPeriod: String,
  status: String,
  startDate: Date,
  endDate: Date,
  autoRenew: Boolean,
  affiliationCode: String,
  affiliatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  saleValue: Number
}, { timestamps: true })

const Plan = mongoose.models.Plan || mongoose.model('Plan', PlanSchema)
const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema)

async function fixPlanIds() {
  try {
    await connectToDatabase()

    // Get all plans
    const plans = await Plan.find({})
    console.log(`📋 Found ${plans.length} plans:`)
    plans.forEach(plan => {
      console.log(`  - ${plan._id}: ${plan.name} (${plan.price}/${plan.period})`)
    })

    // Get all subscriptions with affiliation data
    const subscriptions = await Subscription.find({
      affiliationCode: { $exists: true, $ne: null },
      affiliatedUserId: { $exists: true, $ne: null }
    })

    console.log(`\n🔍 Found ${subscriptions.length} subscriptions with affiliation data:`)
    
    for (const sub of subscriptions) {
      console.log(`\n📝 Subscription ${sub._id}:`)
      console.log(`  Current planId: ${sub.planId}`)
      console.log(`  Plan name: ${sub.planName}`)
      console.log(`  Plan price: ${sub.planPrice}`)
      console.log(`  Plan period: ${sub.planPeriod}`)

      // Try to find matching plan by name and price
      const matchingPlan = plans.find(plan => 
        plan.name === sub.planName && 
        plan.price === sub.planPrice && 
        plan.period === sub.planPeriod
      )

      if (matchingPlan) {
        if (sub.planId !== matchingPlan._id.toString()) {
          console.log(`  ✅ Found matching plan: ${matchingPlan._id}`)
          console.log(`  🔄 Updating planId from ${sub.planId} to ${matchingPlan._id}`)
          
          await Subscription.updateOne(
            { _id: sub._id },
            { planId: matchingPlan._id.toString() }
          )
          
          console.log(`  ✅ Updated successfully!`)
        } else {
          console.log(`  ✅ Plan ID already correct`)
        }
      } else {
        console.log(`  ❌ No matching plan found for this subscription`)
        console.log(`  Available plans:`)
        plans.forEach(plan => {
          console.log(`    - ${plan.name} (${plan.price}/${plan.period})`)
        })
      }
    }

    console.log('\n🎉 Plan ID fix completed!')
    
  } catch (error) {
    console.error('❌ Error fixing plan IDs:', error)
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
  }
}

// Run the script
fixPlanIds() 