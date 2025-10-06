import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma'; // enum Prisma

export class RegisterDto {
  @ApiProperty({ example: 'admin@mail.com' })
  email: string;

  @ApiProperty({ example: '123456' })
  password: string;

  @ApiProperty({ enum: Role, example: 'ADMIN' })
  role: Role;
}
