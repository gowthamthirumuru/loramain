/**
 * Seed Data Script
 * Populates the database with initial test data
 * 
 * Usage: node seeds/seedData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Tourist = require('../src/models/Tourist');
const ResponseTeam = require('../src/models/ResponseTeam');
const Anchor = require('../src/models/Anchor');
const Conversation = require('../src/models/Conversation');
const User = require('../src/models/User');
const Zone = require('../src/models/Zone');

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tourist_safety');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Sample Response Teams
const teams = [
    {
        name: 'Alpha Medical',
        type: 'Medical',
        status: 'available',
        location: 'Main Gate Station',
        members: 4,
        contact: { phone: '+91-9876543210', radio_channel: 'CH-1' },
        leader: { name: 'Dr. Sharma', phone: '+91-9876543211' }
    },
    {
        name: 'Bravo Security',
        type: 'Security',
        status: 'patrol',
        location: 'East Sector',
        members: 6,
        contact: { phone: '+91-9876543220', radio_channel: 'CH-2' },
        leader: { name: 'Officer Singh', phone: '+91-9876543221' }
    },
    {
        name: 'Charlie Rescue',
        type: 'Search & Rescue',
        status: 'available',
        location: 'Base Camp',
        members: 5,
        contact: { phone: '+91-9876543230', radio_channel: 'CH-3' },
        leader: { name: 'Captain Verma', phone: '+91-9876543231' }
    },
    {
        name: 'Delta Aid',
        type: 'Tourist Aid',
        status: 'available',
        location: 'Visitor Center',
        members: 3,
        contact: { phone: '+91-9876543240', radio_channel: 'CH-4' },
        leader: { name: 'Ms. Patel', phone: '+91-9876543241' }
    }
];

// Sample Anchors (LoRa nodes)
const anchors = [
    {
        anchor_id: 'MASTER',
        name: 'Master Node',
        local_position: { x: 0, y: 0 },
        gps_position: { lat: 27.1751, lng: 78.0421 },
        status: 'online',
        is_master: true,
        hardware: { device_type: 'Raspberry Pi 4', lora_module: 'SX126x' }
    },
    {
        anchor_id: 'ANCHOR_2',
        name: 'Relay Node 2',
        local_position: { x: 100, y: 0 },
        gps_position: { lat: 27.1760, lng: 78.0421 },
        status: 'online',
        is_master: false,
        hardware: { device_type: 'Raspberry Pi 4', lora_module: 'SX126x' }
    },
    {
        anchor_id: 'ANCHOR_3',
        name: 'Relay Node 3',
        local_position: { x: 50, y: 86.6 },
        gps_position: { lat: 27.1755, lng: 78.0430 },
        status: 'online',
        is_master: false,
        hardware: { device_type: 'Raspberry Pi 4', lora_module: 'SX126x' }
    }
];

// Sample Tourists
const tourists = [
    {
        name: 'John Smith',
        phone: '+1-555-0101',
        emergency_contact: '+1-555-0102',
        device_id: 'DEV001',
        status: 'active',
        last_location: { lat: 27.1753, lng: 78.0423 }
    },
    {
        name: 'Maria Garcia',
        phone: '+1-555-0201',
        emergency_contact: '+1-555-0202',
        device_id: 'DEV002',
        status: 'active',
        last_location: { lat: 27.1755, lng: 78.0425 }
    },
    {
        name: 'Rajesh Kumar',
        phone: '+91-9876500001',
        emergency_contact: '+91-9876500002',
        device_id: 'DEV003',
        status: 'active',
        last_location: { lat: 27.1758, lng: 78.0420 }
    }
];

// Sample Conversations
const conversations = [
    {
        participant: 'Alpha Medical',
        type: 'radio',
        status: 'active',
        priority: 'high',
        lastMessage: 'Ready for dispatch'
    },
    {
        participant: 'Control Room',
        type: 'radio',
        status: 'active',
        priority: 'medium',
        lastMessage: 'All clear in sector 4'
    }
];

// Sample Zones
const zones = [
    {
        name: 'Main Tourist Area',
        type: 'safe',
        center: { lat: 27.1751, lng: 78.0421 },
        boundary: {
            type: 'Polygon',
            coordinates: [[[78.0410, 27.1740], [78.0432, 27.1740], [78.0432, 27.1762], [78.0410, 27.1762], [78.0410, 27.1740]]]
        },
        color: '#22c55e',
        description: 'Main tourist walking area with full coverage'
    },
    {
        name: 'Restricted Zone A',
        type: 'restricted',
        center: { lat: 27.1780, lng: 78.0450 },
        boundary: {
            type: 'Polygon',
            coordinates: [[[78.0440, 27.1770], [78.0460, 27.1770], [78.0460, 27.1790], [78.0440, 27.1790], [78.0440, 27.1770]]]
        },
        color: '#ef4444',
        alerts: { onEntry: true },
        description: 'Staff only area'
    }
];

// Seed function
const seedDatabase = async () => {
    try {
        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await ResponseTeam.deleteMany({});
        await Anchor.deleteMany({});
        await Tourist.deleteMany({});
        await Conversation.deleteMany({});
        await User.deleteMany({});
        await Zone.deleteMany({});

        // Insert new data
        console.log('📝 Inserting response teams...');
        await ResponseTeam.insertMany(teams);

        console.log('📡 Inserting anchors...');
        await Anchor.insertMany(anchors);

        console.log('🧑 Inserting tourists...');
        await Tourist.insertMany(tourists);

        console.log('💬 Inserting conversations...');
        await Conversation.insertMany(conversations);

        console.log('🗺️  Inserting zones...');
        await Zone.insertMany(zones);

        // Create default admin user
        console.log('👤 Creating admin user...');
        const adminUser = new User({
            username: 'admin',
            email: 'admin@touristsafety.com',
            name: 'System Administrator',
            role: 'admin'
        });
        adminUser.setPassword('admin123'); // Change in production!
        await adminUser.save();

        console.log('\n✅ Database seeded successfully!');
        console.log(`   - ${teams.length} Response Teams`);
        console.log(`   - ${anchors.length} Anchors`);
        console.log(`   - ${tourists.length} Tourists`);
        console.log(`   - ${conversations.length} Conversations`);
        console.log(`   - ${zones.length} Zones`);
        console.log(`   - 1 Admin User (username: admin, password: admin123)`);

    } catch (error) {
        console.error('❌ Error seeding database:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Disconnected from MongoDB');
    }
};

// Run
connectDB().then(seedDatabase);
