import { Router } from 'express';
import { getBooks, getBook, createBookRecord, updateBookById, deleteBookById } from '../controllers/book-controllers.js';

const router = Router();

router.get('/', getBooks);
router.get('/:id', getBook);
router.post('/', createBookRecord);
router.put('/:id', updateBookById);
router.delete('/:id', deleteBookById);

export default router;
