import { db } from "@/db";
import { workoutItem } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const itemId = Number(id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
        return Response.json({ error: "動作 ID 格式不正確" }, { status: 400 });
    }

    const item = await db
        .select()
        .from(workoutItem)
        .where(eq(workoutItem.itemId, itemId));

    if (item.length === 0) {
        return Response.json({ error: "找不到該動作" }, { status: 404 });
    }

    return Response.json(item);
}
