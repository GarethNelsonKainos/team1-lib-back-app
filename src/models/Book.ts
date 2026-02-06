export interface Book {
  book_id: number;
  book_title: string;
  isbn: string | null;
  publication_year: number | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CreateBookRequest {
  book_title: string;
  isbn?: string;
  publication_year?: number;
  description?: string;
  author_ids?: number[];
  genre_ids?: number[];
}

export interface UpdateBookRequest {
  book_title?: string;
  isbn?: string | null;
  publication_year?: number | null;
  description?: string | null;
  author_ids?: number[];
  genre_ids?: number[];
}

export interface BookWithDetails extends Book {
  authors?: Array<{ author_id: number; name: string }>;
  genres?: Array<{ genre_id: number; name: string }>;
  copy_count?: number;
  available_copies?: number;
}
