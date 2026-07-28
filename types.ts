
export enum DealStatus {
  LEAD_IN = 'Lead In',
  CONTACTED = 'Contactado',
  MEETING_SCHEDULED = 'Reunión Agendada',
  PROPOSAL_SENT = 'Propuesta Enviada',
  NEGOTIATING = 'Negociación',
  CLOSED = 'Cerrado',
  WON = 'Ganado',
  LOST = 'Perdido'
}

export type LeadCategory = 'Hot' | 'Warm' | 'Cold' | 'Unqualified';
export type Currency = 'COP' | 'USD' | 'MXN';

export interface LeadQualification {
  industry?: string;
  companySize?: string;
  budget?: number;
  interestLevel?: 'High' | 'Medium' | 'Low';
  aiScore?: number;
  aiCategory?: LeadCategory;
  aiReasoning?: string;
  aiNextSteps?: string[];
  feedback?: 'positive' | 'negative' | null;
}

export type Country = 'Colombia' | 'México' | 'Otros';

export interface Seller {
  id: string;
  name: string;
  password?: string;
  avatar?: string;
  role: 'admin' | 'seller';
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: 'Llamada' | 'Correo' | 'Reunión' | 'Nota';
  content: string;
  date: string; // Fecha de creación
  dueDate?: string; // Fecha programada para el calendario
  completed: boolean;
}

export interface Deal {
  id: string;
  title: string;
  value: number; 
  currency: Currency;
  contactId?: string; // Relación con contactos
  contactName: string; // Para compatibilidad rápida
  contactTitle?: string; // Cargo/puesto del contacto
  organization: string;
  phone: string;
  email: string;
  address: string;
  status: DealStatus;
  priority: 'low' | 'medium' | 'high';
  activities: Activity[];
  nextSteps: string;
  createdAt: string;
  country: Country;
  sellerId: string;
  qualification?: LeadQualification;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'seller';
  githubToken?: string;
  githubRepo?: string;
}

export interface GithubSyncState {
  isSyncing: boolean;
  lastSync: string | null;
  status: 'idle' | 'success' | 'error';
}