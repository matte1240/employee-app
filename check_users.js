
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.user.count();
    console.log(`User count: ${count}`);
    
    if (count > 0) {
      const user = await prisma.user.findFirst();
      console.log('First user:', user.email, user.role);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
