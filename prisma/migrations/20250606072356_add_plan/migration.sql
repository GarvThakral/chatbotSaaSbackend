-- CreateEnum
CREATE TYPE "Plans" AS ENUM ('Free', 'Growth', 'Enterprise');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "planPurchased" "Plans" NOT NULL DEFAULT 'Free';
