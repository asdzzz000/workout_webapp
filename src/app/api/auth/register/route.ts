import { db } from "@/db"
import { users } from "@/db/schema"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { email, password, name, account } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "信箱或密碼不可為空" }, { status: 400 })
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    })

    if (existingUser) {
      return NextResponse.json({ error: "此帳號已存在" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const [newUser] = await db.insert(users).values({
      email,
      passwordHash: hashedPassword,
      name,
      account,
    }).returning()

    return NextResponse.json({
      message: "註冊成功",
      user: { id: newUser.id, email: newUser.email, name: newUser.name, account: newUser.account }
    })
  } catch (error) {
    console.error("註冊失敗:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
