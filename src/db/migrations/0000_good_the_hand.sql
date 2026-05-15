CREATE TABLE "account" (
	"userId" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "body_part" (
	"part_id" serial PRIMARY KEY NOT NULL,
	"part_name" varchar(50) NOT NULL,
	CONSTRAINT "body_part_part_name_unique" UNIQUE("part_name")
);
--> statement-breakpoint
CREATE TABLE "exercise_set" (
	"set_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_id" uuid NOT NULL,
	"set_number" integer NOT NULL,
	"reps" integer,
	"weight_kg" numeric(6, 2),
	"duration_sec" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "session_exercise" (
	"exercise_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"item_id" integer NOT NULL,
	"order_num" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" timestamp,
	"image" varchar(255),
	"password_hash" varchar(255),
	"account" varchar(50),
	"height_cm" numeric(5, 2),
	"weight_kg" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_account_unique" UNIQUE("account")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_item" (
	"item_id" serial PRIMARY KEY NOT NULL,
	"item_name" varchar(100) NOT NULL,
	"part_id" integer NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "workout_session" (
	"session_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_date" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"title" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_set" ADD CONSTRAINT "exercise_set_exercise_id_session_exercise_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."session_exercise"("exercise_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercise" ADD CONSTRAINT "session_exercise_session_id_workout_session_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_session"("session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercise" ADD CONSTRAINT "session_exercise_item_id_workout_item_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."workout_item"("item_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_item" ADD CONSTRAINT "workout_item_part_id_body_part_part_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."body_part"("part_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;