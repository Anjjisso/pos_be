import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profil.dto';

@Controller('profile')
@UseGuards(AuthGuard('jwt')) // semua endpoint butuh login
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // 🔹 data untuk halaman "Profil Pengguna"
  @Get('me')
  async getMe(@Req() req) {
    return this.profileService.getMe(req.user.sub);
  }

  // 🔹 update nama + username
  @Patch()
  async updateProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.sub, dto);
  }

  // 🔹 upload foto profil
  @Patch('photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads/profile',
        filename: (req, file, callback) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // max 2MB
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return callback(new Error('Hanya file JPG, JPEG, PNG yang diperbolehkan'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadPhoto(@Req() req, @UploadedFile() file: Express.Multer.File) {
    return this.profileService.updatePhoto(req.user.sub, file.filename);
  }
}
