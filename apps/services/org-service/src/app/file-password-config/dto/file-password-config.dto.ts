import { IsEnum, IsString, IsArray, IsOptional, ValidateIf, MinLength, Matches, ArrayMinSize, IsNumber, IsPositive } from 'class-validator';

export class CreateOrUpdateFilePasswordConfigDto {
    @IsEnum(['custom', 'user_details'])
    passwordType: 'custom' | 'user_details';

    @IsNumber({}, { message: 'Selected country ID must be a number' })
    selectedCountryId: number;

    @IsString({ message: 'Organisation key must be a string' })
    @MinLength(1, { message: 'Organisation key cannot be empty' })
    organisationKey: string;

    @ValidateIf(o => o.passwordType === 'custom')
    @IsString()
    @MinLength(1, { message: 'Custom password cannot be empty' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    @IsOptional()
    customPassword?: string;

    @ValidateIf(o => o.passwordType === 'user_details')
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one user field must be selected' })
    @IsString({ each: true })
    @IsOptional()
    userFields?: string[];
}
