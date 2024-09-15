import multer from 'multer';
import path from 'path';

/**
 * @description Configures multer middleware for handling file uploads.
 * The configuration specifies how uploaded files are stored on the disk.
 * Files are saved in the 'uploads/' directory with a unique filename based
 * on the current timestamp and the original file extension.
 *
 * @constant {multer.StorageEngine} storage - The multer storage engine configuration.
 * @property {Function} destination - Function to determine the destination directory for uploaded files.
 * @param {Request} req - The request object representing the HTTP request.
 * @param {File} file - The file object representing the uploaded file.
 * @param {Function} cb - Callback function to indicate the destination directory.
 * @property {Function} filename - Function to determine the filename of the uploaded file.
 * @param {Request} req - The request object representing the HTTP request.
 * @param {File} file - The file object representing the uploaded file.
 * @param {Function} cb - Callback function to indicate the filename.
 *
 * @constant {multer.Instance} upload - The multer instance configured with the defined storage engine.
 * @see {@link https://www.npmjs.com/package/multer} for more information on multer.
 *
 * @example
 * // Use the upload middleware in an Express route
 * app.post('/upload', upload.single('file'), (req, res) => {
 *   res.send('File uploaded successfully');
 * });
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

export default upload;
