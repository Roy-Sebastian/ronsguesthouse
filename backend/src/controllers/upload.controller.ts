import { Request, Response } from 'express';

import { uploadToCloudinary } from '../config/cloudinary';

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const url = await uploadToCloudinary(req.file.buffer);
    res.status(200).json({ url });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
};
