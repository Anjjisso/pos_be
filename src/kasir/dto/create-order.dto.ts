import{ IsArray, IsEnum, IsInt, IsOptional, IsString, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../generated/prisma'; // ✅ Enum PaymentMethod dari Prisma
import { ApiProperty,ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ example: '8997035567890', description: 'Barcode produk' })
  @IsString()
  barcode: string;

  @ApiProperty({
    example: 5,
    description: 'ID satuan produk (Dus, Pack, Pcs, dll)',
  })
  @IsInt()
  @Min(1)
  unitId: number;

  @ApiProperty({
    example: 2,
    description: 'Jumlah unit yang dibeli (misal: 2 dus, 3 pack)',
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Diskon persen per produk (per UNIT, opsional)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountPercent?: number;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Diskon nominal per produk (per UNIT, opsional)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountValue?: number;
}

export class CreateOrderDto {
  @ApiProperty({
    type: [OrderItemDto],
    description: 'Daftar produk yang dibeli',
    example: [
      {
        barcode: '8997035567890',
        unitId: 1,
        quantity: 2,
        discountPercent: 20,
      },
      {
        barcode: '1234567890123',
        unitId: 9,
        quantity: 1,
      },
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

  // ========= DISKON ORDER (bawah Sub Total) =========

  @ApiPropertyOptional({
    example: 0,
    description: 'Diskon persen untuk seluruh order (misal 10 = 10%)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountPercent?: number;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Diskon nominal untuk seluruh order (opsional)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  discountValue?: number;

  // ========= PAJAK ORDER (misal 11%) =========

  @ApiPropertyOptional({
    example: 11,
    description: 'Pajak persen untuk order (misal 11 = 11%)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  taxPercent?: number;

  @ApiPropertyOptional({
    example: 25000,
    description: 'Pajak nominal untuk order (opsional)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  taxValue?: number;
}