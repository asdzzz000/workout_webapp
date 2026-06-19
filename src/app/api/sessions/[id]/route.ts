import { db } from "@/db";
import { workoutSession, sessionExercise, exerciseSet, workoutItem } from "@/db/schema";
import { auth } from "@/auth";
import { eq, inArray } from "drizzle-orm";
import { parseSessionPayload, PayloadValidationError } from "../payload";

// GET /api/sessions/[id]：取得單次訓練的完整詳細資料（含動作與組數）
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = await auth();
    if (!userSession || !userSession.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const session = await db.query.workoutSession.findFirst({
      where: eq(workoutSession.sessionId, id),
      with: {
        exercises: {
          orderBy: (exercises, { asc }) => [asc(exercises.orderNum)],
          with: {
            workoutItem: {
              with: {
                bodyPart: true,
              }
            },
            sets: {
              orderBy: (sets, { asc }) => [asc(sets.setNumber)],
            },
          }
        }
      }
    });

    if (!session) {
      return Response.json({ error: "Workout session not found" }, { status: 404 });
    }

    if (session.userId !== userSession.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json(session);
  } catch (error) {
    console.error("Failed to fetch session detail:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/sessions/[id]：刪除單次訓練紀錄
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = await auth();
    if (!userSession || !userSession.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    // 先確認該訓練紀錄存在且屬於當前使用者
    const session = await db.query.workoutSession.findFirst({
      where: eq(workoutSession.sessionId, id),
    });

    if (!session) {
      return Response.json({ error: "Workout session not found" }, { status: 404 });
    }

    if (session.userId !== userSession.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // 子層的動作與組數由資料庫 ON DELETE CASCADE 自動刪除
    await db
      .delete(workoutSession)
      .where(eq(workoutSession.sessionId, id));

    return Response.json({ message: "訓練紀錄已成功刪除" });
  } catch (error) {
    console.error("Failed to delete session:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/sessions/[id]：修改已存檔的訓練紀錄
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userSession = await auth();
    if (!userSession || !userSession.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const payload = parseSessionPayload(body);

    // 1. 確認該訓練紀錄存在且屬於當前使用者
    const existingSession = await db.query.workoutSession.findFirst({
      where: eq(workoutSession.sessionId, id),
    });

    if (!existingSession) {
      return Response.json({ error: "Workout session not found" }, { status: 404 });
    }

    if (existingSession.userId !== userSession.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const itemIds = Array.from(new Set(payload.exercises.map((ex) => ex.itemId)));
    const existingItems = await db
      .select({ itemId: workoutItem.itemId })
      .from(workoutItem)
      .where(inArray(workoutItem.itemId, itemIds));

    if (existingItems.length !== itemIds.length) {
      return Response.json({ error: "Workout item not found" }, { status: 400 });
    }

    // 2. 讀取資料庫中目前已有的 exercises 與 sets，用來比對傳入資料進行增刪改
    const dbExercises = await db.query.sessionExercise.findMany({
      where: eq(sessionExercise.sessionId, id),
      with: {
        sets: true,
      },
    });

    const dbExerciseIds = dbExercises.map((e) => e.exerciseId);
    const dbSetIds = dbExercises.flatMap((e) => e.sets.map((s) => s.setId));
    const dbExerciseById = new Map(dbExercises.map((exercise) => [exercise.exerciseId, exercise]));
    const dbSetById = new Map(
      dbExercises.flatMap((exercise) =>
        exercise.sets.map((set) => [set.setId, { ...set, exerciseId: exercise.exerciseId }])
      )
    );

    for (const ex of payload.exercises) {
      if (ex.exerciseId && !dbExerciseById.has(ex.exerciseId)) {
        return Response.json({ error: "Exercise does not belong to this session" }, { status: 400 });
      }

      for (const set of ex.sets) {
        if (!set.setId) continue;

        const existingSet = dbSetById.get(set.setId);
        if (!existingSet) {
          return Response.json({ error: "Set does not belong to this session" }, { status: 400 });
        }

        if (ex.exerciseId && existingSet.exerciseId !== ex.exerciseId) {
          return Response.json({ error: "Set does not belong to the provided exercise" }, { status: 400 });
        }
      }
    }

    // 3. 只在基本欄位真的變更時更新 session
    if (
      existingSession.title !== payload.title ||
      existingSession.sessionDate !== payload.sessionDate ||
      existingSession.notes !== payload.notes
    ) {
      await db
        .update(workoutSession)
        .set({
          title: payload.title,
          sessionDate: payload.sessionDate,
          notes: payload.notes,
        })
        .where(eq(workoutSession.sessionId, id));
    }

    const incomingExerciseIds: string[] = [];
    const incomingSetIds: string[] = [];

    // 4. 比對並更新/寫入傳入的 exercises 與 sets
    for (const ex of payload.exercises) {
      let exId = ex.exerciseId;

      if (exId) {
        const existingExercise = dbExerciseById.get(exId);

        if (
          existingExercise &&
          (existingExercise.itemId !== ex.itemId || existingExercise.orderNum !== ex.orderNum)
        ) {
          await db
            .update(sessionExercise)
            .set({
              itemId: ex.itemId,
              orderNum: ex.orderNum,
            })
            .where(eq(sessionExercise.exerciseId, exId));
        }

        incomingExerciseIds.push(exId);
      } else {
        const [newEx] = await db
          .insert(sessionExercise)
          .values({
            sessionId: id,
            itemId: ex.itemId,
            orderNum: ex.orderNum,
          })
          .returning();

        exId = newEx.exerciseId;
        incomingExerciseIds.push(exId);
      }

      // 處理該動作底下的組數 sets
      for (const set of ex.sets) {
        const setId = set.setId;

        if (setId) {
          const existingSet = dbSetById.get(setId);

          if (
            existingSet &&
            (existingSet.setNumber !== set.setNumber ||
              existingSet.reps !== set.reps ||
              existingSet.weightKg !== set.weightKg ||
              existingSet.durationSec !== set.durationSec ||
              existingSet.notes !== set.notes)
          ) {
            await db
              .update(exerciseSet)
              .set({
                setNumber: set.setNumber,
                reps: set.reps,
                weightKg: set.weightKg,
                durationSec: set.durationSec,
                notes: set.notes,
              })
              .where(eq(exerciseSet.setId, setId));
          }

          incomingSetIds.push(setId);
        } else {
          const [newSet] = await db
            .insert(exerciseSet)
            .values({
              exerciseId: exId,
              setNumber: set.setNumber,
              reps: set.reps,
              weightKg: set.weightKg,
              durationSec: set.durationSec,
              notes: set.notes,
            })
            .returning();

          incomingSetIds.push(newSet.setId);
        }
      }
    }

    // 5. 比對刪除：將「資料庫有，但前端傳入資料中沒有」的資料進行刪除
    // A. 刪除未傳入的組數 sets
    const setsToDelete = dbSetIds.filter((id) => !incomingSetIds.includes(id));
    if (setsToDelete.length > 0) {
      await db
        .delete(exerciseSet)
        .where(inArray(exerciseSet.setId, setsToDelete));
    }

    // B. 刪除未傳入的動作 exercises（及其關聯組數）
    const exercisesToDelete = dbExerciseIds.filter((id) => !incomingExerciseIds.includes(id));
    if (exercisesToDelete.length > 0) {
      await db
        .delete(exerciseSet)
        .where(inArray(exerciseSet.exerciseId, exercisesToDelete));
      
      await db
        .delete(sessionExercise)
        .where(inArray(sessionExercise.exerciseId, exercisesToDelete));
    }

    return Response.json({ message: "訓練紀錄修改成功" });
  } catch (error) {
    console.error("Failed to update workout session:", error);
    if (error instanceof PayloadValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
