import { db } from "@/db"
import { users } from "@/db/schema"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { email, password, name, account } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const [newUser] = await db.insert(users).values({
      email,
      passwordHash: hashedPassword,
      name,
      account,
    }).returning()

    return NextResponse.json({ 
      message: "User registered successfully", 
      user: { id: newUser.id, email: newUser.email, name: newUser.name } 
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
