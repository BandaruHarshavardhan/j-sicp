import NextAuth, { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      organization?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    organization?: string | null
  }
}
