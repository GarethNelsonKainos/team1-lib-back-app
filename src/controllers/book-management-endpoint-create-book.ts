/**
 * Book Management Endpoint - Create Book
 * Creates a new book with title, author, ISBN, genre, publication year, and description.
 */

import { Router, Request, Response } from 'express';
import { Book, CreateBookRequest, BookWithDetails } from '../models/Book';

// In-memory data stores (replace with database in production)
const books: Map<number, Book> = new Map();
const bookAuthors: Map<number, number[]> = new Map();  // book_id -> author_ids
const bookGenres: Map<number, number[]> = new Map();   // book_id -> genre_ids

// Auto-incrementing ID counter
let nextId = 1;

const router = Router();

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
    book_id: nextId++,
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
    authors: author_ids?.map(id => ({ author_id: id, name: `Author ${id}` })),
    genres: genre_ids?.map(id => ({ genre_id: id, name: `Genre ${id}` })),
  };

  // Return created book with 201 status
  res.status(201).json(response);
});

export default router;
