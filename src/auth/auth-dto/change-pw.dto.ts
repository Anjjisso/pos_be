import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'passwordLama123' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: 'passwordBaru456' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
