import { Module, Global } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { SupabaseStorageService } from './supabase-storage.service';
import { StorageController } from './storage.controller';

@Global()
@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 52428800, // 50MB
      },
    }),
  ],
  controllers: [StorageController],
  providers: [SupabaseStorageService],
  exports: [SupabaseStorageService],
})
export class StorageModule {}
