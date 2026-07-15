import {
  AdminUser,
  ApiError,
  CreateCommentPayload,
  CreateTicketPayload,
  CreateUserPayload,
  LoginResponse,
  Status,
  Ticket,
  UpdateStatusPayload,
  UpdateTicketPayload,
  UpdateUserPayload,
  User,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
const TOKEN_KEY = 'supportdesk-token';

let authToken: string | null = null;

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined' && !authToken) {
    authToken = window.localStorage.getItem(TOKEN_KEY);
  }
  return authToken;
}

export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
    cache: 'no-store',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !path.includes('/auth/login')) {
      setAuthToken(null);
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        const redirect = encodeURIComponent(
          `${window.location.pathname}${window.location.search}`
        );
        window.location.href = `/login?redirect=${redirect}`;
      }
    }

    const error = data as ApiError;
    throw Object.assign(new Error(error.message ?? 'Request failed'), {
      status: response.status,
      ...error,
    });
  }

  return data as T;
}

export interface TicketsListResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
}

function normalizeTicketsResponse(data: unknown): TicketsListResponse {
  if (Array.isArray(data)) {
    return {
      tickets: data,
      total: data.length,
      page: 1,
      limit: data.length,
    };
  }

  const response = data as Partial<TicketsListResponse>;
  const tickets = Array.isArray(response.tickets) ? response.tickets : [];

  return {
    tickets,
    total: response.total ?? tickets.length,
    page: response.page ?? 1,
    limit: response.limit ?? 20,
  };
}

export function login(email: string, password: string) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getMe() {
  return request<{ user: User }>('/auth/me');
}

export function getTickets(
  params?: {
    search?: string;
    status?: string;
    priority?: string;
    assignedToId?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
  },
  signal?: AbortSignal
) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.assignedToId) query.set('assignedToId', params.assignedToId);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.sort) query.set('sort', params.sort);
  if (params?.order) query.set('order', params.order);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request<unknown>(`/tickets${suffix}`, { signal }).then(normalizeTicketsResponse);
}

export function getActiveUsers() {
  return request<User[]>('/users');
}

export function getAdminUsers() {
  return request<AdminUser[]>('/users');
}

export function getUsers() {
  return getActiveUsers();
}

export function getTransitions(status: Status) {
  return request<{ transitions: Status[] }>(`/tickets/transitions?status=${status}`);
}

export function createUser(payload: CreateUserPayload) {
  return request<AdminUser>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUser(id: string, payload: UpdateUserPayload) {
  return request<AdminUser>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deactivateUser(id: string) {
  return request<AdminUser>(`/users/${id}`, {
    method: 'DELETE',
  });
}

export function getTicket(id: string) {
  return request<Ticket>(`/tickets/${id}`);
}

export function createTicket(payload: CreateTicketPayload) {
  return request<Ticket>('/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTicket(id: string, payload: UpdateTicketPayload) {
  return request<Ticket>(`/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function updateTicketStatus(id: string, payload: UpdateStatusPayload) {
  return request<Ticket>(`/tickets/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function createComment(ticketId: string, payload: CreateCommentPayload) {
  return request(`/tickets/${ticketId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
