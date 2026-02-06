import express from 'express';
import morgan from 'morgan';
import bookRouter from './routes/book-router.js';

const app = express();

app.use(morgan('tiny'));
app.use(express.json());

app.use('/api/v1/books', bookRouter);

export default app;