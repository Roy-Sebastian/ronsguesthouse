import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const uploadToCloudinary = (buffer: Buffer, folder = 'rons-guesthouse'): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const folderPath = path.join(UPLOAD_DIR, folder);

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const filePath = path.join(folderPath, filename);
      fs.writeFileSync(filePath, buffer);

      resolve(`/uploads/${folder}/${filename}`);
    } catch (err) {
      reject(err);
    }
  });
};
