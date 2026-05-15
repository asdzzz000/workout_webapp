import {
  pgTable,
  uuid,
  varchar,
  decimal,
  timestamp,
  date,
  time,
  integer,
  text,
  serial,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── BodyPart ───────────────────────────────────────────────────────────────
export const bodyPart = pgTable('body_part', {
  partId: serial('part_id').primaryKey(),
  partName: varchar('part_name', { length: 50 }).notNull().unique(),
})

// ─── WorkoutItem ─────────────────────────────────────────────────────────────
export const workoutItem = pgTable('workout_item', {
  itemId: serial('item_id').primaryKey(),
  itemName: varchar('item_name', { length: 100 }).notNull(),
  partId: integer('part_id')
    .notNull()
    .references(() => bodyPart.partId),
  description: text('description'),
})

// ─── Auth.js Tables ──────────────────────────────────────────────────────────

export const users = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: varchar('image', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }), // For Credentials provider
  account: varchar('account', { length: 50 }).unique(), // User's custom account name
  heightCm: decimal('height_cm', { precision: 5, scale: 2 }),
  weightKg: decimal('weight_kg', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const accounts = pgTable(
  'account',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 }),
  },
  (account) => [
    {
      primaryKey: [account.provider, account.providerAccountId],
    },
  ]
)

export const sessions = pgTable('session', {
  sessionToken: varchar('sessionToken', { length: 255 }).primaryKey(),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [
    {
      primaryKey: [vt.identifier, vt.token],
    },
  ]
)

// ─── WorkoutSession ───────────────────────────────────────────────────────────
export const workoutSession = pgTable('workout_session', {
  sessionId: uuid('session_id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  sessionDate: date('session_date').notNull(),
  startTime: time('start_time'),
  endTime: time('end_time'),
  title: varchar('title', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── SessionExercise ──────────────────────────────────────────────────────────
export const sessionExercise = pgTable('session_exercise', {
  exerciseId: uuid('exercise_id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => workoutSession.sessionId),
  itemId: integer('item_id')
    .notNull()
    .references(() => workoutItem.itemId),
  orderNum: integer('order_num').notNull(), // 動作在本次訓練中的順序
})

// ─── ExerciseSet ─────────────────────────────────────────────────────────────
export const exerciseSet = pgTable('exercise_set', {
  setId: uuid('set_id').primaryKey().defaultRandom(),
  exerciseId: uuid('exercise_id')
    .notNull()
    .references(() => sessionExercise.exerciseId),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps'),
  weightKg: decimal('weight_kg', { precision: 6, scale: 2 }),
  durationSec: integer('duration_sec'), // 有氧或等長訓練用
  notes: text('notes'),
})

// ─── Relations ────────────────────────────────────────────────────────────────
export const bodyPartRelations = relations(bodyPart, ({ many }) => ({
  workoutItems: many(workoutItem),
}))

export const workoutItemRelations = relations(workoutItem, ({ one, many }) => ({
  bodyPart: one(bodyPart, { fields: [workoutItem.partId], references: [bodyPart.partId] }),
  sessionExercises: many(sessionExercise),
}))

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(workoutSession),
}))

export const workoutSessionRelations = relations(workoutSession, ({ one, many }) => ({
  user: one(users, { fields: [workoutSession.userId], references: [users.id] }),
  exercises: many(sessionExercise),
}))

export const sessionExerciseRelations = relations(sessionExercise, ({ one, many }) => ({
  session: one(workoutSession, { fields: [sessionExercise.sessionId], references: [workoutSession.sessionId] }),
  workoutItem: one(workoutItem, { fields: [sessionExercise.itemId], references: [workoutItem.itemId] }),
  sets: many(exerciseSet),
}))

export const exerciseSetRelations = relations(exerciseSet, ({ one }) => ({
  exercise: one(sessionExercise, { fields: [exerciseSet.exerciseId], references: [sessionExercise.exerciseId] }),
}))
