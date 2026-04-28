require('dotenv').config()
const { v2: cloudinary } = require('cloudinary')

console.log('🔍 Cloudinary Configuration Diagnostic')
console.log('=====================================')

// Check current environment variables
console.log('\n📋 Current Environment Variables:')
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || '❌ Missing')
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing')
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing')

// Show partial values for verification (first 4 and last 4 characters)
if (process.env.CLOUDINARY_API_KEY) {
  const key = process.env.CLOUDINARY_API_KEY
  console.log('   API Key format:', `${key.substring(0, 4)}...${key.substring(key.length - 4)}`)
}

if (process.env.CLOUDINARY_API_SECRET) {
  const secret = process.env.CLOUDINARY_API_SECRET
  console.log('   API Secret format:', `${secret.substring(0, 4)}...${secret.substring(secret.length - 4)}`)
}

// Test different cloud names
const testCloudNames = [
  process.env.CLOUDINARY_CLOUD_NAME, // Current one
  'dkfnybqnx', // The one that's failing
  'demo', // Common test cloud
]

console.log('\n🧪 Testing Cloud Names...')

async function testCloudName(cloudName) {
  if (!cloudName) return false
  
  try {
    console.log(`\n🔗 Testing: ${cloudName}`)
    
    // Configure with this cloud name
    cloudinary.config({
      cloud_name: cloudName,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
    
    console.log('   Configuration set, testing ping...')
    
    // Test connection with ping
    const result = await cloudinary.api.ping()
    console.log(`✅ ${cloudName}: SUCCESS - ${JSON.stringify(result)}`)
    
    // Try to get account info
    try {
      console.log('   Testing account info...')
      const account = await cloudinary.api.account()
      console.log(`   📊 Account: ${account.name} (${account.plan})`)
      console.log(`   🏠 Cloud: ${account.cloud_name}`)
      console.log(`   💰 Credits: ${account.credits}`)
      return true
    } catch (accountError) {
      console.log(`   ⚠️  Account info failed: ${accountError.message}`)
      if (accountError.http_code) {
        console.log(`   HTTP Code: ${accountError.http_code}`)
      }
    }
    
  } catch (error) {
    console.log(`❌ ${cloudName}: FAILED`)
    console.log(`   Error: ${error.message || 'Unknown error'}`)
    if (error.http_code) {
      console.log(`   HTTP Code: ${error.http_code}`)
    }
    if (error.request_options) {
      console.log(`   URL: ${error.request_options.href}`)
    }
  }
  
  return false
}

async function runTests() {
  let success = false
  
  for (const cloudName of testCloudNames) {
    if (cloudName) {
      success = await testCloudName(cloudName)
      if (success) {
        console.log(`\n🎯 SOLUTION: Use cloud name "${cloudName}"`)
        console.log(`Update your .env file with:`)
        console.log(`CLOUDINARY_CLOUD_NAME=${cloudName}`)
        break
      }
    }
  }
  
  if (!success) {
    console.log('\n❌ All cloud names failed. Possible issues:')
    console.log('1. 🔑 API Key is incorrect or expired')
    console.log('2. 🔐 API Secret is incorrect')
    console.log('3. 🚫 Account is suspended or inactive')
    console.log('4. 🌐 Network/firewall issues')
    
    console.log('\n💡 Next Steps:')
    console.log('1. Go to https://cloudinary.com/console/dashboard')
    console.log('2. Check if your account is active')
    console.log('3. Regenerate your API key and secret')
    console.log('4. Copy the exact values (no extra spaces)')
    console.log('5. Check the URL for your correct cloud name')
    
    console.log('\n🔧 Quick Fix:')
    console.log('Try creating a new free account at cloudinary.com')
    console.log('This will give you fresh credentials to test with')
  }
}

runTests().catch(console.error)
