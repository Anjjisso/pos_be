import { PartialType } from '@nestjs/swagger';
import { CreateProductUnitDto } from './create-product-unit.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, IsString } from 'class-validator';

export class UpdateProductUnitDto extends PartialType(CreateProductUnitDto) {
  @ApiPropertyOptional({ example: 'Pack' })
  @IsOptional()
  @IsString()
  unitName?: string;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsInt()
  @Min(1)
  multiplier?: number;
}
