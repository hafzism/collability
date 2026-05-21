DELETE FROM "CardLabel"
WHERE "cardId" IN (
    SELECT c."id"
    FROM "Card" c
    WHERE c."archived" = true
       OR c."listId" IN (
            SELECT l."id"
            FROM "List" l
            WHERE l."archived" = true
               OR l."boardId" IN (
                    SELECT b."id"
                    FROM "Board" b
                    WHERE b."archived" = true
                )
        )
);

DELETE FROM "CardAssignee"
WHERE "cardId" IN (
    SELECT c."id"
    FROM "Card" c
    WHERE c."archived" = true
       OR c."listId" IN (
            SELECT l."id"
            FROM "List" l
            WHERE l."archived" = true
               OR l."boardId" IN (
                    SELECT b."id"
                    FROM "Board" b
                    WHERE b."archived" = true
                )
        )
);

DELETE FROM "Comment"
WHERE "cardId" IN (
    SELECT c."id"
    FROM "Card" c
    WHERE c."archived" = true
       OR c."listId" IN (
            SELECT l."id"
            FROM "List" l
            WHERE l."archived" = true
               OR l."boardId" IN (
                    SELECT b."id"
                    FROM "Board" b
                    WHERE b."archived" = true
                )
        )
);

DELETE FROM "Card"
WHERE "archived" = true
   OR "listId" IN (
        SELECT l."id"
        FROM "List" l
        WHERE l."archived" = true
           OR l."boardId" IN (
                SELECT b."id"
                FROM "Board" b
                WHERE b."archived" = true
            )
    );

DELETE FROM "List"
WHERE "archived" = true
   OR "boardId" IN (
        SELECT b."id"
        FROM "Board" b
        WHERE b."archived" = true
    );

DELETE FROM "BoardMember"
WHERE "boardId" IN (
    SELECT b."id"
    FROM "Board" b
    WHERE b."archived" = true
);

DELETE FROM "Label"
WHERE "boardId" IN (
    SELECT b."id"
    FROM "Board" b
    WHERE b."archived" = true
);

DELETE FROM "Board"
WHERE "archived" = true;

ALTER TABLE "Board" DROP COLUMN "archived";
ALTER TABLE "List" DROP COLUMN "archived";
ALTER TABLE "Card" DROP COLUMN "archived";

ALTER TABLE "BoardMember" DROP CONSTRAINT "BoardMember_boardId_fkey";
ALTER TABLE "List" DROP CONSTRAINT "List_boardId_fkey";
ALTER TABLE "Card" DROP CONSTRAINT "Card_listId_fkey";
ALTER TABLE "CardAssignee" DROP CONSTRAINT "CardAssignee_cardId_fkey";
ALTER TABLE "Label" DROP CONSTRAINT "Label_boardId_fkey";
ALTER TABLE "CardLabel" DROP CONSTRAINT "CardLabel_cardId_fkey";
ALTER TABLE "CardLabel" DROP CONSTRAINT "CardLabel_labelId_fkey";
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_cardId_fkey";

ALTER TABLE "BoardMember"
ADD CONSTRAINT "BoardMember_boardId_fkey"
FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "List"
ADD CONSTRAINT "List_boardId_fkey"
FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Card"
ADD CONSTRAINT "Card_listId_fkey"
FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CardAssignee"
ADD CONSTRAINT "CardAssignee_cardId_fkey"
FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Label"
ADD CONSTRAINT "Label_boardId_fkey"
FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CardLabel"
ADD CONSTRAINT "CardLabel_cardId_fkey"
FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CardLabel"
ADD CONSTRAINT "CardLabel_labelId_fkey"
FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comment"
ADD CONSTRAINT "Comment_cardId_fkey"
FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
