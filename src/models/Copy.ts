export interface Copy {
  copy_id: number;
  copy_code: string; // backend-generated
  book_id: number;
  status_id: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null; // Soft delete as it maintains borrowing history integrity
}

// Extended interface with join data from status and books tables
// Base Copy fields remain required; only additional fields are optional
export interface CopyWithStatus extends Copy {
  status_name?: string; // From status table join
  book_title?: string; // From books table join
}
