/**
 * Book Management Endpoint - List All Book Copies
 * Retrieves all physical copies of a book with their current status (Available/Borrowed).
 */

import { Router, Request, Response } from 'express';
import { Book } from '../models/Book';
import { Copy, CopyWithStatus } from '../models/Copy';

// In-memory data stores (replace with database in production)
const books: Map<number, Book> = new Map();
const copies: Map<number, Copy> = new Map();

// Map status IDs to human-readable names
const STATUS_NAMES: Record<number, string> = {
  1: 'Available',
  2: 'Borrowed',
};

const router = Router();

/**
 * GET /:id/copies - List all copies for a specific book
 * Returns copies with status information and a summary count.
 */
router.get('/:id/copies', (req: Request<{ id: string }>, res: Response) => {
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

  // Enrich copies with status name and book title
  const copiesWithStatus: CopyWithStatus[] = bookCopies.map(c => ({
    ...c,
    status_name: STATUS_NAMES[c.status_id] || 'Unknown',
    book_title: book.book_title,
  }));

  // Calculate availability counts for summary
  const available = copiesWithStatus.filter(c => c.status_id === 1).length;
  const borrowed = copiesWithStatus.filter(c => c.status_id === 2).length;

  // Return copies with book info and summary statistics
  res.json({
    book_id: bookId,
    book_title: book.book_title,
    summary: {
      total: copiesWithStatus.length,
      available,
      borrowed,
    },
    copies: copiesWithStatus,
  });
});

export default router;
