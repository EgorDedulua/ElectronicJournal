export type UserRole = 'admin' | 'teacher' | 'student';

export interface UserProfile {
  id: number;
  fullName: string;
  role: UserRole;
  groupId?: number;
  groupName?: string;
  isExpelled: boolean;
}

export interface Student {
  id: number;
  fullName: string;
  groupId?: number;
  groupName?: string;
  isExpelled?: boolean;
}
