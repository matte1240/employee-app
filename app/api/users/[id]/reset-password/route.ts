import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendPasswordResetLinkEmail } from "@/lib/email";

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

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    // Token expires in 24 hours (admin reset has longer expiry)
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Delete any existing reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: existingUser.email },
    });

    // Create new reset token
    await prisma.verificationToken.create({
      data: {
        identifier: existingUser.email,
        token: hashedToken,
        expires,
      },
    });

    // Send email with reset link
    try {
      const resetUrl = `${process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}&email=${encodeURIComponent(existingUser.email)}`;
      
      await sendPasswordResetLinkEmail(
        existingUser.email,
        existingUser.name || existingUser.email,
        resetUrl
      );
      
      console.log(`✅ Password reset email sent to ${existingUser.email}`);
    } catch (emailError) {
      console.error("⚠️ Failed to send password reset email:", emailError);
      
      // Cleanup token if email fails
      await prisma.verificationToken.deleteMany({
        where: { identifier: existingUser.email },
      });
      
      return NextResponse.json({
        error: "Failed to send email notification. Password reset not initiated.",
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Email di reset password inviata con successo all'utente." 
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
