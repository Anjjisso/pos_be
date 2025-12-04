import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class FilterReportDto {
  @IsOptional() @IsString()
  from?: string;

  @IsOptional() @IsString()
  to?: string;

  @IsOptional() @IsNumberString()
  cashierId?: string;

  @IsOptional() @IsString()
  paymentMethod?: string;

  @IsOptional() @IsString()
  search?: string;
}
