import { db } from '@/db'
import { bodyPart } from '@/db/schema'

export async function GET() {
  try {
    // 簡單查詢確認資料庫連線正常
    const result = await db.select().from(bodyPart).limit(1)
    return Response.json({ status: 'ok', message: '資料庫連線成功！', data: result })
  } catch (error) {
    return Response.json({ status: 'error', message: String(error) }, { status: 500 })
  }
}
