import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsInt } from 'class-validator';

export class ExtendEnrollmentPeriodDto {
    @ApiProperty({ example: 190550 })
    @IsInt()
    companyId!: number;

    @ApiProperty({ example: [4521, 4522, 4523], description: 'document_processing_file.id values for every policy shown under the enrollment period being extended' })
    @IsArray()
    @IsInt({ each: true })
    periodIds!: number[];

    @ApiProperty({ example: '2026-07-31', description: 'New enrollment_end_date — must be after the current date of every period in periodIds' })
    @IsDateString()
    newEndDate!: string;
}

export class ExtendEnrollmentPeriodResponseDto {
    @ApiProperty({ example: 14 })
    updatedPeriods!: number;

    @ApiProperty({ example: 132 })
    updatedEmployeeMappings!: number;

    @ApiProperty({ example: '2026-07-31' })
    newEndDate!: string;
}
