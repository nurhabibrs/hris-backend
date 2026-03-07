// data-source.ts
import { DataSourceOptions } from 'typeorm';
import { DataSource } from 'typeorm';

// Shared base options used by the NestJS app (no entity glob — autoLoadEntities handles it)
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME ?? '',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'hris_db',
  synchronize: false,
};

// CLI-only DataSource (used by migration:run, migration:generate, etc.)
export default new DataSource({
  ...dataSourceOptions,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
