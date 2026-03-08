// data-source.ts
import { DataSourceOptions } from 'typeorm';
import { DataSource } from 'typeorm';

// for module
export const dataSourceOptions: DataSourceOptions = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  type: (process.env.DB_TYPE || 'postgres') as any,
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME ?? '',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'hris_db',
  synchronize: process.env.NODE_ENV === 'production',
};

// for migrations
export default new DataSource({
  ...dataSourceOptions,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
