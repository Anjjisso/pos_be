import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';


export class UpdateProductDto {
  @ApiProperty({example: 'nama produk'})
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiProperty({example: 'deskripsi produk'})
  @IsOptional()
  @IsString()
  description?: string;
}
