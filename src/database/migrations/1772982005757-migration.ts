import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1772982005757 implements MigrationInterface {
  name = 'Migration1772982005757';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attendances" ADD "is_late" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "attendances"."is_late" IS 'apakah terlambat (check_in setelah 07:00)'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `COMMENT ON COLUMN "attendances"."is_late" IS 'apakah terlambat (check_in setelah 07:00)'`,
    );
    await queryRunner.query(`ALTER TABLE "attendances" DROP COLUMN "is_late"`);
  }
}
