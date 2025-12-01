import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateProductUnitDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({ example: 'Dus' })
  @IsString()
  @IsNotEmpty()
  unitName: string;

  @ApiProperty({ example: 30, description: 'Jumlah PCS per unit (Dus, Pack, dll)' })
  @IsInt()
  @Min(1)
  multiplier: number;
}
