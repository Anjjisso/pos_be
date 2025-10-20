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

  @ApiProperty({ example: '8997035567890', description: 'Kode barcode unik untuk produk (EAN-13 atau custom)' }) 
  @IsOptional()    
  @IsString()
  barcode?: string;
}
