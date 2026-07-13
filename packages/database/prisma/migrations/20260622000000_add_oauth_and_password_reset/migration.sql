CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE');

CREATE TYPE "EmailOtpPurpose" AS ENUM ('SIGNUP', 'PASSWORD_RESET');

ALTER TABLE "User"
ADD COLUMN "authProvider" "AuthProvider" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN "googleId" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

ALTER TABLE "EmailOtpVerification"
ADD COLUMN "purpose" "EmailOtpPurpose" NOT NULL DEFAULT 'SIGNUP';

CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

DROP INDEX IF EXISTS "EmailOtpVerification_email_createdAt_idx";

CREATE INDEX "EmailOtpVerification_email_purpose_createdAt_idx" ON "EmailOtpVerification"("email", "purpose", "createdAt");
