import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private supabase: SupabaseClient;
  private readonly bucketName = 'friendsly-uploads';

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    // Use ANON_KEY for public bucket uploads (works with RLS policies)
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
    this.logger.log('✅ Supabase Storage initialized with ANON_KEY');
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: 'avatars' | 'covers' | 'content' = 'avatars',
  ): Promise<{ url: string; path: string }> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const extension = file.originalname.split('.').pop();
      const fileName = `${folder}/${timestamp}-${randomString}.${extension}`;

      this.logger.log(`📤 Uploading file: ${fileName}`);

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        this.logger.error(`❌ Upload failed: ${error.message}`);
        throw new BadRequestException(`Failed to upload file: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      this.logger.log(`✅ File uploaded successfully: ${urlData.publicUrl}`);

      return {
        url: urlData.publicUrl,
        path: fileName,
      };
    } catch (error) {
      this.logger.error(`❌ Error uploading file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      this.logger.log(`🗑️ Deleting file: ${filePath}`);

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        this.logger.error(`❌ Delete failed: ${error.message}`);
        throw new BadRequestException(`Failed to delete file: ${error.message}`);
      }

      this.logger.log(`✅ File deleted successfully: ${filePath}`);
    } catch (error) {
      this.logger.error(`❌ Error deleting file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(filePath: string): string {
    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Initialize storage bucket (run once)
   */
  async initializeBucket(): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === this.bucketName);

      if (!bucketExists) {
        // Create bucket
        const { error } = await this.supabase.storage.createBucket(this.bucketName, {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'],
        });

        if (error) {
          this.logger.error(`❌ Failed to create bucket: ${error.message}`);
        } else {
          this.logger.log(`✅ Bucket '${this.bucketName}' created successfully`);
        }
      } else {
        this.logger.log(`✅ Bucket '${this.bucketName}' already exists`);
      }
    } catch (error) {
      this.logger.error(`❌ Error initializing bucket: ${error.message}`);
    }
  }
}
