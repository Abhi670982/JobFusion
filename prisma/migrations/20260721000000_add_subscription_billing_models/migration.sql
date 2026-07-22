-- ============================================================
-- Migration: add_subscription_billing_models
-- Date: 2026-07-21
-- Description: Adds Plan, Subscription, and Payment models
--   to support the SaaS pricing system. All payment provider
--   fields are nullable placeholders for future Dodo Payments
--   integration.
-- ============================================================

-- CreateEnum
CREATE TYPE "PlanId" AS ENUM ('free', 'pro_monthly', 'pro_yearly', 'recruiter');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'trialing');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('monthly', 'yearly');

-- CreateTable: plans
CREATE TABLE "plans" (
    "id"         TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "planId"     "PlanId"     NOT NULL,
    "name"       TEXT         NOT NULL,
    "price"      INTEGER      NOT NULL DEFAULT 0,
    "interval"   "BillingInterval",
    "features"   TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isActive"   BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique planId
CREATE UNIQUE INDEX "plans_planId_key" ON "plans"("planId");

-- CreateTable: subscriptions
CREATE TABLE "subscriptions" (
    "id"                     TEXT                  NOT NULL DEFAULT gen_random_uuid()::text,
    "userId"                 TEXT                  NOT NULL,
    "planId"                 TEXT                  NOT NULL,
    "status"                 "SubscriptionStatus"  NOT NULL DEFAULT 'active',
    "interval"               "BillingInterval",
    "currentPeriodStart"     TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd"       TIMESTAMP(3),
    "cancelAtPeriodEnd"      BOOLEAN               NOT NULL DEFAULT false,
    "paymentProvider"        TEXT,
    "customerId"             TEXT,
    "providerSubscriptionId" TEXT,
    "createdAt"              TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"              TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique userId (one subscription per user)
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateTable: payments
CREATE TABLE "payments" (
    "id"                TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
    "subscriptionId"    TEXT         NOT NULL,
    "amount"            INTEGER      NOT NULL,
    "currency"          TEXT         NOT NULL DEFAULT 'INR',
    "status"            TEXT         NOT NULL DEFAULT 'pending',
    "paymentProvider"   TEXT,
    "providerPaymentId" TEXT,
    "metadata"          JSONB,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payments_subscriptionId_createdAt_idx" ON "payments"("subscriptionId", "createdAt" DESC);

-- AddForeignKey: subscriptions.userId -> users.id
ALTER TABLE "subscriptions"
    ADD CONSTRAINT "subscriptions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: subscriptions.planId -> plans.id
ALTER TABLE "subscriptions"
    ADD CONSTRAINT "subscriptions_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "plans"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: payments.subscriptionId -> subscriptions.id
ALTER TABLE "payments"
    ADD CONSTRAINT "payments_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
