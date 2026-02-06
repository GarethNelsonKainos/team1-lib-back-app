import { Router } from 'express';
import { getBooks, updateBookById } from '../controllers/book-controllers.js';

const router = Router();

router.get('/', getBooks);
router.put('/:id', updateBookById);

export default router;
