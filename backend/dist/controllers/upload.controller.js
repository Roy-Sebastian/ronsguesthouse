"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const cloudinary_1 = require("../config/cloudinary");
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const url = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer);
        res.status(200).json({ url });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'File upload failed' });
    }
};
exports.uploadFile = uploadFile;
