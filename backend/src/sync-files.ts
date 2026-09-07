import * as path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
};

async function syncFiles() {
  console.log('Старт сверки файлов на диске и в базе данных');
  console.log(`Папка uploads: ${uploadsDir}`);

  try {
    await fs.access(uploadsDir);
  } catch {
    console.warn('Папка uploads не найдена на диске.');
    return;
  }

  const rawFiles = await fs.readdir(uploadsDir);
  const filesOnDisk = rawFiles.filter(file => file !== '.gitkeep');
  
  if (filesOnDisk.length === 0) {
    console.log('На диске нет файлов для синхронизации.');
    return;
  }

  const existingFiles = await prisma.fileItem.findMany({
    where: { fileName: { in: filesOnDisk } },
    select: { fileName: true }
  });

  const existingFileNamesSet = new Set(existingFiles.map(f => f.fileName));
  const filesToRestore = filesOnDisk.filter(fileName => !existingFileNamesSet.has(fileName));

  if (filesToRestore.length === 0) {
    console.log('Все файлы на диске уже соответствуют записями в базе.');
    return;
  }

  const dataToInsert = await Promise.all(
    filesToRestore.map(async (fileName) => {
      const filePath = path.join(uploadsDir, fileName);
      const stats = await fs.stat(filePath);
      const ext = path.extname(fileName).toLowerCase();

      if (!stats.isFile()) return null;

      const originalName = fileName; 

      return {
        originalName,
        fileName,
        mimeType: MIME_TYPES[ext] || 'application/octet-stream',
        size: stats.size,
      };
    })
  );

  const filteredData = dataToInsert.filter((item): item is NonNullable<typeof item> => item !== null);

  if (filteredData.length === 0) {
    console.log('Нет подходящих файлов для восстановления.');
    return;
  }

  const result = await prisma.fileItem.createMany({
    data: filteredData,
    skipDuplicates: true
  });

  console.log(`Синхронизация успешно завершена`);
  console.log(`Восстановлено файлов в базе: ${result.count}`);
}

syncFiles()
  .catch(err => console.error('Ошибка синхронизации:', err))
  .finally(async () => {
    await prisma.$disconnect();
  });