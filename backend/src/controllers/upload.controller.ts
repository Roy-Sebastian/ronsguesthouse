import { Request, Response } from 'express';

export const uploadFile = (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Return the public URL for the uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ url: fileUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
};
