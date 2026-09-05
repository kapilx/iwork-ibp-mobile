import { MigrationInterface, QueryRunner } from "typeorm";

export class AddToBeMappedPostUploadToEndorsement1748390400000
  implements MigrationInterface
{
  name = "AddToBeMappedPostUploadToEndorsement1748390400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE endorsement
        ADD COLUMN IF NOT EXISTS to_be_mapped_post_upload_lid INT NOT NULL DEFAULT 9401
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE endorsement DROP COLUMN IF EXISTS to_be_mapped_post_upload_lid
    `);
  }
}
