import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
<<<<<<< HEAD
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';
=======
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy'; // ✅ tambahkan ini
>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26
import { UserModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
<<<<<<< HEAD
=======
    PassportModule.register({ defaultStrategy: 'jwt' }), // ✅ tambahkan ini
>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
      }),
    }),
  ],
  controllers: [AuthController],
<<<<<<< HEAD
  providers: [AuthService, GoogleStrategy],
=======
  providers: [AuthService, GoogleStrategy, JwtStrategy], // ✅ tambahkan JwtStrategy
  exports: [JwtStrategy, PassportModule, JwtModule], // ✅ biar bisa dipakai di module lain
>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26
})
export class AuthModule {}
