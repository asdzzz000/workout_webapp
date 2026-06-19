// 共用的 Workout 型別定義

export interface SetData {
  setId: string;
  setNumber: number;
  weightKg: string | null;
  reps: number | null;
  durationSec: number | null;
  notes: string | null;
}

export interface ExerciseData {
  exerciseId: string;
  itemId: number;
  orderNum: number;
  workoutItem: {
    itemId: number;
    itemName: string;
    description: string | null;
    bodyPart: {
      partName: string;
    };
  };
  sets: SetData[];
}

export interface SessionData {
  sessionId: string;
  userId: string;
  title: string | null;
  sessionDate: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  createdAt: Date;
  exercises: ExerciseData[];
}

export interface WorkoutSessionRecord {
  sessionId: string;
  userId: string;
  title: string | null;
  sessionDate: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface WorkoutItemData {
  itemId: number;
  itemName: string;
  partId: number;
  description: string | null;
  bodyPart: {
    partId: number;
    partName: string;
  };
}

export interface ExerciseSetInput {
  setId?: string;
  setNumber: number;
  weightKg: string;
  reps: string;
  isCompleted: boolean;
}

export interface SelectedExerciseInput {
  exerciseId?: string;
  itemId: number;
  itemName: string;
  partName: string;
  sets: ExerciseSetInput[];
}

export interface SessionSetRequest {
  setId?: string;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  durationSec?: number | null;
  notes: string | null;
}

export interface SessionExerciseRequest {
  exerciseId?: string;
  itemId: number;
  orderNum: number;
  sets: SessionSetRequest[];
}

export interface SessionRequest {
  title: string;
  sessionDate: string;
  notes: string;
  exercises: SessionExerciseRequest[];
}

export interface ApiErrorResponse {
  error: string;
}

export interface CreateSessionResponse {
  message: string;
  session: WorkoutSessionRecord;
}

export interface UpdateSessionResponse {
  message: string;
}
