import { BookWithDetails } from '../models/Book.js';
import { query } from '../config/database.js';

export interface BookFilter {
  title?: string;
  author?: string;
  isbn?: string;
  genre?: string;
  year?: number;
}

export interface PagingInput {
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  data: T[];
  paging: { page: number; pageSize: number; total: number };
}

const BOOK_SELECT = `
  b.book_id, b.book_title, b.isbn, b.publication_year, b.description, b.created_at, b.updated_at, b.deleted_at,
  COALESCE(json_agg(DISTINCT jsonb_build_object('author_id', a.author_id, 'name', a.name)) FILTER (WHERE a.author_id IS NOT NULL), '[]') as authors,
  COALESCE(json_agg(DISTINCT jsonb_build_object('genre_id', g.genre_id, 'name', g.name)) FILTER (WHERE g.genre_id IS NOT NULL), '[]') as genres,
  COUNT(DISTINCT c.copy_id)::int as copy_count,
  COUNT(DISTINCT c.copy_id) FILTER (WHERE s.status_name = 'Available')::int as available_copies
`;

const BOOK_JOINS = `
  LEFT JOIN book_authors ba ON b.book_id = ba.book_id
  LEFT JOIN authors a ON ba.author_id = a.author_id
  LEFT JOIN book_genres bg ON b.book_id = bg.book_id
  LEFT JOIN genres g ON bg.genre_id = g.genre_id
  LEFT JOIN copies c ON b.book_id = c.book_id AND c.deleted_at IS NULL
  LEFT JOIN status s ON c.status_id = s.status_id
`;

const insertAssociations = async (bookId: number, table: string, column: string, ids: number[]) => {
  await query(`DELETE FROM ${table} WHERE book_id = $1`, [bookId]);
  if (ids.length > 0) {
    const values = ids.map((_, idx) => `($1, $${idx + 2})`).join(', ');
    await query(`INSERT INTO ${table} (book_id, ${column}) VALUES ${values}`, [bookId, ...ids]);
  }
};

export const listBooks = async (filter: BookFilter, paging: PagingInput): Promise<PagedResult<BookWithDetails>> => {
  const conditions = ['b.deleted_at IS NULL'];
  const params: any[] = [];

  if (filter.title) {
    params.push(`%${filter.title.toLowerCase()}%`);
    conditions.push(`LOWER(b.book_title) LIKE $${params.length}`);
  }
  if (filter.author) {
    params.push(`%${filter.author.toLowerCase()}%`);
    conditions.push(`EXISTS (SELECT 1 FROM book_authors ba JOIN authors a ON ba.author_id = a.author_id WHERE ba.book_id = b.book_id AND LOWER(a.name) LIKE $${params.length})`);
  }
  if (filter.isbn) {
    params.push(`%${filter.isbn.toLowerCase()}%`);
    conditions.push(`LOWER(b.isbn) LIKE $${params.length}`);
  }
  if (filter.genre) {
    params.push(`%${filter.genre.toLowerCase()}%`);
    conditions.push(`EXISTS (SELECT 1 FROM book_genres bg JOIN genres g ON bg.genre_id = g.genre_id WHERE bg.book_id = b.book_id AND LOWER(g.name) LIKE $${params.length})`);
  }
  if (filter.year) {
    params.push(filter.year);
    conditions.push(`b.publication_year = $${params.length}`);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const total = parseInt((await query(`SELECT COUNT(*) as total FROM books b ${where}`, params)).rows[0].total, 10);
  
  params.push(paging.pageSize, (paging.page - 1) * paging.pageSize);
  const data = (await query(
    `SELECT ${BOOK_SELECT} FROM books b ${BOOK_JOINS} ${where} GROUP BY b.book_id ORDER BY b.book_title LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )).rows as BookWithDetails[];

  return { data, paging: { page: paging.page, pageSize: paging.pageSize, total } };
};

export const updateBook = async (
  bookId: number,
  updates: {
    book_title?: string;
    isbn?: string | null;
    publication_year?: number | null;
    description?: string | null;
    author_ids?: number[];
    genre_ids?: number[];
  }
): Promise<BookWithDetails | null> => {
  await query('BEGIN');
  try {
    const fields: string[] = [];
    const params: any[] = [];

      if (updates.book_title !== undefined) { params.push(updates.book_title); fields.push(`book_title = $${params.length}`); }
      if (updates.isbn !== undefined) { params.push(updates.isbn); fields.push(`isbn = $${params.length}`); }
      if (updates.publication_year !== undefined) { params.push(updates.publication_year); fields.push(`publication_year = $${params.length}`); }
      if (updates.description !== undefined) { params.push(updates.description); fields.push(`description = $${params.length}`); }

      if (fields.length > 0) {
        params.push(bookId);
        await query(
          `UPDATE books SET ${fields.join(', ')}, updated_at = NOW() WHERE book_id = $${params.length} AND deleted_at IS NULL`,
          params
        );
      }

      if (updates.author_ids !== undefined) {
        await insertAssociations(bookId, 'book_authors', 'author_id', updates.author_ids);
      }
      if (updates.genre_ids !== undefined) {
        await insertAssociations(bookId, 'book_genres', 'genre_id', updates.genre_ids);
      }

      await query('COMMIT');
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }
  return getBookById(bookId);
};

export const createBook = async (req: {
  book_title: string;
  isbn?: string;
  publication_year?: number;
  description?: string;
  author_ids?: number[];
  genre_ids?: number[];
}): Promise<BookWithDetails> => {
  await query('BEGIN');
  try {
    const insertResult = await query(
      `INSERT INTO books (book_title, isbn, publication_year, description) VALUES ($1, $2, $3, $4) RETURNING book_id`,
      [req.book_title, req.isbn || null, req.publication_year || null, req.description || null]
    );
    const bookId = insertResult.rows[0].book_id;

    if (req.author_ids?.length) {
      const values = req.author_ids.map((_, idx) => `($1, $${idx + 2})`).join(', ');
      await query(`INSERT INTO book_authors (book_id, author_id) VALUES ${values}`, [bookId, ...req.author_ids]);
    }
    if (req.genre_ids?.length) {
      const values = req.genre_ids.map((_, idx) => `($1, $${idx + 2})`).join(', ');
      await query(`INSERT INTO book_genres (book_id, genre_id) VALUES ${values}`, [bookId, ...req.genre_ids]);
    }

    const createdBookResult = await query(
      `SELECT ${BOOK_SELECT} FROM books b ${BOOK_JOINS} WHERE b.book_id = $1 GROUP BY b.book_id`,
      [bookId]
    );

    await query('COMMIT');
    return createdBookResult.rows[0] as BookWithDetails;
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
};

export const getBookById = async (bookId: number): Promise<BookWithDetails | null> => {
  const result = await query(
    `SELECT ${BOOK_SELECT} FROM books b ${BOOK_JOINS} WHERE b.book_id = $1 AND b.deleted_at IS NULL GROUP BY b.book_id`,
    [bookId]
  );
  return result.rows.length > 0 ? (result.rows[0] as BookWithDetails) : null;
};

export const deleteBook = async (bookId: number): Promise<{ success: boolean; error?: string }> => {
  const book = await getBookById(bookId);
  if (!book) {
    return { success: false, error: 'Book not found' };
  }

  const activeBorrows = await query(
    `SELECT COUNT(*) as count FROM borrowings br
     JOIN copies c ON br.copy_id = c.copy_id
     WHERE c.book_id = $1 AND br.returned_at IS NULL`,
    [bookId]
  );

  if (parseInt(activeBorrows.rows[0].count, 10) > 0) {
    return { success: false, error: 'Cannot delete book with active borrows' };
  }

  await query('UPDATE books SET deleted_at = NOW() WHERE book_id = $1', [bookId]);
  return { success: true };
};
