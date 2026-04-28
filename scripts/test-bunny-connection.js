#!/usr/bin/env node

/**
 * Test Bunny.net connection and video creation
 */

const { bunnyVideoService } = require('../lib/bunny-video.ts');

async function testBunnyConnection() {
  console.log('🧪 Testing Bunny.net Connection...');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Connection test
    console.log('🔗 Testing connection...');
    const connectionTest = await bunnyVideoService.testConnection();
    
    if (connectionTest) {
      console.log('✅ Connection test successful');
    } else {
      console.log('❌ Connection test failed');
      return;
    }
    
    // Test 2: Direct upload URL generation
    console.log('\n🚀 Testing video entry creation...');
    const videoEntry = await bunnyVideoService.getDirectUploadUrl({
      filename: 'test-video.mp4',
      fileSize: 100 * 1024 * 1024, // 100MB
      contentType: 'video/mp4'
    });
    
    console.log('📋 Video entry result:', videoEntry);
    
    if (videoEntry.success) {
      console.log('✅ Video entry created successfully!');
      console.log(`📝 Video ID: ${videoEntry.videoId}`);
      console.log(`🔗 Upload URL: ${videoEntry.uploadUrl}`);
      
      // Test 3: Clean up - delete the test video
      console.log('\n🗑️ Cleaning up test video...');
      const deleteResult = await bunnyVideoService.deleteVideo(videoEntry.videoId);
      
      if (deleteResult) {
        console.log('✅ Test video deleted successfully');
      } else {
        console.log('⚠️ Failed to delete test video (this is okay)');
      }
      
    } else {
      console.log('❌ Failed to create video entry:', videoEntry.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testBunnyConnection();
}

module.exports = { testBunnyConnection };
