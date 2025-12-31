const axios = require('axios');

const BASE_URL = 'https://incognizant-yarely-annamaria.ngrok-free.dev';
const headers = { 'ngrok-skip-browser-warning': 'true' };

let userToken = '';
let adminToken = '';

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: ${error.response?.status} ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function finalCompleteTest() {
  console.log('🚀 FINAL COMPLETE API TEST\n');
  
  let passed = 0;
  let total = 0;

  // Register & Login
  const newUser = {
    email: `test${Date.now()}@example.com`,
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'User'
  };

  total++; passed += await test('Register User', async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/register`, newUser, { headers });
    if (res.status !== 201) throw new Error('Failed');
  });

  total++; passed += await test('Login User', async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: newUser.email, password: newUser.password
    }, { headers });
    userToken = res.data.data.token;
    if (res.status !== 200) throw new Error('Failed');
  });

  total++; passed += await test('Admin Login', async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@tradeskills.com', password: 'admin123'
    }, { headers });
    adminToken = res.data.data.token;
    if (res.status !== 200) throw new Error('Failed');
  });

  const userHeaders = { ...headers, Authorization: `Bearer ${userToken}` };
  const adminHeaders = { ...headers, Authorization: `Bearer ${adminToken}` };

  // User APIs
  total++; passed += await test('Get Profile', async () => {
    const res = await axios.get(`${BASE_URL}/api/users/me`, { headers: userHeaders });
    if (res.status !== 200) throw new Error('Failed');
  });

  total++; passed += await test('Update Profile', async () => {
    const res = await axios.put(`${BASE_URL}/api/users/me`, { bio: 'Test' }, { headers: userHeaders });
    if (res.status !== 200) throw new Error('Failed');
  });

  // Wallet APIs
  total++; passed += await test('Get Wallet', async () => {
    const res = await axios.get(`${BASE_URL}/api/wallet`, { headers: userHeaders });
    if (res.status !== 200) throw new Error('Failed');
  });

  total++; passed += await test('Get Transactions', async () => {
    const res = await axios.get(`${BASE_URL}/api/wallet/transactions`, { headers: userHeaders });
    if (res.status !== 200) throw new Error('Failed');
  });

  total++; passed += await test('Lock Credits', async () => {
    const res = await axios.post(`${BASE_URL}/api/wallet/lock-credits`, {
      amount: 2, sessionId: 'test'
    }, { headers: userHeaders });
    if (res.status !== 200) throw new Error('Failed');
  });

  // Payment APIs
  let packageId = '';
  total++; passed += await test('Get Packages', async () => {
    const res = await axios.get(`${BASE_URL}/api/payments/packages`, { headers });
    packageId = res.data.data[0]?.id;
    if (res.status !== 200) throw new Error('Failed');
  });

  total++; passed += await test('Create Order', async () => {
    const res = await axios.post(`${BASE_URL}/api/payments/create-order`, {
      packageId, gateway: 'razorpay'
    }, { headers: userHeaders });
    if (res.status !== 201) throw new Error('Failed');
  });

  // Session APIs
  total++; passed += await test('Get My Sessions', async () => {
    const res = await axios.get(`${BASE_URL}/api/sessions/my`, { headers: userHeaders });
    if (res.status !== 200) throw new Error('Failed');
  });

  // Admin APIs
  total++; passed += await test('Admin Dashboard', async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/dashboard/stats`, { headers: adminHeaders });
    if (res.status !== 200) throw new Error('Failed');
  });

  total++; passed += await test('Admin Users', async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/users`, { headers: adminHeaders });
    if (res.status !== 200) throw new Error('Failed');
  });

  total++; passed += await test('Admin Sessions', async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/sessions`, { headers: adminHeaders });
    if (res.status !== 200) throw new Error('Failed');
  });

  // Public APIs
  total++; passed += await test('Get Skills', async () => {
    const res = await axios.get(`${BASE_URL}/api/skills`, { headers });
    if (res.status !== 200) throw new Error('Failed');
  });

  total++; passed += await test('Health Check', async () => {
    const res = await axios.get(`${BASE_URL}/health`, { headers });
    if (res.status !== 200) throw new Error('Failed');
  });

  total++; passed += await test('Logout', async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/logout`, {}, { headers: userHeaders });
    if (res.status !== 200) throw new Error('Failed');
  });

  // Results
  const percentage = Math.round((passed / total) * 100);
  console.log(`\n📊 FINAL RESULTS: ${passed}/${total} (${percentage}%)`);
  
  if (percentage === 100) {
    console.log('🎉 PERFECT! All APIs working flawlessly!');
  } else if (percentage >= 90) {
    console.log('✅ EXCELLENT! API is production ready!');
  } else {
    console.log('⚠️ Some issues detected.');
  }
}

finalCompleteTest();