/**
 * Book Management Endpoint - Delete Book
 * Deletes a book after validating there are no active borrows.
 * Uses soft delete (sets deleted_at) to preserve historical data.
 */

import { Router, Request, Response } from 'express';
import { Book } from '../models/Book';
import { Copy } from '../models/Copy';
import { Borrowing } from '../models/Borrowing';

// In-memory data stores (replace with database in production)
const books: Map<number, Book> = new Map();
const copies: Map<number, Copy> = new Map();
const borrowings: Map<number, Borrowing> = new Map();

// Status ID indicating a copy is currently borrowed
const BORROWED_STATUS_ID = 2;

const router = Router();

/**
 * DELETE /:id - Delete a book by ID
 * Validates no copies are actively borrowed before deletion.
 */
router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
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

  // Get all copies belonging to this book
  const bookCopies = Array.from(copies.values()).filter(c => c.book_id === bookId);

  // Check if any copy is currently borrowed (prevents data integrity issues)
  const hasActiveBorrows = bookCopies.some(c => c.status_id === BORROWED_STATUS_ID);
  if (hasActiveBorrows) {
    return res.status(409).json({ error: 'Cannot delete book with active borrows' });
  }

  // Remove all copies associated with this book
  for (const copy of bookCopies) {
    copies.delete(copy.copy_id);
  }

  // Soft delete: set deleted_at timestamp to preserve historical records
  book.deleted_at = new Date();
  books.set(bookId, book);

  // Return 204 No Content on successful deletion
  res.status(204).send();
});

export default router;
