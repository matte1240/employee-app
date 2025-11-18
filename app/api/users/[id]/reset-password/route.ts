import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendPasswordResetLinkEmail } from "@/lib/email";
import { generateResetToken, createVerificationToken, deleteVerificationTokens } from "@/lib/token-utils";
import { findUserById, isAdmin } from "@/lib/user-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { id: userId } = await params;

    // Check if user exists
    const existingUser = await findUserById(userId);

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate reset token
    const { resetToken, hashedToken } = generateResetToken();
    
    // Token expires in 24 hours (admin reset has longer expiry)
    await createVerificationToken(existingUser.email, hashedToken, 24);

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
      await deleteVerificationTokens(existingUser.email);
      
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
