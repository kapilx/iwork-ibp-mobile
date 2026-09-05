import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBypassEnrollmentColumns1715088000000 implements MigrationInterface {
  name = "AddBypassEnrollmentColumns1715088000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // A-1: document_processing_file
    await queryRunner.query(`
      ALTER TABLE document_processing_file
        ADD COLUMN IF NOT EXISTS bypass_policy_configuration BOOLEAN NOT NULL DEFAULT FALSE
    `);

    // A-2: policy_enrollment_employee
    await queryRunner.query(`
      ALTER TABLE policy_enrollment_employee
        ADD COLUMN IF NOT EXISTS bypass_premium_amount NUMERIC(19,2) NULL,
        ADD COLUMN IF NOT EXISTS bypass_sum_insured    NUMERIC(19,2) NULL
    `);

    // A-3: policy_enrollment_dependent
    await queryRunner.query(`
      ALTER TABLE policy_enrollment_dependent
        ADD COLUMN IF NOT EXISTS bypass_premium_amount NUMERIC(19,2) NULL,
        ADD COLUMN IF NOT EXISTS bypass_sum_insured    NUMERIC(19,2) NULL
    `);

    // A-4: policy_enrollment_upload_summary
    await queryRunner.query(`
      ALTER TABLE policy_enrollment_upload_summary
        ADD COLUMN IF NOT EXISTS premium_calculated BOOLEAN NOT NULL DEFAULT TRUE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE document_processing_file DROP COLUMN IF EXISTS bypass_policy_configuration
    `);
    await queryRunner.query(`
      ALTER TABLE policy_enrollment_employee
        DROP COLUMN IF EXISTS bypass_premium_amount,
        DROP COLUMN IF EXISTS bypass_sum_insured
    `);
    await queryRunner.query(`
      ALTER TABLE policy_enrollment_dependent
        DROP COLUMN IF EXISTS bypass_premium_amount,
        DROP COLUMN IF EXISTS bypass_sum_insured
    `);
    await queryRunner.query(`
      ALTER TABLE policy_enrollment_upload_summary
        DROP COLUMN IF EXISTS premium_calculated
    `);
  }
}
