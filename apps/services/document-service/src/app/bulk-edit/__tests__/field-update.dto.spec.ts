import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { FieldUpdateDto } from '../dto/field-update.dto';
import { FieldOperation } from '../enums/field-operation.enum';

describe('FieldUpdateDto', () => {
    describe('Validation', () => {
        it('should pass validation with valid SET operation', async () => {
            const fieldUpdate = plainToClass(FieldUpdateDto, {
                fieldName: 'status',
                newValue: 'active',
                operation: FieldOperation.SET
            });

            const errors = await validate(fieldUpdate);
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with valid CLEAR operation', async () => {
            const fieldUpdate = plainToClass(FieldUpdateDto, {
                fieldName: 'status',
                newValue: null,
                operation: FieldOperation.CLEAR
            });

            const errors = await validate(fieldUpdate);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when fieldName is empty', async () => {
            const fieldUpdate = plainToClass(FieldUpdateDto, {
                fieldName: '',
                newValue: 'active',
                operation: FieldOperation.SET
            });

            const errors = await validate(fieldUpdate);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('fieldName');
        });

        it('should fail validation when newValue is empty for SET operation', async () => {
            const fieldUpdate = plainToClass(FieldUpdateDto, {
                fieldName: 'status',
                newValue: null,
                operation: FieldOperation.SET
            });

            const errors = await validate(fieldUpdate);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('newValue');
            expect(errors[0].constraints?.isNotEmpty).toBe('newValue is required when operation is SET');
        });

        it('should fail validation with invalid operation', async () => {
            const fieldUpdate = plainToClass(FieldUpdateDto, {
                fieldName: 'status',
                newValue: 'active',
                operation: 'invalid' as FieldOperation
            });

            const errors = await validate(fieldUpdate);
            expect(errors).toHaveLength(1);
            expect(errors[0].property).toBe('operation');
            expect(errors[0].constraints?.isEnum).toBe('operation must be either "set" or "clear"');
        });

        it('should handle different value types correctly', async () => {
            const testCases = [
                { newValue: 'string value', operation: FieldOperation.SET },
                { newValue: 123, operation: FieldOperation.SET },
                { newValue: true, operation: FieldOperation.SET },
                { newValue: false, operation: FieldOperation.SET }
            ];

            for (const testCase of testCases) {
                const fieldUpdate = plainToClass(FieldUpdateDto, {
                    fieldName: 'testField',
                    ...testCase
                });

                const errors = await validate(fieldUpdate);
                expect(errors).toHaveLength(0);
            }
        });
    });
});