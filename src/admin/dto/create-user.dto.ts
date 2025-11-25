import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role, UserStatus } from '../../../generated/prisma'; // ✅ Enum dari Prisma

export class CreateUserDto {
  @ApiProperty({ example: 'kasir1@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'kasir1' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Minimal 8 karakter, ada huruf besar & angka/simbol',
  })
  @IsString()
  @MinLength(8) // ⬅️ samakan dengan aturan di UI
  password: string;

  @ApiProperty({ enum: Role, example: Role.KASIR })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ enum: UserStatus, required: false })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
