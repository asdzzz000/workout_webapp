import { db } from "@/db";
import { workoutItem } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        const { itemName, partId, description } = await req.json();
        if (!itemName || !partId) {
            return Response.json({ error: "動作名稱或欄位不可為空" }, { status: 400 })
        }

        const existingItem = await db.query.workoutItem.findFirst({
            where: eq(workoutItem.itemName, itemName)
        })

        if (existingItem) {
            return Response.json({ error: "此動作已存在" }, { status: 400 })
        }
        const [newItem] = await db.insert(workoutItem).values({ itemName, partId, description }).returning();

        return Response.json({
            message: "新增動作成功",
            item: { id: newItem.itemId, partId: newItem.partId, itemName: newItem.itemName, description: newItem.description }
        })
    } catch (error) {
        console.error("新增動作失敗:", error);
        return Response.json({ error: "動作新增失敗" }, { status: 500 })
    }
}

export async function GET(req: Request) {
    const items = await db.select().from(workoutItem);
    return Response.json(items);
}

