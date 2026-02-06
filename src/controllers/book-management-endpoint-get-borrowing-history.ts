/**
 * Book Management Endpoint - Get Borrowing History
 * Retrieves the complete borrowing history for a specific physical copy.
 */

import { Router, Request, Response } from 'express';
import { Book } from '../models/Book';
import { Copy, CopyWithStatus } from '../models/Copy';
import { Borrowing, BorrowingWithDetails } from '../models/Borrowing';

// In-memory data stores (replace with database in production)
const books: Map<number, Book> = new Map();
const copies: Map<number, Copy> = new Map();
const borrowings: Map<number, Borrowing> = new Map();

// Map status IDs to human-readable names
const STATUS_NAMES: Record<number, string> = {
  1: 'Available',
  2: 'Borrowed',
};

const router = Router();

/**
 * GET /:copyId/history - Get borrowing history for a specific copy
 * Returns all past and current borrows with overdue indicators.
 */
router.get('/:copyId/history', (req: Request<{ copyId: string }>, res: Response) => {
  // Parse and validate the copy ID from URL parameter
  const copyId = parseInt(req.params.copyId);
  if (isNaN(copyId)) {
    return res.status(400).json({ error: 'Invalid copy ID' });
  }

  // Look up the existing copy
  const copy = copies.get(copyId);
  if (!copy) {
    return res.status(404).json({ error: 'Copy not found' });
  }

  // Get the associated book for title information
  const book = books.get(copy.book_id);

  // Filter all borrowings to find those for this copy
  const copyBorrowings = Array.from(borrowings.values()).filter(b => b.copy_id === copyId);

  // Enrich borrowings with book/copy details and overdue status
  const borrowingHistory: BorrowingWithDetails[] = copyBorrowings.map(b => ({
    ...b,
    book_title: book?.book_title,
    copy_code: copy.copy_code,
    is_overdue: !b.returned_at && new Date(b.due_date) < new Date(),
  }));

  // Sort by borrow date (most recent first)
  borrowingHistory.sort((a, b) => new Date(b.borrowed_at).getTime() - new Date(a.borrowed_at).getTime());

  // Return copy info with complete borrowing history
  res.json({
    copy_id: copy.copy_id,
    copy_code: copy.copy_code,
    book_id: copy.book_id,
    book_title: book?.book_title || 'Unknown',
    current_status: STATUS_NAMES[copy.status_id] || 'Unknown',
    total_borrows: borrowingHistory.length,
    history: borrowingHistory,
  });
});

export default router;
