import { IsArray, IsEnum, IsInt, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../../generated/prisma'; // ✅ Import enum dari Prisma

class OrderItemDto {
  @ApiProperty({ example: '8997035567890', description: 'Barcode produk' })
  @IsString()
  barcode: string;

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
    description: 'Daftar produk yang dibeli berdasarkan barcode',
    example: [
      { barcode: '8997035567890', quantity: 2 },
      { barcode: '1234567890123', quantity: 1 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    example: 'CASH',
    enum: PaymentMethod,
    description: 'Metode pembayaran',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod; // ✅ gunakan enum langsung, bukan string
}
