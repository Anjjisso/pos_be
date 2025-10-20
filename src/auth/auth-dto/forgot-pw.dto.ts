import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
<<<<<<< HEAD
  @ApiProperty({ example: 'user@example.com' })
=======
  @ApiProperty({ example: 'user@gmail.com' })
>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26
  @IsEmail()
  email: string;
}
