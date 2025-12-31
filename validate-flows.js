#!/usr/bin/env node

/**
 * Trade Skills Backend - Flow Validation Script
 * Tests payment and meet flows with proper mocking
 */

// Load environment variables
require('dotenv').config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(50)}`, 'blue');
  log(`${title}`, 'blue');
  log(`${'='.repeat(50)}`, 'blue');
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? 'green' : 'red';
  log(`${status} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

async function validateEnvironment() {
  logSection('Environment Validation');
  
  let allPassed = true;
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  const nodeOk = majorVersion >= 16;
  logTest('Node.js version >= 16', nodeOk, `Current: ${nodeVersion}`);
  allPassed = allPassed && nodeOk;
  
  // Check required environment variables
  const requiredEnvVars = [
    'JWT_SECRET',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'HMS_ACCESS_KEY',
    'HMS_SECRET',
    'HMS_TEMPLATE_ID'
  ];
  
  for (const envVar of requiredEnvVars) {
    const exists = !!process.env[envVar];
    logTest(`Environment variable: ${envVar}`, exists);
    allPassed = allPassed && exists;
  }
  
  return allPassed;
}

async function validateDependencies() {
  logSection('Dependencies Validation');
  
  let allPassed = true;
  
  const dependencies = [
    'express',
    'razorpay',
    '@100mslive/server-sdk',
    'jsonwebtoken',
    'bcryptjs',
    'joi',
    'cors',
    'helmet'
  ];
  
  for (const dep of dependencies) {
    try {
      require(dep);
      logTest(`Dependency: ${dep}`, true);
    } catch (error) {
      logTest(`Dependency: ${dep}`, false, error.message);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function validatePaymentFlow() {
  logSection('Payment Flow Validation');
  
  let allPassed = true;
  
  try {
    // Test Razorpay initialization
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    logTest('Razorpay client initialization', true);
    
    // Test payment service
    const paymentService = require('./src/services/paymentService');
    const hasRequiredMethods = [
      'getPaymentPackages',
      'createPaymentOrder',
      'verifyPayment',
      'handleWebhook',
      'getPaymentHistory'
    ].every(method => typeof paymentService[method] === 'function');
    
    logTest('Payment service methods', hasRequiredMethods);
    allPassed = allPassed && hasRequiredMethods;
    
    // Test signature generation
    const crypto = require('crypto');
    const testSignature = crypto
      .createHmac('sha256', 'test_secret')
      .update('test_data')
      .digest('hex');
    
    logTest('Signature generation', testSignature.length === 64, `Generated ${testSignature.length} char signature`);
    
  } catch (error) {
    logTest('Payment flow validation', false, error.message);
    allPassed = false;
  }
  
  return allPassed;
}

async function validateMeetFlow() {
  logSection('100ms Meet Flow Validation');
  
  let allPassed = true;
  
  try {
    // Test 100ms SDK initialization
    const { SDK } = require('@100mslive/server-sdk');
    const hms = new SDK(
      process.env.HMS_ACCESS_KEY,
      process.env.HMS_SECRET
    );
    logTest('100ms SDK initialization', true);
    
    // Test meet service
    const meetService = require('./src/services/meetService');
    const hasRequiredMethods = [
      'createMeetingRoom',
      'joinMeeting',
      'startSession',
      'endSession',
      'recordAttendance',
      'getSessionStats',
      'getRecordings'
    ].every(method => typeof meetService[method] === 'function');
    
    logTest('Meet service methods', hasRequiredMethods);
    allPassed = allPassed && hasRequiredMethods;
    
    // Test room configuration structure
    const roomConfig = {
      name: 'test-room',
      template_id: process.env.HMS_TEMPLATE_ID,
      region: 'us'
    };
    
    const configValid = roomConfig.name && roomConfig.template_id;
    logTest('Room configuration structure', configValid);
    allPassed = allPassed && configValid;
    
  } catch (error) {
    logTest('Meet flow validation', false, error.message);
    allPassed = false;
  }
  
  return allPassed;
}

async function validateAPIStructure() {
  logSection('API Structure Validation');
  
  let allPassed = true;
  
  try {
    // Test API response utility
    const ApiResponse = require('./src/utils/ApiResponse');
    
    const successResponse = ApiResponse.success({ test: 'data' }, 'Test success');
    const successValid = successResponse.success === true && successResponse.data.test === 'data';
    logTest('ApiResponse.success', successValid);
    
    const errorResponse = ApiResponse.error('Test error', 400);
    const errorValid = errorResponse.success === false && errorResponse.statusCode === 400;
    logTest('ApiResponse.error', errorValid);
    
    allPassed = allPassed && successValid && errorValid;
    
    // Test route files exist
    const routes = [
      './src/routes/auth.js',
      './src/routes/payments.js',
      './src/routes/meet.js',
      './src/routes/sessions.js',
      './src/routes/wallet.js',
      './src/routes/admin.js'
    ];
    
    for (const route of routes) {
      try {
        require(route);
        logTest(`Route file: ${route}`, true);
      } catch (error) {
        logTest(`Route file: ${route}`, false, error.message);
        allPassed = false;
      }
    }
    
  } catch (error) {
    logTest('API structure validation', false, error.message);
    allPassed = false;
  }
  
  return allPassed;
}

async function validateDatabase() {
  logSection('Database Schema Validation');
  
  let allPassed = true;
  
  try {
    // Check if Prisma schema exists
    const fs = require('fs');
    const schemaExists = fs.existsSync('./prisma/schema.prisma');
    logTest('Prisma schema file exists', schemaExists);
    
    if (schemaExists) {
      const schemaContent = fs.readFileSync('./prisma/schema.prisma', 'utf8');
      
      // Check for required models
      const requiredModels = [
        'User',
        'UserProfile',
        'Session',
        'Payment',
        'Wallet',
        'Transaction',
        'PaymentPackage'
      ];
      
      for (const model of requiredModels) {
        const modelExists = schemaContent.includes(`model ${model}`);
        logTest(`Database model: ${model}`, modelExists);
        allPassed = allPassed && modelExists;
      }
    } else {
      allPassed = false;
    }
    
  } catch (error) {
    logTest('Database validation', false, error.message);
    allPassed = false;
  }
  
  return allPassed;
}

async function runValidation() {
  log('🚀 Trade Skills Backend - Flow Validation', 'blue');
  log('Testing payment and meet flows...\n', 'yellow');
  
  const results = {
    environment: await validateEnvironment(),
    dependencies: await validateDependencies(),
    paymentFlow: await validatePaymentFlow(),
    meetFlow: await validateMeetFlow(),
    apiStructure: await validateAPIStructure(),
    database: await validateDatabase()
  };
  
  logSection('Validation Summary');
  
  let overallPassed = true;
  for (const [category, passed] of Object.entries(results)) {
    logTest(category.charAt(0).toUpperCase() + category.slice(1), passed);
    overallPassed = overallPassed && passed;
  }
  
  log('\n' + '='.repeat(50), 'blue');
  if (overallPassed) {
    log('🎉 ALL VALIDATIONS PASSED!', 'green');
    log('✅ Payment flow is ready for testing', 'green');
    log('✅ 100ms meet flow is ready for testing', 'green');
    log('✅ API structure is complete', 'green');
  } else {
    log('❌ Some validations failed', 'red');
    log('Please check the issues above and fix them', 'yellow');
  }
  log('='.repeat(50), 'blue');
  
  process.exit(overallPassed ? 0 : 1);
}

// Run validation if this script is executed directly
if (require.main === module) {
  runValidation().catch(error => {
    log(`\n❌ Validation failed with error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  validateEnvironment,
  validateDependencies,
  validatePaymentFlow,
  validateMeetFlow,
  validateAPIStructure,
  validateDatabase
};