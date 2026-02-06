export interface Member {
  member_id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
