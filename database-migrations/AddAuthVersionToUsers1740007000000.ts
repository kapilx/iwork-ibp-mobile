import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthVersionToUsers1740007000000 implements MigrationInterface {
  name = 'AddAuthVersionToUsers1740007000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "auth_version" bigint NOT NULL DEFAULT 1
    `);
    
    await queryRunner.query(`
      CREATE INDEX "idx_users_auth_version" ON "users" ("auth_version")
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "users"."auth_version" IS 'Version number for authentication invalidation. Incremented when user roles or permissions change.'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_users_auth_version"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "auth_version"`);
  }
}