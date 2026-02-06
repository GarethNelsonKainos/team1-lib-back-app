export interface Member {
  member_id: number;
  member_code: string; // backend-generated
  member_name: string;
  email: string; // At least 1 contact address required
  phone: string | null;
  address: string // Required
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null; // Soft delete as it maintains borrowing history integrity
}

// Extended interface with computed statistics from borrowings table
// These fields are aggregations and may not always be populated
export interface MemberProfile extends Member {
  active_borrows?: number; // Computed: Count of current unreturned borrowings
  total_borrows?: number; // Computed: Historical count of all borrowings
  overdue_count?: number; // Computed: Count of overdue borrowings
}
