ALTER TABLE "exercise_set" DROP CONSTRAINT "exercise_set_exercise_id_session_exercise_exercise_id_fk";
--> statement-breakpoint
ALTER TABLE "session_exercise" DROP CONSTRAINT "session_exercise_session_id_workout_session_session_id_fk";
--> statement-breakpoint
ALTER TABLE "exercise_set" ADD CONSTRAINT "exercise_set_exercise_id_session_exercise_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."session_exercise"("exercise_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercise" ADD CONSTRAINT "session_exercise_session_id_workout_session_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_session"("session_id") ON DELETE cascade ON UPDATE no action;