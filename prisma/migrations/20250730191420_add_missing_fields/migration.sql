-- AlterTable
ALTER TABLE "public"."ai_processing_queue" ADD COLUMN     "analysisId" TEXT,
ADD COLUMN     "errorDetails" JSONB,
ADD COLUMN     "processingStartedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."tweet_media" ADD COLUMN     "altText" TEXT,
ADD COLUMN     "containsText" BOOLEAN,
ADD COLUMN     "durationSeconds" INTEGER,
ADD COLUMN     "fileSizeBytes" INTEGER,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "ocrText" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "width" INTEGER;

-- AlterTable
ALTER TABLE "public"."tweets" ADD COLUMN     "isRetweet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'es',
ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "locationMentioned" TEXT,
ADD COLUMN     "mediaCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "originalTweetId" TEXT,
ADD COLUMN     "replyCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "retweetCount" INTEGER NOT NULL DEFAULT 0;
