import{ IsArray, IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../generated/prisma'; // ✅ Enum PaymentMethod dari Prisma
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ example: '8997035567890', description: 'Barcode produk' })
  @IsString()
  barcode: string;

  @ApiProperty({
    example: 5,
    description: 'ID satuan produk (Dus, Pack, Pcs, dll)',
  })
  @IsInt()
  unitId: number;

  @ApiProperty({
    example: 2,
    description: 'Jumlah unit yang dibeli (misal: 2 dus, 3 pack)',
  })
  
  @IsInt()
  @IsOptional()
  quantity: number;

  @ApiProperty({
    example: 10,
    required: false,
    description: 'Diskon persen per produk (opsional)',
  })
  @IsOptional()
  @IsInt()
  discountPercent?: number;

  @ApiProperty({
    example: 5000,
    required: false,
    description: 'Diskon nominal per produk (opsional)',
  })
  @IsOptional()
  @IsInt()
  discountValue?: number;
}

export class CreateOrderDto {
  @ApiProperty({
    type: [OrderItemDto],
    description: 'Daftar produk yang dibeli',
    example: [
      { barcode: '8997035567890',  quantity: 2 },
      { barcode: '1234567890123', unitId: 9, quantity: 1, discountPercent: 10 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];


  @ApiProperty({
    example: 'TUNAI',
    enum: PaymentMethod,
    description: 'Metode pembayaran',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}