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
  } else if (role === "INSTITUTION" || role === "INDUSTRY") {
    redirect("/dashboard/organization")
  } else if (role === "ADMIN") {
    redirect("/dashboard/admin")
  } else {
    redirect("/")
  }
}
