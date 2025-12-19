
export enum DealStatus {
  LEAD_IN = 'Lead In',
  CONTACTED = 'Contactado',
  MEETING_SCHEDULED = 'Reunión Agendada',
  PROPOSAL_SENT = 'Propuesta Enviada',
  NEGOTIATING = 'Negociación',
  WON = 'Ganado',
  LOST = 'Perdido'
}

export type Country = 'Colombia' | 'México' | 'Otros';

export interface Seller {
  id: string;
  name: string;
  avatar?: string;
}

export interface Activity {
  id: string;
  type: 'Llamada' | 'Correo' | 'Reunión' | 'Nota';
  content: string;
  date: string;
  completed: boolean;
}

export interface Deal {
  id: string;
  title: string;
  value: number; // Base value (USD)
  valueCOP?: number;
  valueMXN?: number;
  contactName: string;
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
