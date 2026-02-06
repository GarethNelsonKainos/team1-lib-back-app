export interface Copy {
  copy_id: number;
  copy_code: string;
  book_id: number;
  status_id: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CreateCopyRequest {
  copy_code: string;
  status_id?: number; // defaults to 1 (Available)
}

export interface CopyWithStatus extends Copy {
  status_name?: string;
  book_title?: string;
}
