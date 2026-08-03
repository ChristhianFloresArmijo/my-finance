-- Add 2FA fields to users table
ALTER TABLE "users" ADD COLUMN "totp_secret" TEXT;
ALTER TABLE "users" ADD COLUMN "totp_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "totp_enabled_at" TIMESTAMP(3);

-- Create recovery codes table
CREATE TABLE "user_recovery_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_recovery_codes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "user_recovery_codes" ADD CONSTRAINT "user_recovery_codes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
