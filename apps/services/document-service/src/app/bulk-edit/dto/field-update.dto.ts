import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { FieldOperation } from '../enums/field-operation.enum';

/**
 * DTO for field update operations with validation
 */
export class FieldUpdateDto {
    @IsNotEmpty()
    @IsString()
    fieldName!: string;

    @ValidateIf((o) => o.operation === FieldOperation.SET)
    @IsNotEmpty({ message: 'newValue is required when operation is SET' })
    newValue!: string | number | boolean | null;

    @IsEnum(FieldOperation, {
        message: 'operation must be either "set" or "clear"'
    })
    operation!: FieldOperation;
}