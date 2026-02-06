/**
 * Book Management Endpoint - Update Book Information
 * Updates an existing book's details (title, ISBN, publication year, description).
 */

import { Router, Request, Response } from 'express';
import { Book, CreateBookRequest } from '../models/Book';

// In-memory data store (replace with database in production)
const books: Map<number, Book> = new Map();

const router = Router();

/**
 * PUT /:id - Update book information
 * Accepts partial updates - only provided fields will be modified.
 */
router.put('/:id', (req: Request<{ id: string }>, res: Response) => {
  // Parse and validate the book ID from URL parameter
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: 'Invalid book ID' });
  }

  // Look up the existing book
  const book = books.get(bookId);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  // Extract updatable fields from request body
  const { book_title, isbn, publication_year, description }: Partial<CreateBookRequest> = req.body;

  // Update title if provided (cannot be empty)
  if (book_title !== undefined) {
    if (book_title.trim() === '') {
      return res.status(400).json({ error: 'Book title cannot be empty' });
    }
    book.book_title = book_title.trim();
  }

  // Update ISBN if provided (must be unique across all books)
  if (isbn !== undefined) {
    const duplicate = Array.from(books.values()).find(b => b.isbn === isbn && b.book_id !== bookId);
    if (duplicate) {
      return res.status(409).json({ error: 'A book with this ISBN already exists' });
    }
    book.isbn = isbn || null;
  }

  // Update publication year if provided (must be within valid range)
  if (publication_year !== undefined) {
    if (publication_year && (publication_year < 1000 || publication_year > new Date().getFullYear())) {
      return res.status(400).json({ error: 'Invalid publication year' });
    }
    book.publication_year = publication_year || null;
  }

  // Update description if provided
  if (description !== undefined) {
    book.description = description || null;
  }

  // Update the modification timestamp
  book.updated_at = new Date();

  // Persist the updated book
  books.set(bookId, book);

  // Return the updated book
  res.json(book);
});

export default router;
