-- CreateEnum
CREATE TYPE "OpponentMatchStatus" AS ENUM ('OPEN', 'MATCHED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ANY');

-- CreateTable
CREATE TABLE "opponent_matches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "requested_date" DATE NOT NULL,
    "requested_time" TEXT NOT NULL,
    "court_id" TEXT,
    "sport_type" "SportType" NOT NULL DEFAULT 'SOCCER',
    "players_needed" INTEGER NOT NULL,
    "current_players" INTEGER NOT NULL DEFAULT 1,
    "skill_level" "SkillLevel" NOT NULL DEFAULT 'ANY',
    "status" "OpponentMatchStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "booking_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opponent_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opponent_match_players" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "opponent_match_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'JOINED',
    "notes" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "opponent_match_players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opponent_matches_tenant_id_idx" ON "opponent_matches"("tenant_id");

-- CreateIndex
CREATE INDEX "opponent_matches_facility_id_idx" ON "opponent_matches"("facility_id");

-- CreateIndex
CREATE INDEX "opponent_matches_customer_id_idx" ON "opponent_matches"("customer_id");

-- CreateIndex
CREATE INDEX "opponent_matches_status_idx" ON "opponent_matches"("status");

-- CreateIndex
CREATE INDEX "opponent_matches_expires_at_idx" ON "opponent_matches"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "opponent_match_players_opponent_match_id_customer_id_key" ON "opponent_match_players"("opponent_match_id", "customer_id");

-- CreateIndex
CREATE INDEX "opponent_match_players_tenant_id_idx" ON "opponent_match_players"("tenant_id");

-- CreateIndex
CREATE INDEX "opponent_match_players_opponent_match_id_idx" ON "opponent_match_players"("opponent_match_id");

-- CreateIndex
CREATE INDEX "opponent_match_players_customer_id_idx" ON "opponent_match_players"("customer_id");

-- AddForeignKey
ALTER TABLE "opponent_matches" ADD CONSTRAINT "opponent_matches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opponent_matches" ADD CONSTRAINT "opponent_matches_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opponent_matches" ADD CONSTRAINT "opponent_matches_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opponent_matches" ADD CONSTRAINT "opponent_matches_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opponent_matches" ADD CONSTRAINT "opponent_matches_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opponent_match_players" ADD CONSTRAINT "opponent_match_players_opponent_match_id_fkey" FOREIGN KEY ("opponent_match_id") REFERENCES "opponent_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opponent_match_players" ADD CONSTRAINT "opponent_match_players_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
