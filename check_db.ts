import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetDateStart = new Date('2025-12-01T00:00:00.000Z');
  const targetDateEnd = new Date('2025-12-01T23:59:59.999Z');

  console.log('Checking TimeEntries for 2025-12-01...');
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      workDate: {
        gte: targetDateStart,
        lte: targetDateEnd,
      },
    },
    include: {
        user: {
            select: { name: true, email: true }
        }
    }
  });
  console.log(JSON.stringify(timeEntries, null, 2));

  console.log('\nChecking LeaveRequests covering 2025-12-01...');
  const leaveRequests = await prisma.leaveRequest.findMany({
    where: {
      OR: [
        {
            startDate: { lte: targetDateEnd },
            endDate: { gte: targetDateStart }
        }
      ]
    },
    include: {
        user: {
            select: { name: true, email: true }
        }
    }
  });
  console.log(JSON.stringify(leaveRequests, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
