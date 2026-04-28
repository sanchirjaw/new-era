#!/usr/bin/env node

/**
 * Simple TUS test to verify the endpoint is working
 */

const https = require('https');

console.log('🧪 Testing TUS endpoint...');

const testData = {
  filename: 'test-video.mp4',
  fileSize: 100 * 1024 * 1024, // 100MB
  contentType: 'video/mp4'
};

const options = {
  hostname: 'edunewera.mn',
  port: 443,
  path: '/api/admin/upload/tus',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Upload-Length': testData.fileSize.toString(),
    'Upload-Metadata': `filename ${encodeURIComponent(testData.filename)},contentType ${encodeURIComponent(testData.contentType)}`,
    'Tus-Resumable': '1.0.0',
    'User-Agent': 'TusTest/1.0',
  },
  timeout: 30000,
};

console.log(`📤 Testing TUS initialization for ${testData.filename} (${(testData.fileSize / (1024 * 1024)).toFixed(2)} MB)`);

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
        console.log('\n🎉 Your TUS endpoint is working correctly!');
      } else {
        console.log(`❌ TUS initialization failed:`, response.error);
        console.log(`📄 Full response:`, response);
      }
    } catch (error) {
      console.log(`❌ Failed to parse response:`, error.message);
      console.log(`📄 Raw response:`, data);
    }
  });
});

req.on('error', (error) => {
  console.log(`❌ Request error:`, error.message);
});

req.on('timeout', () => {
  console.log(`⏰ Request timeout after 30 seconds`);
  req.destroy();
});

req.end();
