import { IsArray, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class OrderItemDto {
  @ApiPropertyOptional({ example: 1, description: 'ID produk (opsional jika pakai barcode)' })
  @IsOptional()
  @IsInt()
  productId?: number;

  @ApiPropertyOptional({ example: '8997035567890', description: 'Barcode produk (opsional jika pakai productId)' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 2, description: 'Jumlah produk yang dibeli' })
  @IsInt()
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 2, description: 'ID kasir yang membuat pesanan' })
  @IsInt()
  userId: number;

  @ApiProperty({
    type: [OrderItemDto],
    description: 'Daftar produk yang dibeli (bisa pakai productId atau barcode)',
    example: [
      { barcode: '8997035567890', quantity: 2 },
      { productId: 3, quantity: 1 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
