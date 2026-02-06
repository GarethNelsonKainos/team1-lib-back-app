// Simplified types for related entities
export interface Author {
  author_id: number;
  name: string;
}

export interface Genre {
  genre_id: number;
  name: string;
}

export interface Book {
  book_id: number;
  book_title: string;
  isbn: string | null; // books published before 1970 may not have ISBNs
  publication_year: number | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null; // Soft delete to maintain borrowing history integrity
}

// Extended interface with related data from join tables
export interface BookWithDetails extends Book {
  authors?: Author[];
  genres?: Genre[];
  copy_count?: number;
  available_copies?: number;
}
