import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Lookup user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // To prevent enumeration, we always return success immediately if the user isn't found.
    // However, if the user doesn't exist, we just skip sending the email.
    if (!user || !user.password) {
      return NextResponse.json({ success: true }); // Assume passwordless or non-existent
    }

    // Generate secure random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    
    // Hash token for database storage
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    
    // Token valid for 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Invalidate any existing tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Save the new hashed token
    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    // Send the email with the raw token
    // If RESEND_API_KEY is not configured, we just return success without sending email in dev (to prevent crash)
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const appUrl = process.env.NEXTAUTH_URL || "https://j-scip.vercel.app";
      const resetLink = `${appUrl}/auth/reset-password?token=${rawToken}`;
      const sender = process.env.EMAIL_FROM || "J-SCIP <noreply@j-scip.vercel.app>";

      await resend.emails.send({
        from: sender,
        to: email,
        subject: "Reset your J-SCIP password",
        html: `
          <p>Hello,</p>
          <p>Someone requested a password reset for your J-SCIP account.</p>
          <p>Click the link below to reset your password. This link is valid for 1 hour.</p>
          <p><a href="${resetLink}">Reset Password</a></p>
          <p>If you did not request this, you can safely ignore this email.</p>
        `,
      });
    }

    // Generic success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
