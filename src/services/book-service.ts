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
  paging: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export const listBooks = async (
  filter: BookFilter,
  paging: PagingInput
): Promise<PagedResult<BookWithDetails>> => {
  const conditions = ['b.deleted_at IS NULL'];
  const params: any[] = [];

  if (filter.title) {
    params.push(`%${filter.title.toLowerCase()}%`);
    conditions.push(`LOWER(b.book_title) LIKE $${params.length}`);
  }

  if (filter.author) {
    params.push(`%${filter.author.toLowerCase()}%`);
    conditions.push(`EXISTS (
      SELECT 1 FROM book_authors ba
      JOIN authors a ON ba.author_id = a.author_id
      WHERE ba.book_id = b.book_id AND LOWER(a.name) LIKE $${params.length}
    )`);
  }

  if (filter.isbn) {
    params.push(`%${filter.isbn.toLowerCase()}%`);
    conditions.push(`LOWER(b.isbn) LIKE $${params.length}`);
  }

  if (filter.genre) {
    params.push(`%${filter.genre.toLowerCase()}%`);
    conditions.push(`EXISTS (
      SELECT 1 FROM book_genres bg
      JOIN genres g ON bg.genre_id = g.genre_id
      WHERE bg.book_id = b.book_id AND LOWER(g.name) LIKE $${params.length}
    )`);
  }

  if (filter.year) {
    params.push(filter.year);
    conditions.push(`b.publication_year = $${params.length}`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await query(
    `SELECT COUNT(*) as total FROM books b ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const offset = (paging.page - 1) * paging.pageSize;
  const dataResult = await query(
    `SELECT 
      b.book_id,
      b.book_title,
      b.isbn,
      b.publication_year,
      b.description,
      b.created_at,
      b.updated_at,
      b.deleted_at,
      COALESCE(json_agg(DISTINCT jsonb_build_object('author_id', a.author_id, 'name', a.name)) 
        FILTER (WHERE a.author_id IS NOT NULL), '[]') as authors,
      COALESCE(json_agg(DISTINCT jsonb_build_object('genre_id', g.genre_id, 'name', g.name)) 
        FILTER (WHERE g.genre_id IS NOT NULL), '[]') as genres,
      COUNT(DISTINCT c.copy_id)::int as copy_count,
      COUNT(DISTINCT c.copy_id) FILTER (WHERE s.status_name = 'Available')::int as available_copies
    FROM books b
    LEFT JOIN book_authors ba ON b.book_id = ba.book_id
    LEFT JOIN authors a ON ba.author_id = a.author_id
    LEFT JOIN book_genres bg ON b.book_id = bg.book_id
    LEFT JOIN genres g ON bg.genre_id = g.genre_id
    LEFT JOIN copies c ON b.book_id = c.book_id AND c.deleted_at IS NULL
    LEFT JOIN status s ON c.status_id = s.status_id
    ${whereClause}
    GROUP BY b.book_id, b.book_title, b.isbn, b.publication_year, b.description, b.created_at, b.updated_at, b.deleted_at
    ORDER BY b.book_title
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, paging.pageSize, offset]
  );

  return {
    data: dataResult.rows as BookWithDetails[],
    paging: { page: paging.page, pageSize: paging.pageSize, total },
  };
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
  const fields: string[] = [];
  const params: any[] = [];

  if (updates.book_title !== undefined) {
    params.push(updates.book_title);
    fields.push(`book_title = $${params.length}`);
  }

  if (updates.isbn !== undefined) {
    params.push(updates.isbn);
    fields.push(`isbn = $${params.length}`);
  }

  if (updates.publication_year !== undefined) {
    params.push(updates.publication_year);
    fields.push(`publication_year = $${params.length}`);
  }

  if (updates.description !== undefined) {
    params.push(updates.description);
    fields.push(`description = $${params.length}`);
  }

  if (fields.length === 0 && !updates.author_ids && !updates.genre_ids) {
    return null;
  }

  params.push(new Date());
  fields.push(`updated_at = $${params.length}`);
  
  params.push(bookId);
  const bookIdParam = params.length;

  if (fields.length > 0) {
    const updateResult = await query(
      `UPDATE books SET ${fields.join(', ')} WHERE book_id = $${bookIdParam} AND deleted_at IS NULL RETURNING *`,
      params
    );

    if (updateResult.rows.length === 0) {
      return null;
    }
  }

  if (updates.author_ids !== undefined) {
    await query('DELETE FROM book_authors WHERE book_id = $1', [bookId]);
    
    if (updates.author_ids.length > 0) {
      const values = updates.author_ids.map((authorId, idx) => 
        `($1, $${idx + 2})`
      ).join(', ');
      await query(
        `INSERT INTO book_authors (book_id, author_id) VALUES ${values}`,
        [bookId, ...updates.author_ids]
      );
    }
  }

  if (updates.genre_ids !== undefined) {
    await query('DELETE FROM book_genres WHERE book_id = $1', [bookId]);
    
    if (updates.genre_ids.length > 0) {
      const values = updates.genre_ids.map((genreId, idx) => 
        `($1, $${idx + 2})`
      ).join(', ');
      await query(
        `INSERT INTO book_genres (book_id, genre_id) VALUES ${values}`,
        [bookId, ...updates.genre_ids]
      );
    }
  }

  const result = await query(
    `SELECT 
      b.book_id,
      b.book_title,
      b.isbn,
      b.publication_year,
      b.description,
      b.created_at,
      b.updated_at,
      b.deleted_at,
      COALESCE(json_agg(DISTINCT jsonb_build_object('author_id', a.author_id, 'name', a.name)) 
        FILTER (WHERE a.author_id IS NOT NULL), '[]') as authors,
      COALESCE(json_agg(DISTINCT jsonb_build_object('genre_id', g.genre_id, 'name', g.name)) 
        FILTER (WHERE g.genre_id IS NOT NULL), '[]') as genres,
      COUNT(DISTINCT c.copy_id)::int as copy_count,
      COUNT(DISTINCT c.copy_id) FILTER (WHERE s.status_name = 'Available')::int as available_copies
    FROM books b
    LEFT JOIN book_authors ba ON b.book_id = ba.book_id
    LEFT JOIN authors a ON ba.author_id = a.author_id
    LEFT JOIN book_genres bg ON b.book_id = bg.book_id
    LEFT JOIN genres g ON bg.genre_id = g.genre_id
    LEFT JOIN copies c ON b.book_id = c.book_id AND c.deleted_at IS NULL
    LEFT JOIN status s ON c.status_id = s.status_id
    WHERE b.book_id = $1 AND b.deleted_at IS NULL
    GROUP BY b.book_id`,
    [bookId]
  );

  return result.rows.length > 0 ? (result.rows[0] as BookWithDetails) : null;
};
