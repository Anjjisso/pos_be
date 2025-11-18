import { IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateProductUnitDto {
  @ApiPropertyOptional({
    example: "Pack",
    description: "Nama satuan baru",
  })
  @IsOptional()
  @IsString()
  unitName?: string;

  @ApiPropertyOptional({
    example: 5,
    description: "Jumlah isi 1 unit (contoh: 1 Pack = 5 pcs)",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  multiplier?: number;

  @ApiPropertyOptional({
    example: 15000,
    description: "Harga per unit",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}
