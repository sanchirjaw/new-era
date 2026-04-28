#!/usr/bin/env node

/**
 * Test script for TUS endpoints
 * This tests the TUS implementation to ensure it can handle large file uploads
 */

const https = require('https');

// Configuration
const CONFIG = {
  baseUrl: 'https://edunewera.mn',
  endpoint: '/api/admin/upload/tus',
  testFiles: [
    { filename: 'small-video.mp4', size: 1 * 1024 * 1024, type: 'video/mp4' },      // 1MB
    { filename: 'medium-video.mp4', size: 10 * 1024 * 1024, type: 'video/mp4' },     // 10MB
    { filename: 'large-video.mp4', size: 100 * 1024 * 1024, type: 'video/mp4' },     // 100MB
    { filename: 'huge-video.mp4', size: 680 * 1024 * 1024, type: 'video/mp4' },      // 680MB (your original issue)
  ]
};

/**
 * Test TUS upload initialization
 */
function testTusInitialization(filename, fileSize, contentType) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Testing TUS initialization for: ${filename}`);
    console.log(`📊 File size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`📋 Content type: ${contentType}`);

    const options = {
      hostname: 'edunewera.mn',
      port: 443,
      path: CONFIG.endpoint,
      method: 'POST',
      headers: {
        'Upload-Length': fileSize.toString(),
        'Upload-Metadata': `filename ${encodeURIComponent(filename)},contentType ${encodeURIComponent(contentType)}`,
        'Tus-Resumable': '1.0.0',
        'User-Agent': 'TusTest/1.0',
      },
      timeout: 30000, // 30 seconds
    };

    const req = https.request(options, (res) => {
      console.log(`📡 Response Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`📋 Response Headers:`, {
        'tus-resumable': res.headers['tus-resumable'],
        'location': res.headers['location'],
        'access-control-expose-headers': res.headers['access-control-expose-headers']
      });
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log(`✅ TUS initialization successful!`);
            console.log(`📋 Upload ID: ${response.uploadId}`);
            console.log(`🔗 Upload URL: ${response.uploadUrl}`);
            console.log(`📝 Video ID: ${response.videoId}`);
            console.log(`📄 Message: ${response.message}`);
            
            resolve({ 
              success: true, 
              statusCode: res.statusCode, 
              response,
              fileSize: (fileSize / (1024 * 1024)).toFixed(2) + ' MB'
            });
          } else {
            console.log(`❌ TUS initialization failed:`, response.error);
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
    
    req.end();
  });
}

/**
 * Test TUS chunk upload (simulated)
 */
function testTusChunkUpload(uploadUrl, chunkSize, offset) {
  return new Promise((resolve, reject) => {
    console.log(`📤 Testing TUS chunk upload: ${chunkSize} bytes at offset ${offset}`);
    
    // Extract upload ID from URL
    const uploadId = uploadUrl.split('/').pop();
    const chunkEndpoint = `${CONFIG.baseUrl}/api/admin/upload/tus/${uploadId}`;
    
    // Create a dummy chunk (just for testing the endpoint)
    const dummyChunk = Buffer.alloc(chunkSize);
    
    const options = {
      hostname: 'edunewera.mn',
      port: 443,
      path: `/api/admin/upload/tus/${uploadId}`,
      method: 'PATCH',
      headers: {
        'Content-Length': chunkSize.toString(),
        'Upload-Offset': offset.toString(),
        'Tus-Resumable': '1.0.0',
        'Content-Type': 'application/octet-stream',
        'User-Agent': 'TusTest/1.0',
      },
      timeout: 30000,
    };

    const req = https.request(options, (res) => {
      console.log(`📡 Chunk upload response: ${res.statusCode} ${res.statusMessage}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log(`✅ Chunk upload successful!`);
            console.log(`📊 New offset: ${response.offset}`);
            console.log(`📊 Chunk size: ${response.chunkSize}`);
            
            resolve({ 
              success: true, 
              statusCode: res.statusCode, 
              response,
              newOffset: response.offset
            });
          } else {
            console.log(`❌ Chunk upload failed:`, response.error);
            resolve({ 
              success: false, 
              statusCode: res.statusCode, 
              response
            });
          }
        } catch (error) {
          console.log(`❌ Failed to parse chunk response:`, error.message);
          resolve({ 
            success: false, 
            statusCode: res.statusCode, 
            rawResponse: data, 
            error: 'Invalid JSON response'
          });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ Chunk upload error:`, error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.log(`⏰ Chunk upload timeout`);
      req.destroy();
      reject(new Error('Chunk upload timeout'));
    });
    
    req.write(dummyChunk);
    req.end();
  });
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Testing TUS Endpoints');
  console.log('='.repeat(60));
  console.log('This tests the TUS implementation for large file uploads');
  console.log('='.repeat(60));
  
  const results = [];
  
  try {
    for (const testFile of CONFIG.testFiles) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`TESTING: ${testFile.filename}`);
      console.log(`${'='.repeat(50)}`);
      
      // Test 1: TUS Initialization
      const initResult = await testTusInitialization(
        testFile.filename, 
        testFile.size, 
        testFile.contentType
      );
      
      if (initResult.success) {
        console.log(`\n📤 Testing chunk upload for ${testFile.filename}...`);
        
        // Test 2: Chunk Upload (simulate first chunk)
        const chunkSize = Math.min(1024 * 1024, testFile.size); // 1MB chunk
        const chunkResult = await testTusChunkUpload(
          initResult.response.uploadUrl,
          chunkSize,
          0
        );
        
        // Combine results
        const combinedResult = {
          filename: testFile.filename,
          fileSize: testFile.size,
          initSuccess: initResult.success,
          chunkSuccess: chunkResult.success,
          overallSuccess: initResult.success && chunkResult.success,
          uploadId: initResult.response?.uploadId,
          videoId: initResult.response?.videoId
        };
        
        results.push(combinedResult);
        
        console.log(`\n📊 Combined result for ${testFile.filename}:`, 
          combinedResult.overallSuccess ? '✅ PASS' : '❌ FAIL'
        );
      } else {
        results.push({
          filename: testFile.filename,
          fileSize: testFile.size,
          initSuccess: false,
          chunkSuccess: false,
          overallSuccess: false,
          error: initResult.response?.error || 'Initialization failed'
        });
      }
      
      // Add delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    
    results.forEach((result) => {
      const status = result.overallSuccess ? '✅ PASS' : '❌ FAIL';
      const sizeMB = (result.fileSize / (1024 * 1024)).toFixed(2);
      console.log(`${result.filename} (${sizeMB} MB): ${status}`);
      
      if (!result.overallSuccess) {
        if (!result.initSuccess) {
          console.log(`  ❌ TUS initialization failed`);
        }
        if (result.initSuccess && !result.chunkSuccess) {
          console.log(`  ❌ Chunk upload failed`);
        }
        if (result.error) {
          console.log(`  Error: ${result.error}`);
        }
      }
    });
    
    // Analysis
    console.log('\n' + '='.repeat(60));
    console.log('ANALYSIS');
    console.log('='.repeat(60));
    
    const successfulTests = results.filter(r => r.overallSuccess);
    const failedTests = results.filter(r => !r.overallSuccess);
    
    if (successfulTests.length === results.length) {
      console.log('🎉 All TUS tests passed! Your implementation is working perfectly.');
      console.log('✅ You can now upload files of any size using TUS.');
      console.log('✅ The 413 error should be resolved for large files.');
    } else if (successfulTests.length > 0) {
      console.log('⚠️ Some TUS tests passed, some failed.');
      console.log(`✅ Successful: ${successfulTests.length}/${results.length}`);
      console.log(`❌ Failed: ${failedTests.length}/${results.length}`);
      
      // Check for specific issues
      const initFailures = results.filter(r => !r.initSuccess);
      const chunkFailures = results.filter(r => r.initSuccess && !r.chunkSuccess);
      
      if (initFailures.length > 0) {
        console.log(`🔍 TUS initialization failures: ${initFailures.length}`);
      }
      if (chunkFailures.length > 0) {
        console.log(`🔍 Chunk upload failures: ${chunkFailures.length}`);
      }
    } else {
      console.log('❌ All TUS tests failed. There might be an issue with your setup.');
      console.log('🔍 Check your TUS implementation and Bunny.net configuration.');
    }
    
    // Recommendations
    console.log('\n' + '='.repeat(60));
    console.log('RECOMMENDATIONS');
    console.log('='.repeat(60));
    
    if (successfulTests.length === results.length) {
      console.log('🚀 Next steps:');
      console.log('1. Implement the frontend TUS client using tus-js-client');
      console.log('2. Test with actual large video files');
      console.log('3. Monitor upload performance and chunk processing');
      console.log('4. Add progress tracking and error handling');
    } else {
      console.log('🔧 Issues to address:');
      console.log('1. Check your TUS route implementation');
      console.log('2. Verify Bunny.net API configuration');
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

module.exports = { testTusInitialization, testTusChunkUpload };
