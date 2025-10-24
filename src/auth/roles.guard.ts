import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Ambil daftar role yang dibutuhkan dari decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Jika route tidak butuh role spesifik, lanjut saja
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User tidak ditemukan di token JWT');
    }

    // Cek apakah role user termasuk di daftar yang diizinkan
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Akses ditolak: hanya ${requiredRoles.join(', ')} yang boleh`
      );
    }

    return true;
  }
}