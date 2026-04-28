#!/usr/bin/env node

/**
 * Test script to verify file upload size limits
 * This script helps diagnose 413 errors and file size restrictions
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  baseUrl: 'https://edunewera.mn',
  endpoint: '/api/admin/upload/video',
  testFileSize: 100 * 1024 * 1024, // 100MB test
  timeout: 300000, // 5 minutes
};

/**
 * Create a test file of specified size
 */
function createTestFile(size, filename = 'test-video.mp4') {
  const filePath = path.join(__dirname, filename);
  
  console.log(`📁 Creating test file: ${filename} (${(size / (1024 * 1024)).toFixed(2)} MB)`);
  
  // Create a buffer of the specified size
  const buffer = Buffer.alloc(size);
  
  // Write some recognizable pattern for testing
  for (let i = 0; i < size; i += 4) {
    buffer.writeUInt32LE(i, i);
  }
  
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ Test file created: ${filePath}`);
  
  return filePath;
}

/**
 * Test file upload with specified file
 */
function testFileUpload(filePath) {
  return new Promise((resolve, reject) => {
    const fileSize = fs.statSync(filePath).size;
    const fileName = path.basename(filePath);
    
    console.log(`🚀 Testing upload for file: ${fileName} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);
    
    // Create form data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    const fileContent = fs.readFileSync(filePath);
    
    const formData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="title"',
      '',
      'Test Video Upload',
      `--${boundary}`,
      'Content-Disposition: form-data; name="description"',
      '',
      'Test video upload for file size limit testing',
      `--${boundary}`,
      `Content-Disposition: form-data; name="videoFile"; filename="${fileName}"`,
      'Content-Type: video/mp4',
      '',
      fileContent,
      `--${boundary}--`
    ].join('\r\n');
    
    const options = {
      hostname: 'edunewera.mn',
      port: 443,
      path: CONFIG.endpoint,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(formData),
        'User-Agent': 'FileUploadTest/1.0',
      },
      timeout: CONFIG.timeout,
    };
    
    const req = https.request(options, (res) => {
      console.log(`📡 Response Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`📋 Response Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`📄 Response Body:`, response);
          
          if (res.statusCode === 200) {
            console.log(`✅ Upload test successful!`);
            resolve({ success: true, statusCode: res.statusCode, response });
          } else if (res.statusCode === 413) {
            console.log(`❌ 413 Content Too Large - File size limit exceeded`);
            resolve({ success: false, statusCode: res.statusCode, response, error: 'File too large' });
          } else {
            console.log(`⚠️ Upload test failed with status: ${res.statusCode}`);
            resolve({ success: false, statusCode: res.statusCode, response });
          }
        } catch (error) {
          console.log(`❌ Failed to parse response:`, error.message);
          console.log(`📄 Raw response:`, data);
          resolve({ success: false, statusCode: res.statusCode, rawResponse: data, error: 'Invalid JSON response' });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Request error:`, error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.log(`⏰ Request timeout after ${CONFIG.timeout}ms`);
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(formData);
    req.end();
  });
}

/**
 * Test different file sizes
 */
async function runTests() {
  console.log('🧪 Starting file upload size limit tests...\n');
  
  try {
    // Test 1: Small file (1MB)
    console.log('='.repeat(50));
    console.log('TEST 1: Small file (1MB)');
    console.log('='.repeat(50));
    
    const smallFile = createTestFile(1 * 1024 * 1024, 'small-test.mp4');
    const smallResult = await testFileUpload(smallFile);
    
    console.log(`\n📊 Small file test result:`, smallResult.success ? 'PASS' : 'FAIL');
    
    // Test 2: Medium file (10MB)
    console.log('\n' + '='.repeat(50));
    console.log('TEST 2: Medium file (10MB)');
    console.log('='.repeat(50));
    
    const mediumFile = createTestFile(10 * 1024 * 1024, 'medium-test.mp4');
    const mediumResult = await testFileUpload(mediumFile);
    
    console.log(`\n📊 Medium file test result:`, mediumResult.success ? 'PASS' : 'FAIL');
    
    // Test 3: Large file (100MB)
    console.log('\n' + '='.repeat(50));
    console.log('TEST 3: Large file (100MB)');
    console.log('='.repeat(50));
    
    const largeFile = createTestFile(100 * 1024 * 1024, 'large-test.mp4');
    const largeResult = await testFileUpload(largeFile);
    
    console.log(`\n📊 Large file test result:`, largeResult.success ? 'PASS' : 'FAIL');
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Small file (1MB): ${smallResult.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Medium file (10MB): ${mediumResult.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Large file (100MB): ${largeResult.success ? '✅ PASS' : '❌ FAIL'}`);
    
    // Cleanup test files
    console.log('\n🧹 Cleaning up test files...');
    [smallFile, mediumFile, largeFile].forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`🗑️ Deleted: ${path.basename(file)}`);
      }
    });
    
    // Recommendations
    console.log('\n' + '='.repeat(50));
    console.log('RECOMMENDATIONS');
    console.log('='.repeat(50));
    
    if (largeResult.statusCode === 413) {
      console.log('❌ Large file uploads are still blocked (413 error)');
      console.log('🔧 You need to update your server configuration:');
      console.log('   - Check nginx/Apache file size limits');
      console.log('   - Contact your hosting provider');
      console.log('   - Update server timeout settings');
    } else if (largeResult.success) {
      console.log('✅ Large file uploads are working!');
      console.log('🎉 Your file size limit issues are resolved.');
    } else {
      console.log('⚠️ Large file uploads failed for other reasons');
      console.log('🔍 Check the error details above for more information');
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

module.exports = { testFileUpload, createTestFile };
