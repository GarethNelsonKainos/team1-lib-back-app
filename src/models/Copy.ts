export interface Copy {
  copy_id: number;
  copy_code: string;
  book_id: number;
  status_id: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CopyWithStatus extends Copy {
  status_name?: string;
  book_title?: string;
}
