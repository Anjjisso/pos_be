import { ApiProperty } from '@nestjs/swagger';
<<<<<<< HEAD
import { Role } from '../../../generated/prisma'; // enum Prisma
=======
>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26

export class RegisterDto {
  @ApiProperty({ example: 'admin@mail.com' })
  email: string;

  @ApiProperty({ example: '123456' })
  password: string;

<<<<<<< HEAD
  @ApiProperty({ enum: Role, example: 'ADMIN' })
  role: Role;
=======
  @ApiProperty({ example: 'John Doe' })
  username: string;

>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26
}
