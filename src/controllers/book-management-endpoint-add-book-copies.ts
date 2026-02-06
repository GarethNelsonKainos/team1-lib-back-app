/**
 * Book Management Endpoint - Add Book Copies
 * Adds physical copies to an existing book in the library inventory.
 */

import { Router, Request, Response } from 'express';
import { Book } from '../models/Book';
import { Copy } from '../models/Copy';

// In-memory data stores (replace with database in production)
const books: Map<number, Book> = new Map();
const copies: Map<number, Copy> = new Map();

// Auto-increment ID counter for new copies
let nextCopyId = 1;

// Default status ID for new copies (Available)
const AVAILABLE_STATUS_ID = 1;

const router = Router();

/**
 * POST /:id/copies - Add physical copies to a book
 * Creates one or more copy records for the specified book.
 */
router.post('/:id/copies', (req: Request<{ id: string }>, res: Response) => {
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

  // Get quantity from request body (defaults to 1 copy)
  const quantity = req.body.quantity || 1;

  // Validate quantity is within acceptable range
  if (quantity < 1 || quantity > 100) {
    return res.status(400).json({ error: 'Quantity must be between 1 and 100' });
  }

  // Count existing copies to generate sequential copy codes
  const existingCopies = Array.from(copies.values()).filter(c => c.book_id === bookId);
  const existingCount = existingCopies.length;

  // Create the requested number of new copies
  const newCopies: Copy[] = [];
  for (let i = 0; i < quantity; i++) {
    // Generate unique copy code (format: BOOK-XXX-YYY)
    const copyCode = `BOOK-${bookId.toString().padStart(3, '0')}-${(existingCount + i + 1).toString().padStart(3, '0')}`;

    const newCopy: Copy = {
      copy_id: nextCopyId++,
      copy_code: copyCode,
      book_id: bookId,
      status_id: AVAILABLE_STATUS_ID,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    };

    // Store the new copy
    copies.set(newCopy.copy_id, newCopy);
    newCopies.push(newCopy);
  }

  // Return created copies with success message
  res.status(201).json({
    message: `${quantity} copy/copies added successfully`,
    copies: newCopies,
  });
});

export default router;
