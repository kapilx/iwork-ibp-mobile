import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class UpdateStageOwnerDto {
  @ApiProperty({ example: 101, description: "Opportunity ID" })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt()
  @IsNotEmpty()
  opportunityId!: number;

  @ApiProperty({ example: 201, description: "Stage Owner User ID" })
  @Transform(({ value }) => {
    if (value === null) return null;
    if (
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsInt()
  @IsNotEmpty()
  ownerId!: number;

  @ApiProperty({
    example: "ROLE_ISG_EXECUTIVE",
    description: "Role key(ROLE_ISG_EXECUTIVE or ROLE_BD_EXECUTIVE)",
  })
  @IsString()
  @IsNotEmpty()
  roleKey!: string;
}

export class StageOwnerResponseDto {
  opportunityId!: number;
  roleKey!: string;
  ownerId!: number | null;
}

export interface ActivityNameData {
  id: number;
  name: string;
}

export interface StageNameData {
  id: number;
  name: string;
}
