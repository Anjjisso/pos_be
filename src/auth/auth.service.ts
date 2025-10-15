import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '../../generated/prisma';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  // ======================================================
  // 🔹 REGISTER (disimpan ke PendingUser dulu)
  // ======================================================
  async register(email: string, username: string, password: string, role: Role) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
    if (existingUser)
      throw new BadRequestException('Email atau username sudah digunakan.');

    const existingPending = await this.prisma.pendingUser.findUnique({
      where: { email },
    });
    if (existingPending)
      throw new BadRequestException('OTP sudah dikirim, silakan verifikasi email.');

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    await this.prisma.pendingUser.create({
      data: { email, username, password: hashedPassword, role, otpHash, expiresAt },
    });

    // Kirim email OTP (Desain tetap)
    await this.mailerService.sendMail({
      to: email,
      subject: '📧 Verifikasi Email Anda - POS System',
      html: `
      <div style="
        font-family: 'Poppins', Arial, sans-serif;
        background-color: #f9f9f9;
        padding: 40px 0;
        text-align: center;
      ">
        <div style="
          max-width: 480px;
          background-color: #ffffff;
          border-radius: 12px;
          margin: auto;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          overflow: hidden;
        ">
          <div style="
            background: linear-gradient(90deg, #FF8C00, #FFA500);
            color: #fff;
            padding: 30px 20px;
            border-bottom: 4px solid #ff9800;
          ">
            <h1 style="margin: 0; font-size: 26px; font-weight: 700;">POS System</h1>
            <p style="margin: 5px 0 0; font-size: 16px;">Verifikasi Email Anda</p>
          </div>
          <div style="padding: 30px 25px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
              Halo, berikut adalah kode OTP Anda untuk verifikasi akun:
            </p>
            <div style="
              display: inline-block;
              background-color: #FFE4B5;
              padding: 16px 32px;
              border-radius: 12px;
              font-size: 32px;
              font-weight: bold;
              color: #FF8C00;
              letter-spacing: 12px;
              box-shadow: 0 3px 6px rgba(0,0,0,0.1);
              margin-bottom: 25px;
            ">
              ${otpCode}
            </div>
            <p style="font-size: 15px; color: #333; margin-bottom: 30px;">
              Kode ini hanya berlaku selama <strong>10 menit</strong>.<br>
              Jangan berikan kepada siapapun.
            </p>
            <a href="#" style="
              background-color: #FF8C00;
              color: white;
              text-decoration: none;
              padding: 12px 28px;
              border-radius: 10px;
              font-size: 16px;
              font-weight: 600;
              display: inline-block;
              box-shadow: 0 3px 6px rgba(0,0,0,0.15);
            ">
              Verifikasi Sekarang
            </a>
          </div>
          <div style="
            background-color: #f2f2f2;
            padding: 15px;
            font-size: 13px;
            color: #777;
          ">
            © ${new Date().getFullYear()} POS System — Semua hak dilindungi.
          </div>
        </div>
      </div>
      `,
    });

    return { message: 'OTP dikirim ke email Anda untuk verifikasi akun.' };
  }

  // =====================================================
  // ✅ REGISTER KHUSUS ROLE (DIPERBAIKI)
  // =====================================================
  async registerPelanggan(email: string, username: string, password: string) {
    return this.register(email, username, password, Role.PELANGGAN);
  }

  

  // ======================================================
  // 🔹 VERIFIKASI OTP
  // ======================================================
  async verifyOtp(email: string, otp: string) {
    const pendingUser = await this.prisma.pendingUser.findUnique({ where: { email } });
    if (!pendingUser) throw new NotFoundException('Tidak ada pendaftaran yang menunggu OTP.');

    if (pendingUser.expiresAt < new Date())
      throw new ForbiddenException('OTP sudah kadaluarsa.');

    const isMatch = await bcrypt.compare(otp, pendingUser.otpHash);
    if (!isMatch) throw new BadRequestException('Kode OTP salah.');

    // Pindahkan ke tabel user
    const user = await this.prisma.user.create({
      data: {
        email: pendingUser.email,
        username: pendingUser.username,
        password: pendingUser.password,
        role: pendingUser.role,
      },
    });

    // Hapus pending user setelah berhasil
    await this.prisma.pendingUser.delete({ where: { email } });

    return { message: 'Akun berhasil diverifikasi.', user };
  }

  // ======================================================
  // 🔹 LOGIN (Bisa pakai Email atau Username)
  // ======================================================
  async validateUser(identifier: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) throw new UnauthorizedException('User tidak ditemukan');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Password salah');

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    if (!user || !user.id) {
      throw new UnauthorizedException('User tidak valid');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Login berhasil',
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    };
  }

  // ======================================================
  // 🔹 LOGIN DENGAN GOOGLE
  // ======================================================
  async loginWithGoogle(googleUser: any) {
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    let usernameFromGoogle: string;
    if (googleUser.name) {
      usernameFromGoogle = googleUser.name.replace(/\s+/g, '').toLowerCase();
    } else {
      usernameFromGoogle = googleUser.email.split('@')[0];
    }

    const usernameExists = await this.prisma.user.findUnique({
      where: { username: usernameFromGoogle },
    });
    if (usernameExists) {
      usernameFromGoogle += Math.floor(Math.random() * 1000);
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          username: usernameFromGoogle,
          password: '',
          name: googleUser.name || usernameFromGoogle,
          role: 'PELANGGAN',
          picture: googleUser.picture,
          googleId: googleUser.email,
        },
      });
    }

    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        picture: true,
        googleId: true,
        createdAt: true,
      },
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Login Google berhasil',
      access_token: token,
      user: fullUser,
    };
  }

  // ======================================================
  // 🔹 LUPA PASSWORD (OTP)
  // ======================================================
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Email tidak ditemukan');

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otp.create({
      data: { email, codeHash, expiresAt },
    });

    await this.mailerService.sendMail({
      to: email,
      subject: '🔐 Kode OTP Reset Password - POS System',
      html: `<div>Reset Password OTP: <b>${otpCode}</b></div>`,
    });

    return { message: 'Kode OTP reset password dikirim ke email Anda.' };
  }

  async resetPassword(email: string, newPassword: string, otp: string) {
    const otpRecord = await this.prisma.otp.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
    if (!otpRecord) throw new NotFoundException('OTP tidak ditemukan.');

    if (otpRecord.expiresAt < new Date())
      throw new ForbiddenException('OTP sudah kadaluarsa.');

    const isMatch = await bcrypt.compare(otp, otpRecord.codeHash);
    if (!isMatch) throw new BadRequestException('Kode OTP salah.');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    await this.prisma.otp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    return { message: 'Password berhasil direset.' };
  }
}
