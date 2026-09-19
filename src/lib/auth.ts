import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        const email = credentials.email as string
        const password = credentials.password as string

        // SIH Demo Government Login Logic
        const demoEmail = process.env.DEMO_GOVERNMENT_EMAIL
        const demoPassword = process.env.DEMO_GOVERNMENT_PASSWORD

        if (demoEmail && demoPassword && email === demoEmail) {
          if (password === demoPassword) {
            let dbUser = await prisma.user.findUnique({
              where: { email: demoEmail }
            })
            
            if (!dbUser) {
              const hashedPassword = await bcrypt.hash(demoPassword, 10)
              dbUser = await prisma.user.create({
                data: {
                  email: demoEmail,
                  name: "Government Official",
                  role: "ADMIN",
                  password: hashedPassword
                }
              })
            } else if (dbUser.role !== "ADMIN") {
              dbUser = await prisma.user.update({
                where: { email: demoEmail },
                data: { role: "ADMIN" }
              })
            }
            
            return {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              role: dbUser.role,
            }
          } else {
            // Reject incorrect password for the demo account immediately
            return null
          }
        }

        // Standard user flow
        const user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // If `user` is provided, it's the initial sign-in phase.
      if (user) {
        if (account?.provider === "google" && user.email) {
          // Identify user by email in PostgreSQL
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          })
          
          // If the user doesn't exist, securely create them with the default CITIZEN role
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || "",
                image: user.image || "",
                role: "CITIZEN",
              }
            })
          }
          
          // Attach database role and ID to token
          token.role = dbUser.role
          token.id = dbUser.id
        } else {
          // Credentials login already populated user.role
          token.role = user.role
          token.id = user.id
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    }
  },
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/login",
  }
})
