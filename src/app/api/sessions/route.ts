import { db } from "@/db";
import { workoutSession, sessionExercise, exerciseSet, workoutItem } from "@/db/schema";
import { auth } from "@/auth";
import { eq, inArray } from "drizzle-orm";
import { parseSessionPayload, PayloadValidationError } from "./payload";

// GET /api/sessions：取得目前使用者的所有訓練歷史（包含動作與組數）
export async function GET() {
  try {
    const userSession = await auth();
    if (!userSession || !userSession.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = userSession.user.id;

    const history = await db.query.workoutSession.findMany({
      where: eq(workoutSession.userId, userId),
      orderBy: (sessions, { desc }) => [desc(sessions.sessionDate), desc(sessions.createdAt)],
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

    return Response.json(history);
  } catch (error) {
    console.error("Failed to fetch workout sessions:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/sessions：新增一筆訓練紀錄
export async function POST(req: Request) {
  let createdSessionId: string | null = null;

  try {
    const userSession = await auth();
    if (!userSession || !userSession.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = userSession.user.id;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const payload = parseSessionPayload(body);
    const itemIds = Array.from(new Set(payload.exercises.map((ex) => ex.itemId)));
    const existingItems = await db
      .select({ itemId: workoutItem.itemId })
      .from(workoutItem)
      .where(inArray(workoutItem.itemId, itemIds));

    if (existingItems.length !== itemIds.length) {
      return Response.json({ error: "Workout item not found" }, { status: 400 });
    }

    // 1. 新增訓練紀錄 (workout_session)
    const [session] = await db.insert(workoutSession).values({
      userId,
      title: payload.title,
      sessionDate: payload.sessionDate,
      startTime: payload.startTime,
      endTime: payload.endTime,
      notes: payload.notes,
    }).returning();
    createdSessionId = session.sessionId;

    // 2. 新增關聯動作 (session_exercise) 與其組數 (exercise_set)
    for (const ex of payload.exercises) {
      const [exercise] = await db.insert(sessionExercise).values({
        sessionId: session.sessionId,
        itemId: ex.itemId,
        orderNum: ex.orderNum,
      }).returning();

      for (const set of ex.sets) {
        await db.insert(exerciseSet).values({
          exerciseId: exercise.exerciseId,
          setNumber: set.setNumber,
          reps: set.reps,
          weightKg: set.weightKg,
          durationSec: set.durationSec,
          notes: set.notes,
        });
      }
    }

    return Response.json({
      message: "新增訓練紀錄成功",
      session
    }, { status: 201 });
  } catch (error) {
    if (createdSessionId) {
      try {
        const exercises = await db
          .select({ exerciseId: sessionExercise.exerciseId })
          .from(sessionExercise)
          .where(eq(sessionExercise.sessionId, createdSessionId));

        for (const exercise of exercises) {
          await db
            .delete(exerciseSet)
            .where(eq(exerciseSet.exerciseId, exercise.exerciseId));
        }

        await db
          .delete(sessionExercise)
          .where(eq(sessionExercise.sessionId, createdSessionId));
        await db
          .delete(workoutSession)
          .where(eq(workoutSession.sessionId, createdSessionId));
      } catch (cleanupError) {
        console.error("Failed to clean up partial workout session:", cleanupError);
      }
    }

    console.error("Failed to create workout session:", error);
    if (error instanceof PayloadValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
