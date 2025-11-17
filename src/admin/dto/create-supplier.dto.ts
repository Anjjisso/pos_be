import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'PT Sumber Jaya' })
  @IsString()
  name: string;

  @ApiProperty({ example: '08123456789', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Jl. Merdeka No.1', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}
