import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function DashboardRedirect() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/auth/login")
  }

  const role = session.user.role

  if (role === "CITIZEN") {
    redirect("/dashboard/citizen")
  } else if (role === "INSTITUTION") {
    redirect("/dashboard/institution")
  } else if (role === "INDUSTRY") {
    redirect("/dashboard/industry")
  } else if (role === "ADMIN") {
    redirect("/dashboard/admin")
  } else {
    redirect("/")
  }
}
