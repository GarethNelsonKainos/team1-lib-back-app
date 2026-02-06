import { Request, Response } from 'express';
import {
  BookFilter,
  PagingInput,
  PagedResult,
  listBooks,
  updateBook,
} from '../services/book-service.js';
import { BookWithDetails, UpdateBookRequest } from '../models/Book.js';

type GetBooksQuery = {
  title?: string;
  author?: string;
  isbn?: string;
  genre?: string;
  year?: string;
  page?: string;
  pageSize?: string;
};

type GetBooksResponse = PagedResult<BookWithDetails>;

const toInt = (value: string | undefined, fallback: number) => {
  const num = parseInt(value || '', 10);
  return num > 0 ? num : fallback;
};

export const getBooks = async (
  req: Request<{}, GetBooksResponse, {}, GetBooksQuery>,
  res: Response<GetBooksResponse>
) => {
  try {
    const { title, author, isbn, genre, year, page, pageSize } = req.query;

    const result = await listBooks(
      {
        title: title?.trim(),
        author: author?.trim(),
        isbn: isbn?.trim(),
        genre: genre?.trim(),
        year: year ? parseInt(year, 10) : undefined,
      },
      {
        page: toInt(page, 1),
        pageSize: toInt(pageSize, 20),
      }
    );

    return res.json(result);
  } catch (error) {
    console.error('Error fetching books:');
    console.error(error);
    return res.status(500).json({
      data: [],
      paging: { page: 1, pageSize: 20, total: 0 },
    });
  }
};

type UpdateBookParams = {
  id: string;
};

type UpdateBookBody = UpdateBookRequest;

export const updateBookById = async (
  req: Request<UpdateBookParams, BookWithDetails | {}, UpdateBookBody>,
  res: Response<BookWithDetails | { error: string }>
) => {
  try {
    const bookId = parseInt(req.params.id, 10);

    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({ error: 'Invalid book ID' });
    }

    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No update fields provided' });
    }

    const updatedBook = await updateBook(bookId, updates);

    if (!updatedBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    return res.json(updatedBook);
  } catch (error) {
    console.error('Error updating book:');
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
