import { Router } from 'express';
import { getAllBooks } from '../controllers/book-controller.js';

const bookRouter = Router();

bookRouter.get('/', getAllBooks);

export default bookRouter;