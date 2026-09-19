import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      // Demo fallback check even if user doesn't exist, to prevent timing/response enumeration?
      // Wait, if user doesn't exist, we don't generate a token. We should just return success.
      return NextResponse.json({ success: true }); 
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: { tokenHash, userId: user.id, expiresAt },
    });

    console.log("[Forgot Password] Checking Resend Config...");
    let resendFailed = false;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const appUrl = process.env.NEXTAUTH_URL || "https://j-scip.vercel.app";
      const resetLink = `${appUrl}/auth/reset-password?token=${rawToken}`;
      const sender = process.env.EMAIL_FROM || "J-SCIP <noreply@j-scip.vercel.app>";

      const { data, error: resendError } = await resend.emails.send({
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

      if (resendError) {
        console.error("[Forgot Password] Resend API Error:", {
          name: resendError.name,
          message: resendError.message,
        });
        resendFailed = true;
      } else {
        console.log("[Forgot Password] Resend API Success. Email ID:", data?.id);
      }
    } else {
      resendFailed = true; // No key = failed to send
    }

    // SAFE DEMO MODE FALLBACK
    const isDemoMode = process.env.PASSWORD_RESET_DEMO_MODE === "true";
    const demoEmail = process.env.PASSWORD_RESET_DEMO_EMAIL;
    
    if (isDemoMode && demoEmail && email === demoEmail && resendFailed) {
      console.log("[Forgot Password] Triggering Safe Demo Reset Fallback.");
      
      // Store token in HttpOnly cookie to securely pass it to the redirect route
      const cookieStore = await cookies();
      cookieStore.set({
        name: "demo_reset_token",
        value: rawToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
        path: "/",
      });

      return NextResponse.json({ success: true, isDemoFallback: true });
    }

    // Generic success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
