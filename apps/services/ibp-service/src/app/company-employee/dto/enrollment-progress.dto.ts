import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EnrollmentStepDto {
    @ApiProperty({ example: true })
    @IsBoolean()
    completed!: boolean;

    @ApiPropertyOptional({ example: '2026-02-24T10:00:00Z' })
    @IsOptional()
    @IsString()
    completedAt?: string | null;

    @ApiPropertyOptional({ example: [101, 102] })
    @IsOptional()
    @IsArray()
    policiesCompleted?: number[];
}

export class EnrollmentSessionDto {
    @ApiProperty({ example: 'enroll:123:101_102_103:1691234567890' })
    @IsString()
    @IsNotEmpty()
    enrollmentBatchKey!: string;

    @ApiProperty({ example: [101, 102, 103] })
    @IsArray()
    policyIds!: number[];

    @ApiPropertyOptional({ example: '2026-02-24T10:00:00Z' })
    @IsOptional()
    @IsString()
    startedAt?: string | null;

    @ApiPropertyOptional({ example: '2026-02-24T12:00:00Z' })
    @IsOptional()
    @IsString()
    completedAt?: string | null;

    @ApiProperty({
        example: {
            login: { completed: true, completedAt: '2026-02-24T10:00:00Z' },
            reviewBenefits: { completed: true, completedAt: '2026-02-24T10:05:00Z' },
            addDependents: { completed: false },
            selectTopUps: { completed: false },
            submitEnrollment: { completed: false },
            receiveConfirmation: { completed: false }
        }
    })
    @ValidateNested()
    @Type(() => Object)
    steps!: {
        login: EnrollmentStepDto;
        reviewBenefits: EnrollmentStepDto;
        addDependents: EnrollmentStepDto;
        selectTopUps: EnrollmentStepDto;
        submitEnrollment: EnrollmentStepDto;
        receiveConfirmation: EnrollmentStepDto;
    };

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @ApiPropertyOptional({ example: 3 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(6)
    currentStep?: number;
}

export class EnrollmentProgressResponseDto {
    @ApiProperty({ example: 123 })
    @IsInt()
    employeeId!: number;

    @ApiPropertyOptional({ example: 'enroll:123:101_102_103:1691234567890' })
    @IsOptional()
    @IsString()
    enrollmentBatchKey?: string | null;

    @ApiPropertyOptional({ example: [101, 102, 103] })
    @IsOptional()
    @IsArray()
    policyIds?: number[];

    @ApiPropertyOptional({ example: 3 })
    @IsOptional()
    @IsInt()
    currentStep?: number;

    @ApiPropertyOptional({ example: 50 })
    @IsOptional()
    @IsNumber()
    completionPercentage?: number;

    @ApiPropertyOptional({
        type: [Object],
        example: [
            { step: 1, name: 'login', completed: true },
            { step: 2, name: 'reviewBenefits', completed: true },
            { step: 3, name: 'addDependents', completed: false, current: true },
            { step: 4, name: 'selectTopUps', completed: false },
            { step: 5, name: 'submitEnrollment', completed: false },
            { step: 6, name: 'receiveConfirmation', completed: false }
        ]
    })
    @IsOptional()
    @IsArray()
    steps?: Array<{
        step: number;
        name: string;
        completed: boolean;
        current?: boolean;
    }>;

    @ApiPropertyOptional({ 
        type: [EnrollmentSessionDto],
        description: 'All enrollment sessions for this employee' 
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => EnrollmentSessionDto)
    allSessions?: EnrollmentSessionDto[];
}

export class UpdateEnrollmentProgressDto {
    @ApiProperty({ example: 'enroll:123:101_102_103:1691234567890' })
    @IsString()
    @IsNotEmpty()
    enrollmentBatchKey!: string;

    @ApiProperty({ example: 'addDependents' })
    @IsString()
    @IsNotEmpty()
    stepName!: 'login' | 'reviewBenefits' | 'addDependents' | 'selectTopUps' | 'submitEnrollment' | 'receiveConfirmation';

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    completed?: boolean;

    @ApiPropertyOptional({ example: [101, 102] })
    @IsOptional()
    @IsArray()
    policiesCompleted?: number[];
}

export class InitializeEnrollmentProgressDto {
    @ApiProperty({ example: 123 })
    @IsInt()
    employeeId!: number;

    @ApiProperty({ example: [101, 102, 103] })
    @IsArray()
    @IsInt({ each: true })
    policyIds!: number[];
}
