-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Berlin',
    "showWeeklySummary" BOOLEAN NOT NULL DEFAULT true,
    "weeklyTargetHours" REAL NOT NULL DEFAULT 40.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "vacationDaysPerYear" INTEGER NOT NULL DEFAULT 30,
    "vacationDaysTaken" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password", "role", "timezone", "updatedAt", "vacationDaysPerYear", "vacationDaysTaken") SELECT "createdAt", "email", "id", "name", "password", "role", "timezone", "updatedAt", "vacationDaysPerYear", "vacationDaysTaken" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
