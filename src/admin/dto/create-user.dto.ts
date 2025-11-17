import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../../generated/prisma'; // ✅ Enum Role dari Prisma

export class CreateUserDto {
  @ApiProperty({ example: 'kasir1@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'kasir1' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, example: Role.KASIR })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ example: 'Kasir Utama', required: false })
  @IsOptional()
  @IsString()
  name?: string;
}
