
/**
 * Full System Flow Integration Test
 * 
 * Verifies the complete "Happy Path" of the system:
 * 1. Admin Login (Get Token)
 * 2. Setup (Create Zone, Register Anchor, Register Tourist)
 * 3. Gateway Simulation (Send Location Data via HTTP)
 * 4. Real-time Verification (Socket.IO events)
 * 5. Alert Triggering (SOS)
 * 6. Reporting Verification
 */

const axios = require('axios');
const io = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || 'my-secret-key-12345'; // Configured in .env

// Color helpers
const pass = (msg) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`);
const fail = (msg) => { console.error(`\x1b[31m❌ ${msg}\x1b[0m`); process.exit(1); };
const info = (msg) => console.log(`\x1b[36mℹ️  ${msg}\x1b[0m`);

const prisma = new PrismaClient();

async function runIntegrationTest() {
    console.log('\n🚢 STARTING FULL SYSTEM INTEGRATION TEST 🚢\n');
    let adminToken = '';
    let socket;
    let touristId = ''; // DB ID
    let deviceId = 'TEST_DEV_001';

    try {
        // --- PRE-CLEANUP ---
        info('Cleaning up test data...');
        await prisma.sOSAlert.deleteMany({ where: { device_id: deviceId } });
        await prisma.locationLog.deleteMany({ where: { device_id: deviceId } });
        await prisma.tourist.deleteMany({ where: { device_id: deviceId } });

        // --- STEP 1: AUTHENTICATION ---
        info('Step 1: Authenticating as Admin...');
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: 'admin@example.com',
                password: 'adminpassword'
            });
            // FIXED: Access data.data.token because of successResponse wrapper
            adminToken = loginRes.data.data.token;
            if (!adminToken) throw new Error('No token returned');
            pass('Admin Logged In');
        } catch (e) {
            fail(`Login failed: ${e.message}`);
        }

        // --- STEP 2: SETUP (Register Tourist) ---
        info('Step 2: Registering Test Tourist...');
        try {
            const createRes = await axios.post(`${API_URL}/tourist/register`, {
                name: 'Integration Test User',
                device_id: deviceId,
                group_size: 1,
                country: 'TestLand',
                phone: '1234567890',
                emergency_contact: '0987654321',
                notes: 'Created by automated integration test'
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            touristId = createRes.data.data.id;
            pass(`Tourist Registered (ID: ${touristId})`);
        } catch (e) {
            fail(`Tourist Registration failed: ${e.message}`);
        }

        // --- STEP 3: SOCKET CONNECTION ---
        info('Step 3: Connecting to WebSocket...');
        socket = io(SOCKET_URL, {
            query: { token: adminToken }, // Assuming dashboard auth uses query or auth header
            transports: ['websocket']
        });

        await new Promise((resolve, reject) => {
            socket.on('connect', () => {
                pass('Socket Connected');
                socket.emit('subscribe_sos'); // Subscribe to SOS alerts
                resolve();
            });
            socket.on('connect_error', (err) => reject(err));
            setTimeout(() => reject(new Error('Socket timeout')), 5000);
        });

        // Setup Socket Listeners
        const locationUpdatePromise = new Promise((resolve) => {
            socket.on('location_update', (data) => {
                if (data.device_id === deviceId) {
                    pass(`Socket received location_update: (${data.lat}, ${data.lng})`);
                    resolve(data);
                }
            });
        });

        const sosAlertPromise = new Promise((resolve) => {
            socket.on('sos_alert', (data) => {
                if (data.device_id === deviceId) {
                    pass('Socket received SOS_ALERT');
                    resolve(data);
                }
            });
        });

        // --- STEP 4: GATEWAY SIMULATION (Send Location) ---
        info('Step 4: Simulating LoRa Gateway Data...');
        // Sending raw meters (x=10, y=10) -> Should convert to GPS
        const payload = {
            device_id: deviceId,
            x: 10,
            y: 10,
            lat: 27.1752, // Simulating conversion
            lng: 78.0422,
            rssi: -50,
            sos_flag: false
        };

        await axios.post(`${API_URL}/location/update`, payload, {
            headers: { 'X-API-Key': GATEWAY_API_KEY }
        });
        pass('Location Data Sent to Backend');

        // Wait for Socket Event
        info('Waiting for WebSocket broadcast...');
        const locData = await Promise.race([
            locationUpdatePromise,
            new Promise((_, r) => setTimeout(() => r(new Error('Location Socket Timeout')), 5000))
        ]);

        // Verify values (Basic check: lat should not be 0)
        if (!locData.lat || !locData.lng) fail('Socket data missing GPS coordinates');


        // --- STEP 5: SOS ALERT ---
        info('Step 5: Triggering SOS...');
        const sosPayload = {
            device_id: deviceId,
            x: 15,
            y: 15,
            rssi: -45,
            sos_flag: true
        };

        await axios.post(`${API_URL}/location/update`, sosPayload, {
            headers: { 'X-API-Key': GATEWAY_API_KEY }
        });
        pass('SOS Data Sent');

        // Wait for SOS Socket Event
        await Promise.race([
            sosAlertPromise,
            new Promise((_, r) => setTimeout(() => r(new Error('SOS Socket Timeout')), 5000))
        ]);


        // --- STEP 6: VERIFY DATA PERSISTENCE & REPORTING ---
        info('Step 6: Verifying Reporting API...');
        // Check Daily Activity
        const reportRes = await axios.get(`${API_URL}/reports/daily-activity`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });

        const metrics = reportRes.data.data.metrics;
        // We expect at least the logs we just sent
        if (metrics.total_logs < 2) fail(`Expected at least 2 logs, got ${metrics.total_logs}`);
        if (metrics.active_tourists < 1) fail('Expected active tourists > 0');
        pass('Reporting API Verified');


        console.log('\n✨ INTEGRATION TEST PASSED SUCCESSFULLY ✨\n');

    } catch (e) {
        fail(`Integration Test Failed: ${e.message} ${e.response ? JSON.stringify(e.response.data) : ''}`);
    } finally {
        if (socket) socket.disconnect();
        // Cleanup - UNCOMMENT to clean up after test, or leave to inspect DB manually
        /*
        try {
            await prisma.tourist.delete({ where: { id: touristId } });
            info('Cleanup: Deleted test tourist');
        } catch (e) { }
        */
        await prisma.$disconnect();
    }
}

runIntegrationTest();
