import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'salary-slips');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `salary-slip-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (allowedMimeTypes.includes(mime) && allowedExtensions.includes(ext)) {
    // Strict MIME-to-extension alignment check
    const isPdf = ext === '.pdf' && mime === 'application/pdf';
    const isJpg = (ext === '.jpg' || ext === '.jpeg') && (mime === 'image/jpeg' || mime === 'image/jpg');
    const isPng = ext === '.png' && mime === 'image/png';

    if (isPdf || isJpg || isPng) {
      cb(null, true);
      return;
    }
  }

  cb(new Error('Invalid file type or mismatched MIME type and file extension.'));
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
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          error: 'File Upload Error',
          message: 'File size exceeds maximum allowed limit of 5 MB',
        });
        return;
      }
      res.status(400).json({
        error: 'File Upload Error',
        message: err.message,
      });
      return;
    } else if (err) {
      res.status(400).json({
        error: 'File Upload Error',
        message: err.message,
      });
      return;
    }
    next();
  });
};
