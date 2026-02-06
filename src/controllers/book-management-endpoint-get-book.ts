/**
 * Book Management Endpoint - Get Book Details
 * Retrieves a single book's details including its available copies.
 */

import { Router, Request, Response } from 'express';
import { Book, BookWithDetails } from '../models/Book';
import { Copy, CopyWithStatus } from '../models/Copy';

// In-memory data stores (replace with database in production)
const books: Map<number, Book> = new Map();
const copies: Map<number, Copy> = new Map();

// Status ID constant for available copies
const AVAILABLE_STATUS_ID = 1;

const router = Router();

/**
 * GET /:id - Retrieve book details by ID
 * Returns book information along with copy availability stats and copy details.
 */
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  // Parse and validate the book ID from URL parameter
  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: 'Invalid book ID' });
  }

  // Look up the book in our data store
  const book = books.get(bookId);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  // Get all copies belonging to this book
  const bookCopies = Array.from(copies.values()).filter(c => c.book_id === bookId);

  // Count available copies for quick reference
  const availableCopies = bookCopies.filter(c => c.status_id === AVAILABLE_STATUS_ID);

  // Build enriched book details with copy counts
  const bookDetails: BookWithDetails = {
    ...book,
    copy_count: bookCopies.length,
    available_copies: availableCopies.length,
  };

  // Map copies to include status name and book title
  const copyDetails: CopyWithStatus[] = bookCopies.map(c => ({
    ...c,
    status_name: c.status_id === AVAILABLE_STATUS_ID ? 'Available' : 'Borrowed',
    book_title: book.book_title,
  }));

  // Return combined book and copy information
  res.json({
    book: bookDetails,
    copies: copyDetails,
  });
});

export default router;
