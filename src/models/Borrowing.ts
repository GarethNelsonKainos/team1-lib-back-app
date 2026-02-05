export interface Borrowing {
  borrowing_id: number;
  copy_id: number;
  member_id: number;
  borrowed_at: Date;
  due_date: Date;
  returned_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBorrowingRequest {
  copy_id: number;
  member_id: number;
  due_date?: Date;
}

export interface BorrowingWithDetails extends Borrowing {
  book_title?: string;
  copy_code?: string;
  member_name?: string;
  is_overdue?: boolean;
}
