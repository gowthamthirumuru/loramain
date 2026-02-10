const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function runTests() {
    console.log('🚀 Starting Resilience Tests...');

    // 1. Test 404 Handling
    try {
        console.log('\nTesting 404 Handling...');
        await axios.get(`${BASE_URL}/api/nonexistent-route`);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log('✅ 404 handled correctly:', error.response.data);
        } else {
            console.error('❌ 404 test failed:', error.message);
        }
    }

    // 2. Test Validation Error
    try {
        console.log('\nTesting Validation Error (Invalid Email)...');
        await axios.post(`${BASE_URL}/api/auth/register`, {
            name: 'Test',
            email: 'invalid-email',
            password: 'password123'
        });
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log('✅ Validation handled correctly:', error.response.data);
        } else {
            console.error('❌ Validation test failed:', error.message);
        }
    }

    // 3. Test Rate Limiting (Auth)
    console.log('\nTesting Rate Limiting (Auth Endpoint)...');
    console.log('Sending excessive requests...');

    let rateLimitHit = false;
    // Limit is 100 in dev, so we need >100. Let's try 110.
    // Note: This might take a few seconds.
    const requests = [];
    for (let i = 0; i < 110; i++) {
        requests.push(
            axios.post(`${BASE_URL}/api/auth/login`, {
                email: `test${i}@example.com`,
                password: 'password'
            }).catch(err => err) // Catch potential connection errors or 400s
        );
    }

    const results = await Promise.all(requests);

    for (const res of results) {
        if (res.response && res.response.status === 429) {
            rateLimitHit = true;
            console.log('✅ Rate limit hit:', res.response.data);
            break;
        }
    }

    if (!rateLimitHit) {
        console.error('❌ Rate limit NOT hit (Make sure limit is low enough or we sent enough requests)');
    }

}

runTests().catch(err => console.error('Test runner failed:', err));
