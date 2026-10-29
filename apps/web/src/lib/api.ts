export interface User {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string;
  global_role: string;
  is_active: boolean;
  created_at: string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  branding_color: string;
  currency: string;
  timezone: string;
}

export interface ClientContact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  job_title?: string;
  is_primary: boolean;
  user_id?: number;
}

export interface Client {
  id: number;
  organization_id: number;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  website?: string;
  billing_address?: string;
  tax_id?: string;
  status: string;
  currency: string;
  notes?: string;
  portal_enabled: boolean;
  created_at: string;
  contacts: ClientContact[];
}

export interface Milestone {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  order_index: number;
}

export interface Task {
  id: number;
  project_id: number;
  milestone_id?: number;
  assigned_user_id?: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  is_client_visible: boolean;
  due_date?: string;
  created_at: string;
}

export interface Deliverable {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  file_url?: string;
  status: string;
  client_feedback?: string;
  submitted_by_id?: number;
  approved_at?: string;
  created_at: string;
}

export interface Project {
  id: number;
  organization_id: number;
  client_id: number;
  client_name?: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  budget: number;
  currency: string;
  progress: number;
  start_date?: string;
  target_date?: string;
  created_at: string;
  milestones: Milestone[];
  tasks: Task[];
  deliverables: Deliverable[];
}

export interface ProposalItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Proposal {
  id: number;
  organization_id: number;
  client_id: number;
  client_name?: string;
  proposal_number: string;
  title: string;
  description?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  status: string;
  public_token: string;
  expires_at?: string;
  accepted_at?: string;
  accepted_by_name?: string;
  created_at: string;
  items: ProposalItem[];
}

export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_method: string;
  transaction_reference?: string;
  notes?: string;
  paid_at: string;
}

export interface Invoice {
  id: number;
  organization_id: number;
  client_id: number;
  client_name?: string;
  project_id?: number;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  currency: string;
  notes?: string;
  payment_terms?: string;
  created_at: string;
  items: InvoiceItem[];
  payments: Payment[];
}

export interface DocumentFile {
  id: number;
  title: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  category: string;
  client_id?: number;
  project_id?: number;
  is_client_visible: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_name: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata_json?: string;
  created_at: string;
}

const API_BASE = '/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('ocp_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('ocp_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('ocp_token');
  localStorage.removeItem('ocp_user');
  localStorage.removeItem('ocp_org_id');
}

export function getStoredUser(): User | null {
  const u = localStorage.getItem('ocp_user');
  return u ? JSON.parse(u) : null;
}

export function setStoredUser(user: User) {
  localStorage.setItem('ocp_user', JSON.stringify(user));
}

export function getActiveOrgId(): string | null {
  return localStorage.getItem('ocp_org_id');
}

export function setActiveOrgId(id: string) {
  localStorage.setItem('ocp_org_id', id);
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const orgId = getActiveOrgId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (orgId) {
    headers['X-Organization-Id'] = orgId;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(errorData.detail || `HTTP Error ${response.status}`);
  }

  return response.json();
}
