import { IsArray, IsInt, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty({ example: 1, description: 'ID produk yang dibeli' })
  @IsInt()
  productId: number;

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
    description: 'Daftar produk yang dibeli',
    example: [
      { productId: 2, quantity: 1 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
