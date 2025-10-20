import { ApiProperty } from '@nestjs/swagger';


export class LoginDto {
  @ApiProperty({ example: 'admin@mail.com' })
<<<<<<< HEAD
  email: string;
=======
  identifier: string;
>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26

  @ApiProperty({ example: '123456' })
  password: string;

<<<<<<< HEAD

=======
>>>>>>> 58ebeb27ce1b03e2bd9e69dabeda0763ccd9df26
}
