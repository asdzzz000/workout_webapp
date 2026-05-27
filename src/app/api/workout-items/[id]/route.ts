import { db } from "@/db";
import { workoutItem } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const item = await db
        .select()
        .from(workoutItem)
        .where(eq(workoutItem.itemId, Number(id)));

    if (!item) {
        return Response.json({ error: "找不到該動作" }, { status: 404 });
    }

    return Response.json(item);
}
