import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import multer from 'multer';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class FileUploadMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  async use(req: Request, res: Response, next: Function): Promise<void> {
    const destination = this.configService.get<string>('upload.destination');
    
    if (!destination) {
      throw new Error('Upload destination is not defined in the configuration.');
    }

    // Create upload directory if it doesn't exist
    if (!existsSync(destination)) {
      mkdirSync(destination, { recursive: true });
    }
    
    // Configure multer storage
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, destination);
      },
      filename: (_req, file, cb) => {
        // Generate unique filename with original extension
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      },
    });
    
    // Create multer upload handler
    const upload = multer({
      storage,
      fileFilter: (_req, file, cb: (error: Error | null) => void) => {
        // Accept only image files
        const allowedMimeTypes = ['jpeg', 'png', 'gif', 'webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null);
        } else {
          cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')); 
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }).single('file'); // 'file' is the field name expected from the client

    // Handle the file upload
    return new Promise<void>((resolve, reject) => {
      upload(req as any, res as any, (err: any) => {
        if (err) {
          res.status(400).json({
            error: err.message,
          });
          return reject(err);
        }
        resolve();
        next();
      });
    });
  }
}