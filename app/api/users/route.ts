import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { findUserByEmail, isAdmin } from "@/lib/user-utils";

type UserRole = "EMPLOYEE" | "ADMIN";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  createdAt: Date;
};

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(64),
  role: z.enum(["EMPLOYEE", "ADMIN"]).default("EMPLOYEE"),
});

export async function GET() {
  const session = await getAuthSession();

  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [users, totals] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }) as Promise<UserRow[]>,
    prisma.timeEntry.groupBy({
      by: ["userId"],
      _sum: { hoursWorked: true },
    }),
  ]);

  const totalsMap = new Map<string, number>();

  for (const item of totals) {
    const total = item._sum.hoursWorked;
    totalsMap.set(item.userId, total ? parseFloat(total.toString()) : 0);
  }

  const payload = users.map((user) => ({
    ...user,
    totalHours: totalsMap.get(user.id) ?? 0,
  }));

  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = createUserSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await findUserByEmail(parsed.data.email);

  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: await hash(parsed.data.password, 10),
      role: parsed.data.role,
    },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
