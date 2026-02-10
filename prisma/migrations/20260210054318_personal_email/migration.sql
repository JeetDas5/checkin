/*
  Warnings:

  - A unique constraint covering the columns `[personalEmail]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "personalEmail" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_personalEmail_key" ON "User"("personalEmail");
