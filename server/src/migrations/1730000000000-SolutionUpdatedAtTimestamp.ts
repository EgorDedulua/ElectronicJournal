import { MigrationInterface, QueryRunner } from 'typeorm';

export class SolutionUpdatedAtTimestamp1730000000000 implements MigrationInterface {
    name = 'SolutionUpdatedAtTimestamp1730000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE solutions
            ALTER COLUMN updated_at TYPE TIMESTAMP USING updated_at::timestamp
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE solutions
            ALTER COLUMN updated_at TYPE DATE USING updated_at::date
        `);
    }
}
