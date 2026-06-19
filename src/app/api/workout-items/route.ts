import { db } from "@/db";
import { auth } from "@/auth";
import { bodyPart, workoutItem } from "@/db/schema";
import { eq } from "drizzle-orm";

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

export async function POST(req: Request) {
    try {
        const userSession = await auth();
        if (!userSession || !userSession.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        if (!isRecord(body)) {
            return Response.json({ error: "Request body must be an object" }, { status: 400 });
        }

        const itemName = typeof body.itemName === "string" ? body.itemName.trim() : "";
        const partId = Number(body.partId);
        const description =
            typeof body.description === "string" && body.description.trim() !== ""
                ? body.description.trim()
                : null;

        if (!itemName || !Number.isInteger(partId) || partId <= 0) {
            return Response.json({ error: "動作名稱或欄位不可為空" }, { status: 400 })
        }

        const existingBodyPart = await db.query.bodyPart.findFirst({
            where: eq(bodyPart.partId, partId)
        })

        if (!existingBodyPart) {
            return Response.json({ error: "找不到指定的訓練部位" }, { status: 400 })
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

export async function GET() {
    try {
        const items = await db.query.workoutItem.findMany({
            with: {
                bodyPart: true
            }
        });
        return Response.json(items);
    } catch (error) {
        console.error("取得動作清單失敗:", error);
        return Response.json({ error: "無法取得動作清單" }, { status: 500 });
    }
}

