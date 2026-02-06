import 'dotenv/config';
import express from 'express';
import { Request, Response, NextFunction } from 'express';
<<<<<<< book-management-endpoints
import bookRoutes from './routes/book-routes.js';
=======
import pool from './config/db-conn.js';
import membersRouter from './routes/members_route.js';  
>>>>>>> main

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.use('/members', membersRouter);

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.send('Hello, Librarian!');
});

<<<<<<< book-management-endpoints
app.use('/books', bookRoutes);

app.listen(PORT, () => {
=======
app.get('/books', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
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
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.listen(PORT, async () => {
>>>>>>> main
  console.log(`App is running on port ${PORT}`);

  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('Current timestamp:', result.rows[0].now);
  } catch (err) {
    console.error('❌ Database connection failed:', (err as Error).message);
  }
});