require('dotenv').config()
const { v2: cloudinary } = require('cloudinary')

// Check environment variables
console.log('🔍 Checking Cloudinary Configuration...')
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing')
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing')
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing')

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Test connection by getting account info
async function testConnection() {
  try {
    console.log('\n🔗 Testing Cloudinary Connection...')
    
    // Try to get account info
    const result = await cloudinary.api.ping()
    console.log('✅ Connection successful!')
    console.log('Response:', result)
    
    // Try to get account details
    const account = await cloudinary.api.account()
    console.log('✅ Account info retrieved!')
    console.log('Account:', {
      name: account.name,
      cloud_name: account.cloud_name,
      plan: account.plan,
      credits: account.credits
    })
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    console.error('Full error:', error)
  }
}

testConnection()
