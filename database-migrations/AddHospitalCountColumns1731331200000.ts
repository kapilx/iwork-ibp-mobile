import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddHospitalCountColumns1731331200000 implements MigrationInterface {
  name = 'AddHospitalCountColumns1731331200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add network_hospital_count column
    await queryRunner.addColumn(
      'hospital_file_upload_tracking',
      new TableColumn({
        name: 'network_hospital_count',
        type: 'int',
        isNullable: false,
        default: 0,
        comment: 'Number of network hospitals processed successfully'
      })
    );

    // Add excluded_hospital_count column
    await queryRunner.addColumn(
      'hospital_file_upload_tracking',
      new TableColumn({
        name: 'excluded_hospital_count',
        type: 'int',
        isNullable: false,
        default: 0,
        comment: 'Number of excluded hospitals processed successfully'
      })
    );

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX idx_hospital_file_upload_tracking_network_count 
      ON hospital_file_upload_tracking(network_hospital_count);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_hospital_file_upload_tracking_excluded_count 
      ON hospital_file_upload_tracking(excluded_hospital_count);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_hospital_file_upload_tracking_network_count;
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_hospital_file_upload_tracking_excluded_count;
    `);

    // Drop columns
    await queryRunner.dropColumn('hospital_file_upload_tracking', 'excluded_hospital_count');
    await queryRunner.dropColumn('hospital_file_upload_tracking', 'network_hospital_count');
  }
}