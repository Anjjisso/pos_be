import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class OrderItemDto {
  @ApiProperty({ example: 1, description: 'ID produk' })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 5, description: 'ID satuan produk (Dus/Pack/Pcs)' })
  @IsInt()
  unitId: number;

  @ApiProperty({ example: 2, description: 'Jumlah unit yang dipesan' })
  @IsInt()
  quantity: number;

  @ApiProperty({
    example: 10,
    required: false,
    description: 'Diskon persen per item (opsional)',
  })
  @IsOptional()
  @IsInt()
  discountPercent?: number;

  @ApiProperty({
    example: 2000,
    required: false,
    description: 'Diskon nominal per item (opsional)',
  })
  @IsOptional()
  @IsInt()
  discountValue?: number;
}

export class CreatepesananPelangganDto {
  @ApiProperty({
    example: 'Dihya Aufa',
    description: 'Nama pelanggan (opsional untuk sekarang)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '08123456789',
    description: 'Nomor telepon pelanggan',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    type: [OrderItemDto],
    description: 'Daftar item pesanan pelanggan',
    example: [
      { productId: 1, unitId: 5, quantity: 2 },
      { productId: 3, unitId: 8, quantity: 1, discountPercent: 10 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
