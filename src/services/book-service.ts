import db from "../config/db-conn.js";

export async function getAllBooks() {
    const sql = `
        SELECT 
        b.book_id,
        b.book_title,
        b.isbn,
        b.publication_year,
        b.description,
        STRING_AGG(DISTINCT a.name, ', ') AS authors,
        STRING_AGG(DISTINCT g.name, ', ') AS genres
      FROM books b
      LEFT JOIN book_authors ba ON b.book_id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.author_id
      LEFT JOIN book_genres bg ON b.book_id = bg.book_id
      LEFT JOIN genres g ON bg.genre_id = g.genre_id
      WHERE b.deleted_at IS NULL
      GROUP BY b.book_id
      ORDER BY b.book_title
    `;

    const result = await db.query(sql);
    return result.rows;
}
