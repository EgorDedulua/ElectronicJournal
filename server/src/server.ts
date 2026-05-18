import 'reflect-metadata';
import { AppDataSource } from './config/data-source';
import express, { Application } from 'express';
import dotenv from 'dotenv';
import { config } from '@/config/config';

dotenv.config();

const app: Application = express();
const PORT = config.PORT;

AppDataSource.initialize()
    .then(() => {
        console.log('База данных подключена');
        app.listen(PORT, () => {
            console.log('Сервер запущен');
        });
    })
    .catch((error) => {
        console.error(`Ошибка подключения базы данных: ${error}`);
    });
