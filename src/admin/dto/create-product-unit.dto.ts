import { IsInt, IsNumber, IsString, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateProductUnitDto {
  @ApiProperty({
    example: 12,
    description: "ID Produk induk yang memiliki satuan ini",
  })
  @IsInt()
  productId: number;

  @ApiProperty({
    example: "Dus",
    description: "Nama satuan produk (pcs/pack/dus/etc)",
  })
  @IsString()
  unitName: string;

  @ApiProperty({
    example: 40,
    description: "Jumlah isi tiap 1 unit (contoh: 1 Dus = 40 pcs)",
  })
  @IsInt()
  @Min(1)
  multiplier: number;

  @ApiProperty({
    example: 115000,
    description: "Harga per unit (harga 1 dus/pack/pcs)",
  })
  @IsNumber()
  @Min(0)
  price: number;
}
