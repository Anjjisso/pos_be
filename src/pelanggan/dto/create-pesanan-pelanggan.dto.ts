import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

class OrderItemDto {
  @ApiProperty({ example: 1, description: 'ID produk' })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 2, description: 'Jumlah produk yang dipesan' })
  @IsInt()
  quantity: number;
}

export class CreatepesananPelangganDto {
  @ApiProperty({ example: 'Dihya Aufa', description: 'Nama pelanggan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '08123456789', description: 'Nomor telepon pelanggan' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    type: [OrderItemDto],
    description: 'Daftar item yang dipesan',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
