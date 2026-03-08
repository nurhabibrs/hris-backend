import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1772957085090 implements MigrationInterface {
  name = 'Migration1772957085090';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "positions" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_17e4e62ccd5749b289ae3fae6f3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "attendances" ("id" SERIAL NOT NULL, "attendance_date" date NOT NULL, "check_in" TIMESTAMP WITH TIME ZONE, "check_out" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "UQ_1c12a73d70b4166e22f757dc2b3" UNIQUE ("user_id", "attendance_date"), CONSTRAINT "PK_483ed97cd4cd43ab4a117516b69" PRIMARY KEY ("id")); COMMENT ON COLUMN "attendances"."attendance_date" IS 'tanggal presensi'; COMMENT ON COLUMN "attendances"."check_in" IS 'waktu kehadiran'; COMMENT ON COLUMN "attendances"."check_out" IS 'waktu pulang'`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" SERIAL NOT NULL, "message" text NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('employee', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "phone_number" character varying, "photo_url" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'employee', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "position_id" integer, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")); COMMENT ON COLUMN "users"."name" IS 'nama karyawan'; COMMENT ON COLUMN "users"."email" IS 'email karyawan'; COMMENT ON COLUMN "users"."password" IS 'password hash'; COMMENT ON COLUMN "users"."phone_number" IS 'nomor telepon karyawan'; COMMENT ON COLUMN "users"."photo_url" IS 'URL foto karyawan'; COMMENT ON COLUMN "users"."role" IS 'role karyawan'`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendances" ADD CONSTRAINT "FK_aa902e05aeb5fde7c1dd4ced2b7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_8e29a9d2f1fa57ebf1a4ce17353" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_8e29a9d2f1fa57ebf1a4ce17353"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendances" DROP CONSTRAINT "FK_aa902e05aeb5fde7c1dd4ced2b7"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "attendances"`);
    await queryRunner.query(`DROP TABLE "positions"`);
  }
}
