import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "./db"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { users, accounts, sessions, verificationTokens } from "./db/schema"
import { eq } from "drizzle-orm"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string)
        })

        if (!user || !user.passwordHash) return null

        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash)

        if (!isValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      }
    })
  ],

  session: {
    strategy: "jwt"
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      return session
    }
  }
})
