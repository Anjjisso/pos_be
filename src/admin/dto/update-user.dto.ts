import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../../generated/prisma';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ enum: Role, example: Role.ADMIN, required: false })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
