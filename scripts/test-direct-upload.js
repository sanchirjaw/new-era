#!/usr/bin/env node

/**
 * Test script for direct upload functionality
 * This tests the new API that generates upload URLs for Bunny.net
 */

const https = require('https');

// Configuration
const CONFIG = {
  baseUrl: 'https://edunewera.mn',
  endpoint: '/api/admin/upload/video',
  testFiles: [
    { filename: 'small-video.mp4', size: 1 * 1024 * 1024, type: 'video/mp4' },      // 1MB
    { filename: 'medium-video.mp4', size: 10 * 1024 * 1024, type: 'video/mp4' },     // 10MB
    { filename: 'large-video.mp4', size: 100 * 1024 * 1024, type: 'video/mp4' },     // 100MB
    { filename: 'huge-video.mp4', size: 680 * 1024 * 1024, type: 'video/mp4' },      // 680MB (your original issue)
  ]
};

/**
 * Test direct upload URL generation
 */
function testDirectUpload(filename, fileSize, contentType) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Testing direct upload for: ${filename}`);
    console.log(`📊 File size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`📋 Content type: ${contentType}`);

    const requestData = JSON.stringify({
      filename,
      fileSize,
      contentType
    });

    const options = {
      hostname: 'edunewera.mn',
      port: 443,
      path: CONFIG.endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData),
        'User-Agent': 'DirectUploadTest/1.0',
      },
      timeout: 30000, // 30 seconds
    };

    const req = https.request(options, (res) => {
      console.log(`📡 Response Status: ${res.statusCode} ${res.statusMessage}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log(`✅ Direct upload URL generated successfully!`);
            console.log(`📋 Video ID: ${response.videoId}`);
            console.log(`🔗 Upload URL: ${response.uploadUrl}`);
            console.log(`📝 Message: ${response.message}`);
            
            resolve({ 
              success: true, 
              statusCode: res.statusCode, 
              response,
              fileSize: (fileSize / (1024 * 1024)).toFixed(2) + ' MB'
            });
          } else {
            console.log(`❌ Failed to generate upload URL:`, response.error);
            resolve({ 
              success: false, 
              statusCode: res.statusCode, 
              response,
              fileSize: (fileSize / (1024 * 1024)).toFixed(2) + ' MB'
            });
          }
        } catch (error) {
          console.log(`❌ Failed to parse response:`, error.message);
          console.log(`📄 Raw response:`, data);
          resolve({ 
            success: false, 
            statusCode: res.statusCode, 
            rawResponse: data, 
            error: 'Invalid JSON response',
            fileSize: (fileSize / (1024 * 1024)).toFixed(2) + ' MB'
          });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Request error:`, error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.log(`⏰ Request timeout after 30 seconds`);
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(requestData);
    req.end();
  });
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Testing Direct Upload Functionality');
  console.log('='.repeat(60));
  console.log('This tests the new API that generates upload URLs for Bunny.net');
  console.log('This bypasses Vercel\'s file size limits by uploading directly to Bunny.net');
  console.log('='.repeat(60));
  
  const results = [];
  
  try {
    for (const testFile of CONFIG.testFiles) {
      const result = await testDirectUpload(
        testFile.filename, 
        testFile.size, 
        testFile.contentType
      );
      results.push(result);
      
      // Add a small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    
    results.forEach((result, index) => {
      const testFile = CONFIG.testFiles[index];
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${testFile.filename} (${result.fileSize}): ${status}`);
      
      if (!result.success) {
        console.log(`  Error: ${result.error || result.response?.error || 'Unknown error'}`);
      }
    });
    
    // Analysis
    console.log('\n' + '='.repeat(60));
    console.log('ANALYSIS');
    console.log('='.repeat(60));
    
    const successfulTests = results.filter(r => r.success);
    const failedTests = results.filter(r => !r.success);
    
    if (successfulTests.length === results.length) {
      console.log('🎉 All tests passed! Your direct upload system is working perfectly.');
      console.log('✅ You can now upload files of any size by using the direct upload method.');
      console.log('✅ The 413 error should be resolved for large files.');
    } else if (successfulTests.length > 0) {
      console.log('⚠️ Some tests passed, some failed.');
      console.log(`✅ Successful: ${successfulTests.length}/${results.length}`);
      console.log(`❌ Failed: ${failedTests.length}/${results.length}`);
      
      if (failedTests.some(r => r.statusCode === 413)) {
        console.log('🔍 Some files still getting 413 errors - check your implementation.');
      }
    } else {
      console.log('❌ All tests failed. There might be an issue with your setup.');
      console.log('🔍 Check your Bunny.net configuration and API keys.');
    }
    
    // Recommendations
    console.log('\n' + '='.repeat(60));
    console.log('RECOMMENDATIONS');
    console.log('='.repeat(60));
    
    if (successfulTests.length === results.length) {
      console.log('🚀 Next steps:');
      console.log('1. Update your frontend to use the direct upload method');
      console.log('2. Test with actual large video files');
      console.log('3. Monitor upload performance and success rates');
      console.log('4. Consider adding progress tracking and retry logic');
    } else {
      console.log('🔧 Issues to address:');
      console.log('1. Check your Bunny.net API configuration');
      console.log('2. Verify your environment variables');
      console.log('3. Check Vercel deployment logs');
      console.log('4. Test with smaller files first');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testDirectUpload };
