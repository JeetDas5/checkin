/*
  Warnings:

  - A unique constraint covering the columns `[roll]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roll` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE 'NOT_APPLICABLE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "profile_pic" TEXT,
ADD COLUMN     "roll" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_roll_key" ON "User"("roll");
