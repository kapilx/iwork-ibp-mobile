import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCompanyEmployeeIdToClaim1751356800000 implements MigrationInterface {
  name = 'AddCompanyEmployeeIdToClaim1751356800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE policy_claim ALTER COLUMN employee_tpa_id DROP NOT NULL`
    );

    await queryRunner.addColumn(
      'policy_claim',
      new TableColumn({
        name: 'company_employee_id',
        type: 'varchar',
        length: '100',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('policy_claim', 'company_employee_id');
    // NOTE: restoring NOT NULL on employee_tpa_id is intentionally omitted here
    // because rows inserted after the up() migration may have null values.
  }
}
