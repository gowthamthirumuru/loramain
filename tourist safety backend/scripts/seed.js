/**
 * Database Seed Script
 * Creates initial data for development and testing
 * 
 * Usage: node scripts/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../src/models/User');
const Zone = require('../src/models/Zone');
const Anchor = require('../src/models/Anchor');
const Tourist = require('../src/models/Tourist');
const ResponseTeam = require('../src/models/ResponseTeam');

// Database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tourist_safety';

async function seedDatabase() {
    console.log('🌱 Starting database seed...\n');

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // ============ USERS ============
        console.log('📝 Seeding Users...');

        const existingAdmin = await User.findOne({ email: 'admin@touristsafety.com' });
        if (!existingAdmin) {
            const adminUser = new User({
                username: 'admin',
                email: 'admin@touristsafety.com',
                name: 'System Administrator',
                role: 'admin',
                status: 'active'
            });
            adminUser.setPassword('Admin123!');
            await adminUser.save();
            console.log('   ✓ Admin user created');
        } else {
            console.log('   - Admin user exists, skipping');
        }

        const existingOperator = await User.findOne({ email: 'operator@touristsafety.com' });
        if (!existingOperator) {
            const operatorUser = new User({
                username: 'operator',
                email: 'operator@touristsafety.com',
                name: 'System Operator',
                role: 'operator',
                status: 'active'
            });
            operatorUser.setPassword('Operator123!');
            await operatorUser.save();
            console.log('   ✓ Operator user created');
        } else {
            console.log('   - Operator user exists, skipping');
        }

        // Test user for development
        const existingTest = await User.findOne({ email: 'test@example.com' });
        if (!existingTest) {
            const testUser = new User({
                username: 'testuser',
                email: 'test@example.com',
                name: 'Test User',
                role: 'admin',
                status: 'active'
            });
            testUser.setPassword('Test123!Pass');
            await testUser.save();
            console.log('   ✓ Test user created (test@example.com / Test123!Pass)');
        } else {
            console.log('   - Test user exists, skipping');
        }

        // ============ ZONES ============
        console.log('\n📍 Seeding Zones...');

        const zones = [
            {
                name: 'Taj Mahal Safe Zone',
                type: 'safe',
                description: 'Main tourist area around Taj Mahal',
                boundary: {
                    type: 'Polygon',
                    coordinates: [[[78.02, 27.16], [78.06, 27.16], [78.06, 27.19], [78.02, 27.19], [78.02, 27.16]]]
                },
                center: { lat: 27.175, lng: 78.04 },
                isActive: true
            },
            {
                name: 'Yamuna River Danger Zone',
                type: 'danger',
                description: 'River bank - risk of drowning',
                boundary: {
                    type: 'Polygon',
                    coordinates: [[[78.01, 27.15], [78.04, 27.15], [78.04, 27.17], [78.01, 27.17], [78.01, 27.15]]]
                },
                center: { lat: 27.16, lng: 78.025 },
                isActive: true
            },
            {
                name: 'Construction Area',
                type: 'restricted',
                description: 'Active construction - no entry',
                boundary: {
                    type: 'Polygon',
                    coordinates: [[[78.05, 27.18], [78.07, 27.18], [78.07, 27.20], [78.05, 27.20], [78.05, 27.18]]]
                },
                center: { lat: 27.19, lng: 78.06 },
                isActive: true
            }
        ];

        for (const zoneData of zones) {
            const exists = await Zone.findOne({ name: zoneData.name });
            if (!exists) {
                await Zone.create(zoneData);
                console.log(`   ✓ Zone "${zoneData.name}" created`);
            } else {
                console.log(`   - Zone "${zoneData.name}" exists, skipping`);
            }
        }

        // ============ ANCHORS ============
        console.log('\n📡 Seeding Anchor Nodes...');

        const anchors = [
            {
                anchor_id: 'MASTER',
                name: 'Master Gateway',
                local_position: { x: 0, y: 0 },
                gps_position: { lat: 27.1751, lng: 78.0421 },
                is_master: true,
                status: 'online'
            },
            {
                anchor_id: 'ANCHOR_2',
                name: 'Relay Node 2',
                local_position: { x: 50, y: 0 },
                gps_position: { lat: 27.1755, lng: 78.0425 },
                is_master: false,
                status: 'online'
            },
            {
                anchor_id: 'ANCHOR_3',
                name: 'Relay Node 3',
                local_position: { x: 25, y: 43 },
                gps_position: { lat: 27.1760, lng: 78.0423 },
                is_master: false,
                status: 'online'
            }
        ];

        for (const anchorData of anchors) {
            const exists = await Anchor.findOne({ anchor_id: anchorData.anchor_id });
            if (!exists) {
                await Anchor.create(anchorData);
                console.log(`   ✓ Anchor "${anchorData.anchor_id}" created`);
            } else {
                console.log(`   - Anchor "${anchorData.anchor_id}" exists, skipping`);
            }
        }

        // ============ DEMO TOURISTS ============
        console.log('\n👤 Seeding Demo Tourists...');

        const tourists = [
            {
                name: 'John Smith',
                email: 'john@example.com',
                phone: '+1-555-0101',
                emergency_contact: '+1-555-0102',
                emergency_contact_name: 'Jane Smith',
                device_id: 'DEV001',
                nationality: 'USA',
                group_size: 2,
                status: 'active',
                last_location: { x: 25, y: 15, lat: 27.1751, lng: 78.0421 }
            },
            {
                name: 'Maria Garcia',
                email: 'maria@example.com',
                phone: '+34-555-0201',
                emergency_contact: '+34-555-0202',
                emergency_contact_name: 'Carlos Garcia',
                device_id: 'DEV002',
                nationality: 'Spain',
                group_size: 4,
                status: 'active',
                last_location: { x: 40, y: 30, lat: 27.1755, lng: 78.0428 }
            }
        ];

        for (const touristData of tourists) {
            const exists = await Tourist.findOne({ device_id: touristData.device_id });
            if (!exists) {
                await Tourist.create(touristData);
                console.log(`   ✓ Tourist "${touristData.name}" (${touristData.device_id}) created`);
            } else {
                console.log(`   - Tourist "${touristData.name}" exists, skipping`);
            }
        }

        // ============ RESPONSE TEAMS ============
        console.log('\n🚑 Seeding Response Teams...');

        const teams = [
            {
                name: 'Alpha Team',
                type: 'Search & Rescue',
                members: 4,
                location: 'Command Center',
                status: 'available'
            },
            {
                name: 'Bravo Team',
                type: 'Medical',
                members: 3,
                location: 'East Gate',
                status: 'available'
            },
            {
                name: 'Charlie Team',
                type: 'Security',
                members: 5,
                location: 'South Perimeter',
                status: 'available'
            }
        ];

        for (const teamData of teams) {
            const exists = await ResponseTeam.findOne({ name: teamData.name });
            if (!exists) {
                await ResponseTeam.create(teamData);
                console.log(`   ✓ Team "${teamData.name}" created`);
            } else {
                console.log(`   - Team "${teamData.name}" exists, skipping`);
            }
        }

        console.log('\n✅ Database seeding complete!\n');
        console.log('📋 Summary:');
        console.log(`   - Users: ${await User.countDocuments()}`);
        console.log(`   - Zones: ${await Zone.countDocuments()}`);
        console.log(`   - Anchors: ${await Anchor.countDocuments()}`);
        console.log(`   - Tourists: ${await Tourist.countDocuments()}`);
        console.log(`   - Teams: ${await ResponseTeam.countDocuments()}`);

    } catch (error) {
        console.error('❌ Seed error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the seed
seedDatabase();
