


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."CoinTransactionType" AS ENUM (
    'habit_reward',
    'purchase'
);


ALTER TYPE "public"."CoinTransactionType" OWNER TO "postgres";


CREATE TYPE "public"."HabitFrequency" AS ENUM (
    'daily',
    'weekdays',
    'weekends'
);


ALTER TYPE "public"."HabitFrequency" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."_prisma_migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_recommendations" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "goal" character varying(300),
    "request_context" "jsonb" NOT NULL,
    "suggestions" "jsonb" NOT NULL,
    "model" character varying(50) NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."ai_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cats" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" DEFAULT 'Paw'::"text" NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."cats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coin_transactions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "type" "public"."CoinTransactionType" NOT NULL,
    "habit_id" "uuid",
    "reward_date" "date",
    "shop_item_id" character varying(50),
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."coin_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habit_completions" (
    "id" "uuid" NOT NULL,
    "habit_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "completion_date" "date" NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."habit_completions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habits" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" character varying(100) NOT NULL,
    "description" character varying(500),
    "frequency" "public"."HabitFrequency" DEFAULT 'daily'::"public"."HabitFrequency" NOT NULL,
    "reminder_time" time without time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."habits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text",
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "coin_balance" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_shop_items" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "item_id" character varying(50) NOT NULL,
    "price_paid" integer NOT NULL,
    "equipped" boolean DEFAULT false NOT NULL,
    "created_at" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."user_shop_items" OWNER TO "postgres";


ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_recommendations"
    ADD CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cats"
    ADD CONSTRAINT "cats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coin_transactions"
    ADD CONSTRAINT "coin_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habit_completions"
    ADD CONSTRAINT "habit_completions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_shop_items"
    ADD CONSTRAINT "user_shop_items_pkey" PRIMARY KEY ("id");



CREATE INDEX "ai_recommendations_user_id_created_at_idx" ON "public"."ai_recommendations" USING "btree" ("user_id", "created_at");



CREATE UNIQUE INDEX "cats_user_id_key" ON "public"."cats" USING "btree" ("user_id");



CREATE UNIQUE INDEX "coin_transactions_habit_id_reward_date_key" ON "public"."coin_transactions" USING "btree" ("habit_id", "reward_date");



CREATE INDEX "coin_transactions_user_id_created_at_idx" ON "public"."coin_transactions" USING "btree" ("user_id", "created_at");



CREATE UNIQUE INDEX "habit_completions_habit_id_completion_date_key" ON "public"."habit_completions" USING "btree" ("habit_id", "completion_date");



CREATE INDEX "habit_completions_user_id_completion_date_idx" ON "public"."habit_completions" USING "btree" ("user_id", "completion_date");



CREATE INDEX "habits_user_id_idx" ON "public"."habits" USING "btree" ("user_id");



CREATE INDEX "habits_user_id_is_active_idx" ON "public"."habits" USING "btree" ("user_id", "is_active");



CREATE INDEX "user_shop_items_user_id_idx" ON "public"."user_shop_items" USING "btree" ("user_id");



CREATE UNIQUE INDEX "user_shop_items_user_id_item_id_key" ON "public"."user_shop_items" USING "btree" ("user_id", "item_id");



ALTER TABLE ONLY "public"."ai_recommendations"
    ADD CONSTRAINT "ai_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cats"
    ADD CONSTRAINT "cats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coin_transactions"
    ADD CONSTRAINT "coin_transactions_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."coin_transactions"
    ADD CONSTRAINT "coin_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habit_completions"
    ADD CONSTRAINT "habit_completions_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habit_completions"
    ADD CONSTRAINT "habit_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_shop_items"
    ADD CONSTRAINT "user_shop_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





































































































































































GRANT ALL ON TABLE "public"."_prisma_migrations" TO "anon";
GRANT ALL ON TABLE "public"."_prisma_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."_prisma_migrations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."ai_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."cats" TO "anon";
GRANT ALL ON TABLE "public"."cats" TO "authenticated";
GRANT ALL ON TABLE "public"."cats" TO "service_role";



GRANT ALL ON TABLE "public"."coin_transactions" TO "anon";
GRANT ALL ON TABLE "public"."coin_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."coin_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."habit_completions" TO "anon";
GRANT ALL ON TABLE "public"."habit_completions" TO "authenticated";
GRANT ALL ON TABLE "public"."habit_completions" TO "service_role";



GRANT ALL ON TABLE "public"."habits" TO "anon";
GRANT ALL ON TABLE "public"."habits" TO "authenticated";
GRANT ALL ON TABLE "public"."habits" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_shop_items" TO "anon";
GRANT ALL ON TABLE "public"."user_shop_items" TO "authenticated";
GRANT ALL ON TABLE "public"."user_shop_items" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































