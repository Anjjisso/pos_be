import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '../../generated/prisma';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // --- LOGIN & REGISTER seperti sebelumnya ---
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email};
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(email: string, password: string, role: Role) {
    if (!role) throw new BadRequestException('Role is required');

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new BadRequestException('Email already registered');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, role },
    });

    const { password: _, ...result } = user;
    return result;
  }

  // --- NEW FEATURE: FORGOT PASSWORD ---

  // 1️⃣ Request Reset Password
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Email not found');

    // Buat token random (32 karakter)
    const token = crypto.randomBytes(32).toString('hex');

    // Simpan token + waktu kadaluarsa (1 jam)
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpiry: expires,
      },
    });

    // Biasanya token dikirim via email, tapi sementara return token-nya
    // (kalau belum setup email service)
    return { message: 'Reset token created', token };
  }

  // 2️⃣ Reset Password
  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }, // pastikan belum expired
      },
    });

    if (!user) throw new BadRequestException('Invalid or expired token');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password successfully reset' };
  }
}
