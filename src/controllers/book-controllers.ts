/**
 * Book Management Controllers
 * Combined endpoints for managing books, copies, and borrowing history.
 */

import { Router, Request, Response } from 'express';
import { Book, CreateBookRequest, BookWithDetails } from '../models/Book';
import { Copy, CopyWithStatus } from '../models/Copy';
import { Borrowing, BorrowingWithDetails } from '../models/Borrowing';

// =============================================================================
// IN-MEMORY DATA STORES (replace with database in production)
// =============================================================================

const books: Map<number, Book> = new Map();
const copies: Map<number, Copy> = new Map();
const borrowings: Map<number, Borrowing> = new Map();
const bookAuthors: Map<number, number[]> = new Map();  // book_id -> author_ids
const bookGenres: Map<number, number[]> = new Map();   // book_id -> genre_ids
const bookAuthorNames: Map<number, string[]> = new Map();  // book_id -> author names (for filtering)

// =============================================================================
// CONSTANTS
// =============================================================================

// Status IDs
const AVAILABLE_STATUS_ID = 1;
const BORROWED_STATUS_ID = 2;

// Map status IDs to human-readable names
const STATUS_NAMES: Record<number, string> = {
  1: 'Available',
  2: 'Borrowed',
};

// Auto-incrementing ID counters
let nextBookId = 1;
let nextCopyId = 1;

// =============================================================================
// ROUTER SETUP
// =============================================================================

const router = Router();

// =============================================================================
// BOOK ENDPOINTS
// =============================================================================

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
      const authors = bookAuthorNames.get(b.book_id) || [];
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

/**
 * POST / - Create a new book
 * Accepts book details and optional author/genre associations.
 */
router.post('/', (req: Request, res: Response) => {
  // Extract book data from request body
  const { book_title, isbn, publication_year, description, author_ids, genre_ids }: CreateBookRequest = req.body;

  // Validate required field: title
  if (!book_title || book_title.trim() === '') {
    return res.status(400).json({ error: 'Book title is required' });
  }

  // Validate publication year is within reasonable range
  if (publication_year && (publication_year < 1000 || publication_year > new Date().getFullYear())) {
    return res.status(400).json({ error: 'Invalid publication year' });
  }

  // Check for duplicate ISBN to maintain uniqueness
  if (isbn) {
    const duplicate = Array.from(books.values()).find(b => b.isbn === isbn);
    if (duplicate) {
      return res.status(409).json({ error: 'A book with this ISBN already exists' });
    }
  }

  // Create the new book object with timestamps
  const newBook: Book = {
    book_id: nextBookId++,
    book_title: book_title.trim(),
    isbn: isbn || null,
    publication_year: publication_year || null,
    description: description || null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  // Store the book in our data store
  books.set(newBook.book_id, newBook);

  // Associate authors with the book if provided
  if (author_ids && author_ids.length > 0) {
    bookAuthors.set(newBook.book_id, author_ids);
  }

  // Associate genres with the book if provided
  if (genre_ids && genre_ids.length > 0) {
    bookGenres.set(newBook.book_id, genre_ids);
  }

  // Build response with associations included
  const response: BookWithDetails = {
    ...newBook,
    authors: author_ids?.map((id: number) => ({ author_id: id, name: `Author ${id}` })),
    genres: genre_ids?.map((id: number) => ({ genre_id: id, name: `Genre ${id}` })),
  };

  // Return created book with 201 status
  res.status(201).json(response);
});

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

// =============================================================================
// COPY ENDPOINTS
// =============================================================================

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

// =============================================================================
// BORROWING HISTORY ENDPOINT
// =============================================================================

/**
 * GET /copies/:copyId/history - Get borrowing history for a specific copy
 * Returns all past and current borrows with overdue indicators.
 */
router.get('/copies/:copyId/history', (req: Request<{ copyId: string }>, res: Response) => {
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
