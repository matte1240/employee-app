import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendWelcomeSetupEmail } from "@/lib/email";
import { generateResetToken, createVerificationToken, deleteVerificationTokens } from "@/lib/token-utils";
import { findUserByEmail, isAdmin } from "@/lib/user-utils";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["EMPLOYEE", "ADMIN"]),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, role, password } = parsed.data;

    // Check if user already exists
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Determine password to use
    let passwordToHash: string;
    
    if (password) {
      // Manual password provided
      passwordToHash = password;
    } else {
      // Generate a temporary password (8 characters with uppercase, lowercase, and numbers)
      passwordToHash = crypto.randomBytes(4).toString('hex') + 
                       String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Add uppercase letter
    }

    // Hash password
    const passwordHash = await bcrypt.hash(passwordToHash, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // If manual password was provided, skip email sending
    if (password) {
      console.log(`✅ User created with manual password: ${email}`);
      return NextResponse.json(newUser, { status: 201 });
    }

    // Generate reset token
    const { resetToken, hashedToken } = generateResetToken();
    
    // Token expires in 24 hours (longer for first setup)
    await createVerificationToken(email, hashedToken, 24);

    // Send welcome email with setup link
    try {
      const setupUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      
      await sendWelcomeSetupEmail(
        email,
        name,
        setupUrl
      );
      
      console.log(`✅ Welcome email with setup link sent to ${email}`);
    } catch (emailError) {
      console.error("⚠️ Failed to send welcome email:", emailError);
      
      // Cleanup: delete user and token if email fails
      await prisma.user.delete({ where: { id: newUser.id } });
      await deleteVerificationTokens(email);
      
      return NextResponse.json(
        { error: "Failed to send welcome email. User not created." },
        { status: 500 }
      );
    }

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
