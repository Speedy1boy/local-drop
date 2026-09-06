-- AlterTable
ALTER TABLE "FileItem" ADD COLUMN     "folderId" TEXT;

-- CreateTable
CREATE TABLE "FolderItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FolderItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FileItem" ADD CONSTRAINT "FileItem_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "FolderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FolderItem" ADD CONSTRAINT "FolderItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FolderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
