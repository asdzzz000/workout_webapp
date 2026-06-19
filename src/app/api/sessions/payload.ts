export interface SessionSetPayload {
  setId?: string;
  setNumber: number;
  reps: number | null;
  weightKg: string | null;
  durationSec: number | null;
  notes: string | null;
}

export interface SessionExercisePayload {
  exerciseId?: string;
  itemId: number;
  orderNum: number;
  sets: SessionSetPayload[];
}

export interface SessionPayload {
  title: string;
  sessionDate: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  exercises: SessionExercisePayload[];
}

export class PayloadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayloadValidationError";
  }
}

interface RawSetPayload {
  setId?: unknown;
  setNumber?: unknown;
  reps?: unknown;
  weightKg?: unknown;
  durationSec?: unknown;
  notes?: unknown;
}

interface RawExercisePayload {
  exerciseId?: unknown;
  itemId?: unknown;
  orderNum?: unknown;
  sets?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function optionalString(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
}

function optionalId(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new PayloadValidationError(`${fieldName} must be a string`);
  }
  return value;
}

function requiredPositiveInteger(value: unknown, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new PayloadValidationError(`${fieldName} must be a positive integer`);
  }
  return parsed;
}

function optionalNonNegativeInteger(value: unknown, fieldName: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new PayloadValidationError(`${fieldName} must be a positive integer`);
  }
  return parsed;
}

function optionalNonNegativeNumber(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new PayloadValidationError(`${fieldName} must be a non-negative number`);
  }
  return String(parsed);
}

function normalizeSet(rawSet: RawSetPayload, index: number): SessionSetPayload {
  const normalized = {
    setId: optionalId(rawSet.setId, "setId"),
    setNumber:
      rawSet.setNumber !== undefined
        ? requiredPositiveInteger(rawSet.setNumber, "setNumber")
        : index + 1,
    reps: optionalNonNegativeInteger(rawSet.reps, "reps"),
    weightKg: optionalNonNegativeNumber(rawSet.weightKg, "weightKg"),
    durationSec: optionalNonNegativeInteger(rawSet.durationSec, "durationSec"),
    notes: optionalString(rawSet.notes),
  };

  if (
    normalized.reps === null &&
    normalized.weightKg === null &&
    normalized.durationSec === null
  ) {
    throw new PayloadValidationError("Each set must include reps, weight, or duration");
  }

  return normalized;
}

function normalizeExercise(rawExercise: RawExercisePayload, index: number): SessionExercisePayload {
  if (!isRecord(rawExercise)) {
    throw new PayloadValidationError("Each exercise must be an object");
  }

  if (!Array.isArray(rawExercise.sets) || rawExercise.sets.length === 0) {
    throw new PayloadValidationError("Each exercise must include at least one set");
  }

  return {
    exerciseId: optionalId(rawExercise.exerciseId, "exerciseId"),
    itemId: requiredPositiveInteger(rawExercise.itemId, "itemId"),
    orderNum:
      rawExercise.orderNum !== undefined
        ? requiredPositiveInteger(rawExercise.orderNum, "orderNum")
        : index + 1,
    sets: rawExercise.sets.map((set, setIndex) => {
      if (!isRecord(set)) {
        throw new PayloadValidationError("Each set must be an object");
      }
      return normalizeSet(set, setIndex);
    }),
  };
}

export function parseSessionPayload(body: unknown): SessionPayload {
  if (!isRecord(body)) {
    throw new PayloadValidationError("Request body must be an object");
  }

  if (typeof body.sessionDate !== "string" || body.sessionDate.trim() === "") {
    throw new PayloadValidationError("Session date is required");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.sessionDate)) {
    throw new PayloadValidationError("Session date must use YYYY-MM-DD format");
  }

  if (!Array.isArray(body.exercises) || body.exercises.length === 0) {
    throw new PayloadValidationError("At least one exercise is required");
  }

  return {
    title: optionalString(body.title) || "自主訓練",
    sessionDate: body.sessionDate,
    startTime: optionalString(body.startTime),
    endTime: optionalString(body.endTime),
    notes: optionalString(body.notes),
    exercises: body.exercises.map((exercise, index) =>
      normalizeExercise(exercise, index)
    ),
  };
}
