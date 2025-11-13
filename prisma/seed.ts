import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

type SeedRole = "EMPLOYEE" | "ADMIN";

async function ensureUser(params: {
  email: string;
  name: string;
  password: string;
  role: SeedRole;
}) {
  const existing = await prisma.user.findUnique({ where: { email: params.email } });
  if (existing) {
    return existing;
  }

  const passwordHash = await hash(params.password, 10);

  return prisma.user.create({
    data: {
      email: params.email,
      name: params.name,
      passwordHash,
      role: params.role,
    },
  });
}

async function main() {
  await ensureUser({
    email: "admin@example.com",
    name: "Admin User",
    password: "Admin123!",
    role: "ADMIN",
  });

  const employee = await ensureUser({
    email: "employee@example.com",
    name: "Employee User",
    password: "Employee123!",
    role: "EMPLOYEE",
  });

  const existingEntries = await prisma.timeEntry.count({
    where: { userId: employee.id },
  });
  // Ensure example time entries exist for the employee. Use find/create per-entry
  // to make the seed idempotent (safe to run multiple times).
  const entries = [
    {
      userId: employee.id,
      workDate: new Date(),
      hoursWorked: "8",
      notes: "Project kickoff",
    },
    {
      userId: employee.id,
      workDate: new Date(Date.now() - 86400000),
      hoursWorked: "7.5",
      notes: "Client follow-up",
    },
  ];

  for (const e of entries) {
    const exists = await prisma.timeEntry.findFirst({
      where: {
        userId: e.userId,
        workDate: e.workDate,
      },
    });

    if (!exists) {
      await prisma.timeEntry.create({ data: e });
    }
  }

  console.log("Seed completed.\nAdmin: admin@example.com / Admin123!\nEmployee: employee@example.com / Employee123!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
