
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const users = await prisma.user.findMany();
        console.log('Users found:', users.length);
        users.forEach(u => console.log(` - ${u.username} (${u.email})`));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
