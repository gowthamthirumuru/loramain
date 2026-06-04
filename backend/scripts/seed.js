
/**
 * Database Seed Script - Prisma/Postgres
 * Creates initial data for development and testing
 * Usage: node scripts/seed.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedDatabase() {
    console.log('🌱 Starting database seed (Prisma/Upsert)...\n');

    try {
        // ============ USERS ============
        console.log('📝 Seeding Users...');

        // Clean up conflicts first to avoid unique constraint errors
        await prisma.user.deleteMany({
            where: {
                OR: [
                    { email: 'admin@touristsafety.com' },
                    { username: 'admin' },
                    { email: 'admin@example.com' },
                    { username: 'admin_test' },
                    { email: 'admin@tourism-safety.gov' },
                    { email: 'supervisor@tourism-safety.gov' },
                    { email: 'officer@tourism-safety.gov' }
                ]
            }
        });
        console.log('   ✓ Cleaned up potential conflicting users');

        const salt = await bcrypt.genSalt(10);
        const adminHash = await bcrypt.hash('Admin123!', salt);
        const testHash = await bcrypt.hash('adminpassword', salt);

        // Demo user passwords (matching frontend)
        const demoAdminHash = await bcrypt.hash('admin123', salt);
        const demoSuperHash = await bcrypt.hash('super123', salt);
        const demoOfficerHash = await bcrypt.hash('officer123', salt);

        await prisma.user.create({
            data: {
                username: 'admin',
                email: 'admin@touristsafety.com',
                name: 'System Administrator',
                role: 'admin',
                status: 'active',
                passwordHash: adminHash
            }
        });
        console.log('   ✓ Admin user created');

        await prisma.user.create({
            data: {
                username: 'admin_test',
                email: 'admin@example.com',
                name: 'Test Administrator',
                role: 'admin',
                status: 'active',
                passwordHash: testHash
            }
        });
        console.log('   ✓ Test Admin created');

        // Demo users for Quick Login buttons
        await prisma.user.create({
            data: {
                username: 'demo_admin',
                email: 'admin@tourism-safety.gov',
                name: 'Demo Admin',
                role: 'admin',
                status: 'active',
                passwordHash: demoAdminHash
            }
        });
        console.log('   ✓ Demo Admin created (admin@tourism-safety.gov)');

        await prisma.user.create({
            data: {
                username: 'demo_supervisor',
                email: 'supervisor@tourism-safety.gov',
                name: 'Demo Supervisor',
                role: 'admin', // Using admin role until supervisor role is defined
                status: 'active',
                passwordHash: demoSuperHash
            }
        });
        console.log('   ✓ Demo Supervisor created');

        await prisma.user.create({
            data: {
                username: 'demo_officer',
                email: 'officer@tourism-safety.gov',
                name: 'Demo Officer',
                role: 'operator',
                status: 'active',
                passwordHash: demoOfficerHash
            }
        });
        console.log('   ✓ Demo Officer created');

        // ============ ZONES ============
        // Zone seeding temporarily disabled due to schema/data mismatch issue
        /*
        console.log('\n📍 Seeding Zones...');
        
        const zones = [
            {
                name: 'Taj Mahal Safe Zone',
                type: 'safe',
                description: 'Main tourist area around Taj Mahal',
                boundary: { type: 'Polygon', coordinates: [[[78.02, 27.16], [78.06, 27.16], [78.06, 27.19], [78.02, 27.19], [78.02, 27.16]]] },
                center: { lat: 27.175, lng: 78.04 },
                isActive: true
            }
        ];

        for (const data of zones) {
             const existing = await prisma.zone.findFirst({ where: { name: data.name } });
             if (!exists) {
                 await prisma.zone.create({ data });
                 console.log(`   ✓ Zone "${data.name}" created`);
             }
        }
        */

        // ============ ANCHORS ============
        console.log('\n📡 Seeding Anchors...');

        const anchors = [
            {
                anchor_id: 'MASTER',
                name: 'Master Gateway',
                local_position: { x: 0, y: 0 },
                gps_position: { lat: 27.1751, lng: 78.0421 },
                is_master: true,
                status: 'online'
            }
        ];

        for (const data of anchors) {
            await prisma.anchor.upsert({
                where: { anchor_id: data.anchor_id },
                update: data,
                create: data
            });
            console.log(`   ✓ Anchor "${data.anchor_id}" upserted`);
        }

        console.log('\n✅ Database seeding complete!\n');

    } catch (error) {
        console.error('❌ Seed error:');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seedDatabase();
