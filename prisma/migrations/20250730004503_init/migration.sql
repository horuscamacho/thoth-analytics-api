-- CreateEnum
CREATE TYPE "public"."TenantType" AS ENUM ('GOVERNMENT_STATE', 'GOVERNMENT_MUNICIPAL', 'HIGH_PROFILE');

-- CreateEnum
CREATE TYPE "public"."TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('DIRECTOR_COMUNICACION', 'GOBERNADOR', 'SECRETARIO_GOBIERNO', 'SUBORDINADO');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('TWITTER', 'NEWS_WEBSITE', 'IMAGE', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "public"."AnalysisType" AS ENUM ('TWEET_ANALYSIS', 'NEWS_ANALYSIS', 'CLUSTER_ANALYSIS', 'THREAT_DETECTION');

-- CreateEnum
CREATE TYPE "public"."ThreatLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."QueueType" AS ENUM ('TWEET_ANALYSIS', 'NEWS_ANALYSIS', 'CLUSTER_ANALYSIS', 'REACTIVATION_CHECK');

-- CreateEnum
CREATE TYPE "public"."QueueStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('THREAT_DETECTED', 'NEWS_MENTION', 'SENTIMENT_CHANGE', 'SYSTEM_ERROR', 'MANUAL_ALERT');

-- CreateEnum
CREATE TYPE "public"."AlertSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AlertStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public"."tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."TenantType" NOT NULL,
    "status" "public"."TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "settings" JSONB,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."MediaType" NOT NULL,
    "baseUrl" TEXT,
    "twitterHandle" TEXT,
    "selectors" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tweets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "mediaSourceId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorHandle" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "hashtags" TEXT[],
    "mentions" TEXT[],
    "mediaUrls" JSONB,
    "engagement" JSONB,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tweets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tweet_media" (
    "id" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "type" "public"."MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "tweet_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."news" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "mediaSourceId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "url" TEXT,
    "extractedAt" TIMESTAMP(3) NOT NULL,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_analysis" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tweetId" TEXT,
    "newsId" TEXT,
    "type" "public"."AnalysisType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "sentiment" TEXT,
    "relevance" DOUBLE PRECISION,
    "threatLevel" "public"."ThreatLevel",
    "tags" TEXT[],
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_processing_queue" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tweetId" TEXT,
    "newsId" TEXT,
    "queueType" "public"."QueueType" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "status" "public"."QueueStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_processing_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."alerts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "public"."AlertType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "public"."AlertSeverity" NOT NULL,
    "status" "public"."AlertStatus" NOT NULL DEFAULT 'UNREAD',
    "metadata" JSONB,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tweets_tweetId_key" ON "public"."tweets"("tweetId");

-- CreateIndex
CREATE INDEX "tweets_tenantId_publishedAt_idx" ON "public"."tweets"("tenantId", "publishedAt");

-- CreateIndex
CREATE INDEX "tweets_contentHash_idx" ON "public"."tweets"("contentHash");

-- CreateIndex
CREATE INDEX "news_tenantId_extractedAt_idx" ON "public"."news"("tenantId", "extractedAt");

-- CreateIndex
CREATE INDEX "news_contentHash_idx" ON "public"."news"("contentHash");

-- CreateIndex
CREATE INDEX "ai_analysis_tenantId_type_processedAt_idx" ON "public"."ai_analysis"("tenantId", "type", "processedAt");

-- CreateIndex
CREATE INDEX "ai_processing_queue_tenantId_status_scheduledAt_idx" ON "public"."ai_processing_queue"("tenantId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "alerts_tenantId_status_triggeredAt_idx" ON "public"."alerts"("tenantId", "status", "triggeredAt");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tweets" ADD CONSTRAINT "tweets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tweets" ADD CONSTRAINT "tweets_mediaSourceId_fkey" FOREIGN KEY ("mediaSourceId") REFERENCES "public"."media_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tweet_media" ADD CONSTRAINT "tweet_media_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "public"."tweets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."news" ADD CONSTRAINT "news_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."news" ADD CONSTRAINT "news_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "public"."tweets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."news" ADD CONSTRAINT "news_mediaSourceId_fkey" FOREIGN KEY ("mediaSourceId") REFERENCES "public"."media_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_analysis" ADD CONSTRAINT "ai_analysis_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_analysis" ADD CONSTRAINT "ai_analysis_tweetId_fkey" FOREIGN KEY ("tweetId") REFERENCES "public"."tweets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_analysis" ADD CONSTRAINT "ai_analysis_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "public"."news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_processing_queue" ADD CONSTRAINT "ai_processing_queue_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
