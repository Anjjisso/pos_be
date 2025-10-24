import { ApiProperty } from '@nestjs/swagger';


export class LoginDto {
  @ApiProperty({ example: 'admin@mail.com' })
  identifier: string;

  @ApiProperty({ example: '123456' })
  password: string;

}