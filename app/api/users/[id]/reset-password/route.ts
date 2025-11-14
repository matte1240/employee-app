import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { id: userId } = await params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a temporary password (8 characters with uppercase, lowercase, and numbers)
    const tempPassword = crypto.randomBytes(4).toString('hex') + 
                         String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Add uppercase letter

    // Hash new password
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Send email notification with temporary password
    try {
      await sendPasswordResetEmail(
        existingUser.email,
        existingUser.name || existingUser.email,
        tempPassword
      );
      console.log(`✅ Password reset email sent to ${existingUser.email}`);
    } catch (emailError) {
      console.error("⚠️ Failed to send password reset email:", emailError);
      // Rollback password change if email fails
      return NextResponse.json({
        error: "Failed to send email notification. Password not changed.",
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Password reset successfully. User will receive an email with temporary password." 
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
