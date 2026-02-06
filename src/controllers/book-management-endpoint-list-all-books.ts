/**
 * Book Management Endpoint - List All Books
 * Retrieves all books with filtering and pagination support.
 */

import { Router, Request, Response } from 'express';
import { Book, BookWithDetails } from '../models/Book';

// In-memory data stores (replace with database in production)
const books: Map<number, Book> = new Map();
const bookAuthors: Map<number, string[]> = new Map();  // book_id -> author names

const router = Router();

/**
 * GET / - List all books with optional filters and pagination
 * Query params: title, author, isbn, genre, year, page, limit
 */
router.get('/', (req: Request, res: Response) => {
  // Extract query parameters with pagination defaults
  const { title, author, isbn, genre, year, page = '1', limit = '10' } = req.query;

  // Start with all books
  let result = Array.from(books.values());

  // Filter by title (case-insensitive partial match)
  if (title) {
    result = result.filter(b => b.book_title.toLowerCase().includes(String(title).toLowerCase()));
  }

  // Filter by author name (case-insensitive partial match)
  if (author) {
    const authorLower = String(author).toLowerCase();
    result = result.filter(b => {
      const authors = bookAuthors.get(b.book_id) || [];
      return authors.some(a => a.toLowerCase().includes(authorLower));
    });
  }

  // Filter by ISBN (partial match)
  if (isbn) {
    result = result.filter(b => b.isbn?.includes(String(isbn)));
  }

  // Filter by publication year (exact match)
  if (year) {
    result = result.filter(b => b.publication_year === parseInt(String(year)));
  }

  // Calculate pagination values
  const pageNum = parseInt(String(page));
  const limitNum = parseInt(String(limit));
  const total = result.length;
  const totalPages = Math.ceil(total / limitNum);

  // Slice results for current page
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedBooks = result.slice(startIndex, startIndex + limitNum);

  // Return paginated results with metadata
  res.json({
    data: paginatedBooks,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
  });
});

export default router;
