ALTER TYPE "BoardRole" RENAME TO "BoardRole_old";

CREATE TYPE "BoardRole" AS ENUM ('MANAGER', 'CONTRIBUTOR', 'VIEWER');

ALTER TABLE "BoardMember"
  ALTER COLUMN "role" TYPE "BoardRole"
  USING (
    CASE
      WHEN "role"::text = 'EDITOR' THEN 'MANAGER'
      WHEN "role"::text = 'VIEWER' THEN 'VIEWER'
      ELSE 'VIEWER'
    END
  )::"BoardRole";

DROP TYPE "BoardRole_old";
