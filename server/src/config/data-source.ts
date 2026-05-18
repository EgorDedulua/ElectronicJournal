import { DataSource } from 'typeorm';
import { config } from './config';

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: config.DATABASE_URL,
    synchronize: false,
    logging: true,
    entities: [__dirname + '/../entities/**/*.ts'],
    migrations: [__dirname + '/../migrations/**/*.ts'],
    subscribers: []
});