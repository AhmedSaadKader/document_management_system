import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // const ext = path.extname(file.originalname).toLowerCase();
    // if (ext !== '.pdf') {
    //   return cb(new Error('Only PDF files are allowed'));
    // }
    cb(null, true);
  },
});

// Middleware for handling file uploads
export const uploadFileMiddleware = upload.single('file');
