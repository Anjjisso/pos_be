import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './auth-dto/register.dto';
import { LoginDto } from './auth-dto/login.dto';
import { ForgotPasswordDto } from './auth-dto/forgot-pw.dto';
import { ResetPasswordDto } from './auth-dto/reset-pw.dto';
<<<<<<< HEAD
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ApiOperation } from '@nestjs/swagger';

=======
import { VerifyOtpDto } from './auth-dto/otp.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { Role } from '../../generated/prisma'; 
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

<<<<<<< HEAD
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.role,
    );
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    return this.authService.login(user);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset (send email token)' })
=======
  // ===================================
  // 🔹 REGISTER (KIRIM OTP KE EMAIL)
  // ===================================
  
  @Post()
registerPelanggan(@Body() dto: RegisterDto) {
  return this.authService.registerPelanggan(dto.email, dto.username, dto.password);
}



  // ===================================
  // 🔹 LOGIN
  // ===================================
  
  @Post('login')
async login(@Body() loginDto: LoginDto) {

  const user = await this.authService.validateUser(
    loginDto.identifier,
    loginDto.password,
  );

  return this.authService.login(user);
}

  // ===================================
  // 🔹 KIRIM OTP UNTUK RESET PASSWORD
  // ===================================
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset (kirim OTP ke email)' })
>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body.email);
  }

<<<<<<< HEAD
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

=======
  // ===================================
  // 🔹 VERIFIKASI OTP
  // ===================================
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verifikasi OTP dari email' })
  async verifyOtp(@Body() body: VerifyOtpDto) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  // ===================================
  // 🔹 RESET PASSWORD PAKAI OTP
  // ===================================
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password menggunakan OTP' })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(
      body.email,
      body.newPassword,
      body.otp,
    );
  }

  // ===================================
  // 🔹 GOOGLE LOGIN
  // ===================================
>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    return { message: 'Redirecting to Google...' };
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleRedirect(@Req() req) {
    const googleUser = req.user;

<<<<<<< HEAD
    // Cek apakah user sudah ada
=======
>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
<<<<<<< HEAD
          password: '', // Kosongkan atau buat random string
          name: googleUser.name,
          role: 'KASIR', // default role
=======
          password: '', // kosong karena login pakai Google
          name: googleUser.name,
          role: 'PELANGGAN',
>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26
          picture: googleUser.picture,
        },
      });
    }
<<<<<<< HEAD

    // Buat JWT token
=======
 
>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
<<<<<<< HEAD
      message: 'Login sukses',
=======
      message: 'Login sukses via Google',
>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26
      access_token: accessToken,
      user,
    };
  }
}
