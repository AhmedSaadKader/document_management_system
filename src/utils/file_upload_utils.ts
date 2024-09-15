import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * @constant {string} uploadDir - Directory where uploaded files will be stored.
 */
const uploadDir = 'uploads';

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/**
 * @constant {multer.StorageEngine} storage - Multer storage engine configuration.
 * @description Configures where and how to store uploaded files.
 */
const storage = multer.diskStorage({
  /**
   * @function destination
   * @param {Object} req - The request object.
   * @param {Object} file - The file object.
   * @param {function} cb - Callback function to indicate the destination directory.
   * @description Specifies the destination directory for uploaded files.
   */
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  /**
   * @function filename
   * @param {Object} req - The request object.
   * @param {Object} file - The file object.
   * @param {function} cb - Callback function to indicate the filename.
   * @description Defines the filename for the uploaded file. Includes a unique suffix to prevent filename collisions.
   */
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

/**
 * @constant {multer.Options} upload - Multer middleware configuration.
 * @description Configures multer middleware for handling file uploads.
 */
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: (req, file, cb) => {
    // Uncomment the following lines to limit the file type to PDFs
    // const ext = path.extname(file.originalname).toLowerCase();
    // if (ext !== '.pdf') {
    //   return cb(new Error('Only PDF files are allowed'));
    // }
    cb(null, true);
  },
});

/**
 * Middleware for handling single file uploads.
 * @function uploadFileMiddleware
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {function} next - The next middleware function.
 * @description Handles file uploads for a single file with the field name 'file'.
 */
export const uploadFileMiddleware = upload.single('file');
