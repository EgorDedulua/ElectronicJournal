import 'express-async-errors';
import 'reflect-metadata';
import { AppDataSource } from './config/data-source';
import express, { Application } from 'express';
import { config } from '@/config/config';
import adminRouter from './routers/adminRouter';
import authRouter from './routers/authRouter';
import { errorHandler } from './middlewares/errorMiddleware';
import cookieParser from 'cookie-parser';
import studentRouter from './routers/studentRouter';
import teacherRouter from './routers/teacherRouter';


const app: Application = express();
const PORT = config.PORT;
app.use(express.json());
app.use(cookieParser());
app.use('/api', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/student', studentRouter);
app.use('/api/teacher', teacherRouter);
app.use(errorHandler);

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
