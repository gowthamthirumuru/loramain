const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Demo users from LoginPage.tsx
    const demoUsers = [
        {
            username: 'admin',
            email: 'admin@tourism-safety.gov',
            password: 'admin123',
            name: 'System Administrator',
            role: 'admin',
            phone: '+91 9876543210'
        },
        {
            username: 'supervisor',
            email: 'supervisor@tourism-safety.gov',
            password: 'super123',
            name: 'Zone Supervisor',
            role: 'operator',
            phone: '+91 9876543211'
        },
        {
            username: 'officer',
            email: 'officer@tourism-safety.gov',
            password: 'officer123',
            name: 'Field Officer',
            role: 'operator',
            phone: '+91 9876543212'
        }
    ];

    for (const user of demoUsers) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(user.password, salt);

        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
                username: user.username,
                email: user.email,
                passwordHash,
                salt,
                name: user.name,
                role: user.role,
                phone: user.phone,
                status: 'active'
            }
        });

        console.log(`✅ Created/Updated user: ${user.email}`);
    }

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
