import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'salary-slips');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Memory storage to stream directly to Cloudinary without relying on persistent local disk
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (allowedMimeTypes.includes(mime) && allowedExtensions.includes(ext)) {
    const isPdf = ext === '.pdf' && mime === 'application/pdf';
    const isJpg = (ext === '.jpg' || ext === '.jpeg') && (mime === 'image/jpeg' || mime === 'image/jpg');
    const isPng = ext === '.png' && mime === 'image/png';

    if (isPdf || isJpg || isPng) {
      cb(null, true);
      return;
    }
  }

  cb(new Error('INVALID_FILE_TYPE'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
}).single('salarySlip');

export const handleSalarySlipUpload = (req: Request, res: Response, next: NextFunction): void => {
  upload(req, res, (err: any) => {
    if (err) {
      console.error('[Upload Middleware] Multer Upload Exception:', err);

      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'File size exceeds maximum allowed limit of 5 MB. Please select a smaller file.',
        });
        return;
      }

      if (err.message === 'INVALID_FILE_TYPE') {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid file type. Only PDF, JPG, JPEG, and PNG files under 5 MB are supported.',
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: 'Upload Error',
        message: 'Unable to upload your salary slip. Please check your file and try again.',
      });
      return;
    }
    next();
  });
};
