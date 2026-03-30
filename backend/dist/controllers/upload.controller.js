"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const uploadFile = (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        // Return the public URL for the uploaded file
        const fileUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({ url: fileUrl });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'File upload failed' });
    }
};
exports.uploadFile = uploadFile;
