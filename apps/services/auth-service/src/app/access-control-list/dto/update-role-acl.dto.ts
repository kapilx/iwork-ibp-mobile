import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayUnique, IsInt } from 'class-validator';

export class UpdateRoleAclDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  aclIds!: number[];
}
