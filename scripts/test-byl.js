#!/usr/bin/env node

// Test script for Byl API integration
// Run with: node scripts/test-byl.js

const fetch = require('node-fetch');

// Configuration - replace with your actual values
const BYL_API_BASE_URL = process.env.BYL_API_BASE_URL || "https://byl.mn/api/v1";
const BYL_PROJECT_ID = process.env.BYL_PROJECT_ID || "your_project_id";
const BYL_API_TOKEN = process.env.BYL_API_TOKEN || "your_api_token";

async function testBylAPI() {
  console.log('🧪 Testing Byl API Integration...\n');

  try {
    // Test 1: Check if we can connect to Byl API
    console.log('1️⃣ Testing API connection...');
    const response = await fetch(`${BYL_API_BASE_URL}/projects/${BYL_PROJECT_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BYL_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ API connection successful');
    } else {
      console.log(`❌ API connection failed: ${response.status} ${response.statusText}`);
      return;
    }

    // Test 2: Create a test invoice
    console.log('\n2️⃣ Testing invoice creation...');
    const invoiceResponse = await fetch(`${BYL_API_BASE_URL}/projects/${BYL_PROJECT_ID}/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BYL_API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 1000,
        description: 'Test invoice from New Era Platform',
        auto_advance: true
      })
    });

    if (invoiceResponse.ok) {
      const invoiceData = await invoiceResponse.json();
      console.log('✅ Invoice created successfully');
      console.log(`   Invoice ID: ${invoiceData.data.id}`);
      console.log(`   Status: ${invoiceData.data.status}`);
      console.log(`   URL: ${invoiceData.data.url}`);
      
      // Test 3: Create a test checkout
      console.log('\n3️⃣ Testing checkout creation...');
      const checkoutResponse = await fetch(`${BYL_API_BASE_URL}/projects/${BYL_PROJECT_ID}/checkouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BYL_API_TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          success_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel',
          items: [
            {
              price_data: {
                unit_amount: 1000,
                product_data: {
                  name: 'Test Course'
                }
              },
              quantity: 1
            }
          ]
        })
      });

      if (checkoutResponse.ok) {
        const checkoutData = await checkoutResponse.json();
        console.log('✅ Checkout created successfully');
        console.log(`   Checkout ID: ${checkoutData.data.id}`);
        console.log(`   Status: ${checkoutData.data.status}`);
        console.log(`   URL: ${checkoutData.data.url}`);
      } else {
        console.log(`❌ Checkout creation failed: ${checkoutResponse.status} ${checkoutResponse.statusText}`);
      }

      // Test 4: Clean up test invoice
      console.log('\n4️⃣ Cleaning up test invoice...');
      const deleteResponse = await fetch(`${BYL_API_BASE_URL}/projects/${BYL_PROJECT_ID}/invoices/${invoiceData.data.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${BYL_API_TOKEN}`,
          'Accept': 'application/json'
        }
      });

      if (deleteResponse.ok) {
        console.log('✅ Test invoice deleted successfully');
      } else {
        console.log(`❌ Failed to delete test invoice: ${deleteResponse.status} ${deleteResponse.statusText}`);
      }

    } else {
      console.log(`❌ Invoice creation failed: ${invoiceResponse.status} ${invoiceResponse.statusText}`);
      const errorData = await invoiceResponse.text();
      console.log(`   Error details: ${errorData}`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n🏁 Byl API test completed');
}

// Run the test
testBylAPI();
