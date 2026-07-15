export type Role = 'admin' | 'agent' | 'viewer';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AdminUser extends User {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  message: string;
  createdById: string;
  createdAt: string;
  createdBy: User;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  assignedToId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  assignedTo: User | null;
  comments?: Comment[];
}

export interface ApiError {
  error: string;
  message?: string;
  details?: string[];
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  priority: Priority;
  assignedToId?: string | null;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  priority?: Priority;
  assignedToId?: string | null;
}

export interface UpdateStatusPayload {
  status: Status;
}

export interface CreateCommentPayload {
  message: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  isActive?: boolean;
}
