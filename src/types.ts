export type Role = 'admin' | 'hr' | 'manager' | 'employee' | 'Admin' | 'Hr' | 'Manager' | 'Employee' ;

export type LeaveType = 'casual' | 'sick' | 'earned';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveBalance {
  casual: number;
  sick: number;
  earned: number;
  updatedAt?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  password?: string;
  leaveBalance?: LeaveBalance;
  managerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Leave {
  _id: string;
  userId: string;
  userName?: string;
  type: LeaveType;
  from: string;
  to: string;
  status: LeaveStatus;
  reason?: string;
  validDays?: number;
  requiredApprovals?: Role[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  teamLeaves: Leave[];
  manager: User;
  members: User[];
  memberCount: number;
}

export interface RoleOption {
  value: Role;
  label: string;
  icon: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface CreateEmployeeForm {
  name: string;
  email: string;
  password: string;
  role: Role;
  managerId: string;
  casual: number;
  sick: number;
  earned: number;
}

export interface ApplyLeaveForm {
  type: LeaveType;
  from: string;
  to: string;
  reason: string;
}

export interface ReassignModal {
  show: boolean;
  employee: User | null;
  newManagerId: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface TeamsDataResponse {
  teams: Team[];
  unassignedEmployees: User[];
}

export interface TokenState {
  token: string;
  role: Role;
}

export interface LoginProps {
  setToken: (token: TokenState) => void;
}

export interface RegisterProps {
  setToken: (token: TokenState) => void;
}

export interface LeaveCalendarProps {
  leaves?: Leave[];
}

export interface CreateEmployeeProps {
  managers: User[];
  onCreated: () => void;
  onClose: () => void;
}

export interface ApplyLeaveProps {
  userId: string;
  onLeaveApplied: () => void;
  existingLeaves: Leave[];
}

export interface Stats {
  totalUsers: number;
  totalLeaves: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
}