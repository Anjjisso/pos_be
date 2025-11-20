import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional, isNumber } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Rinso Cair 1L', description: 'Nama produk' })
  @IsString()
  name: string;

  @ApiProperty({ example: 20000, description: 'Harga produk' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 15000, description: 'Harga pokok produk' })
  @IsNumber()
  costPrice: number;

  @ApiProperty({ example: 10, description: 'Jumlah stok produk' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiProperty({ example: 'Deterjen cair dengan wangi segar', description: 'Deskripsi produk' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 3, description: 'ID kategori produk' })
  @IsNumber()
  categoryId: number;

  @ApiProperty({ example: 1, description: 'ID pemasok produk' })
  @IsNumber()
  supplierId: number;
  
  @ApiProperty({
    example: '8997035567890',
    description: 'Kode barcode unik untuk produk (EAN-13 atau custom)',
  })
  @IsOptional() // boleh dikosongkan, bisa digenerate otomatis di BE
  @IsString()
  barcode?: string;
}
