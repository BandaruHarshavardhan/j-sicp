import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const demoTokenCookie = cookieStore.get("demo_reset_token");

  if (!demoTokenCookie || !demoTokenCookie.value) {
    return new NextResponse(
      "Demo token missing or expired. Please request a new password reset.",
      { status: 400 }
    );
  }

  const token = demoTokenCookie.value;

  // Clear the cookie immediately to ensure one-time use for the redirection
  cookieStore.delete("demo_reset_token");

  // Determine base URL dynamically
  const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;
  const redirectUrl = new URL(`/auth/reset-password?token=${token}`, baseUrl);

  return NextResponse.redirect(redirectUrl);
}
