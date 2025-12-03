import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profil.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  // 🔹 Ambil data profil user yang lagi login
  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        picture: true,
        status: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('User tidak ditemukan');

    return user;
  }

  // 🔹 Update nama & username
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    if (dto.username) {
      const exists = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      if (exists && exists.id !== userId) {
        throw new BadRequestException('Username sudah digunakan');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        username: dto.username,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        picture: true,
      },
    });

    return {
      message: 'Profil berhasil diperbarui',
      user: updated,
    };
  }

  // 🔹 Update foto profil (hanya simpan path/URL-nya di DB)
  async updatePhoto(userId: number, filename: string) {
    // kalau kamu punya APP_URL di env bisa ganti jadi full URL
    const photoUrl = `/uploads/profile/${filename}`;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { picture: photoUrl },
      select: {
        id: true,
        picture: true,
      },
    });

    return {
      message: 'Foto profil berhasil diperbarui',
      picture: updated.picture,
    };
  }
}
