import { DataSource } from 'typeorm';
import { config } from './config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: config.DATABASE_URL,
    synchronize: false,
    logging: true,
    namingStrategy: new SnakeNamingStrategy(),
    entities: [__dirname + '/../entities/**/*.ts'],
    migrations: [__dirname + '/../migrations/**/*.ts'],
    subscribers: []
});