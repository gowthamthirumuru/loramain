/**
 * Database Check Utility
 * Verifies all collections exist and shows record counts
 * 
 * Usage: node seeds/checkDatabase.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import all models to ensure they're registered
const models = {
    Tourist: require('../src/models/Tourist'),
    SOSAlert: require('../src/models/SOSAlert'),
    LocationLog: require('../src/models/LocationLog'),
    Anchor: require('../src/models/Anchor'),
    ResponseTeam: require('../src/models/ResponseTeam'),
    Alert: require('../src/models/Alert'),
    Emergency: require('../src/models/Emergency'),
    Conversation: require('../src/models/Conversation'),
    Message: require('../src/models/Message'),
    Report: require('../src/models/Report'),
    User: require('../src/models/User'),
    AuditLog: require('../src/models/AuditLog'),
    Zone: require('../src/models/Zone')
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tourist_safety');
        console.log('✅ Connected to MongoDB\n');
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        return false;
    }
};

const checkCollections = async () => {
    console.log('📊 DATABASE STATUS REPORT');
    console.log('='.repeat(50));
    console.log('');

    let totalRecords = 0;

    // Check each model
    for (const [name, Model] of Object.entries(models)) {
        try {
            const count = await Model.countDocuments();
            totalRecords += count;

            const status = count > 0 ? '✅' : '⚪';
            const padding = ' '.repeat(20 - name.length);
            console.log(`${status} ${name}${padding} ${count} records`);
        } catch (error) {
            console.log(`❌ ${name}: Error - ${error.message}`);
        }
    }

    console.log('');
    console.log('='.repeat(50));
    console.log(`📈 TOTAL: ${Object.keys(models).length} collections, ${totalRecords} records`);
    console.log('');

    // Show database info
    const db = mongoose.connection.db;
    const stats = await db.stats();
    console.log('💾 DATABASE INFO:');
    console.log(`   Name: ${db.databaseName}`);
    console.log(`   Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Collections: ${stats.collections}`);
    console.log('');
};

const run = async () => {
    const connected = await connectDB();
    if (!connected) process.exit(1);

    await checkCollections();

    await mongoose.connection.close();
    console.log('👋 Done!\n');
};

run();
