import { Request, Response } from 'express';
import { listBooks, updateBook, createBook, getBookById, deleteBook } from '../services/book-service.js';
import { BookWithDetails, UpdateBookRequest, CreateBookRequest } from '../models/Book.js';

export const getBooks = async (req: Request, res: Response) => {
  try {
    const { title, author, isbn, genre, year, page, pageSize } = req.query as Record<string, string | undefined>;
    const result = await listBooks(
      { title: title?.trim(), author: author?.trim(), isbn: isbn?.trim(), genre: genre?.trim(), year: year ? parseInt(year, 10) : undefined },
      { page: Math.max(parseInt(page || '1'), 1), pageSize: Math.max(parseInt(pageSize || '20'), 1) }
    );
    res.json(result);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ data: [], paging: { page: 1, pageSize: 20, total: 0 } });
  }
};

export const createBookRecord = async (req: Request, res: Response) => {
  try {
    if (!req.body.book_title?.trim()) {
      return res.status(400).json({ error: 'Book title is required' });
    }
    const newBook = await createBook(req.body);
    res.status(201).json(newBook);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBook = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({ error: 'Invalid book ID' });
    }
    const book = await getBookById(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBookById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({ error: 'Invalid book ID' });
    }
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'No update fields provided' });
    }
    const updatedBook = await updateBook(bookId, req.body);
    if (!updatedBook) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(updatedBook);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteBookById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({ error: 'Invalid book ID' });
    }
    const result = await deleteBook(bookId);
    if (!result.success) {
      return res.status(result.error === 'Book not found' ? 404 : 400).json({ error: result.error });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
