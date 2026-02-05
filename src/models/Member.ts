export interface Member {
  member_id: number;
  member_code: string;
  member_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface CreateMemberRequest {
  member_code: string;
  member_name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface MemberProfile extends Member {
  active_borrows?: number;
  total_borrows?: number;
  overdue_count?: number;
}
