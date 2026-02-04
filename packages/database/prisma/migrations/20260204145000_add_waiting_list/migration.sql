-- CreateEnum
CREATE TYPE "WaitingListStatus" AS ENUM ('WAITING', 'NOTIFIED', 'BOOKED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "waiting_list" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "requested_date" TIMESTAMP(3) NOT NULL,
    "requested_time" TEXT NOT NULL,
    "court_id" TEXT,
    "position" SERIAL NOT NULL,
    "status" "WaitingListStatus" NOT NULL DEFAULT 'WAITING',
    "notified_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "booking_id" TEXT,
    "cancellation_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waiting_list_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "waiting_list_tenant_id_idx" ON "waiting_list"("tenant_id");

-- CreateIndex
CREATE INDEX "waiting_list_facility_id_idx" ON "waiting_list"("facility_id");

-- CreateIndex
CREATE INDEX "waiting_list_customer_id_idx" ON "waiting_list"("customer_id");

-- CreateIndex
CREATE INDEX "waiting_list_status_idx" ON "waiting_list"("status");

-- CreateIndex
CREATE INDEX "waiting_list_requested_date_idx" ON "waiting_list"("requested_date");

-- CreateIndex
CREATE UNIQUE INDEX "waiting_list_booking_id_key" ON "waiting_list"("booking_id");

-- AddForeignKey
ALTER TABLE "waiting_list" ADD CONSTRAINT "waiting_list_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiting_list" ADD CONSTRAINT "waiting_list_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiting_list" ADD CONSTRAINT "waiting_list_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiting_list" ADD CONSTRAINT "waiting_list_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waiting_list" ADD CONSTRAINT "waiting_list_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
