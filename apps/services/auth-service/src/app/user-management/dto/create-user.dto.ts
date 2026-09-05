import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsInt()
  salutationLid!: number;

  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;

  @ApiProperty()
  @IsString()
  emailId!: string;

  @ApiProperty()
  @IsString()
  mobile!: string;

  @ApiProperty()
  @IsString()
  loginName!: string;

  @ApiProperty()
  @IsString()
  password!: string;

  @ApiProperty()
  @IsInt()
  branchId!: number;

  @ApiProperty()
  @IsInt()
  verticalId!: number;

  @ApiProperty()
  @IsInt()
  departmentId!: number;

  @ApiProperty()
  @IsInt()
  designationId!: number;

  @ApiProperty()
  @IsInt()
  reportingUserId!: number;

  @ApiProperty()
  @IsString()
  userTypeKey!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  createdBy?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  updatedBy?: number;
}
