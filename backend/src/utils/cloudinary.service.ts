import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'indranetra' },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Upload failed'));
          resolve(result.secure_url);
        }
      ).end(file.buffer);
    });
  }

  /**
   * Uploads a base64 data URI (e.g. the AI service's heatmap overlay) directly,
   * so heatmaps live in object storage instead of as multi-KB strings in Postgres.
   */
  async uploadDataUri(dataUri: string, folder = 'indranetra/heatmaps'): Promise<string> {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'image',
    });
    return result.secure_url;
  }
}
