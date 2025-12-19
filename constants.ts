
import { Deal, DealStatus, Seller } from './types';

export const SELLERS: Seller[] = [
  { id: 'sel-1', name: 'Andrés Mendoza' },
  { id: 'sel-2', name: 'Beatriz Salazar' },
  { id: 'sel-3', name: 'Carlos Ibáñez' },
  { id: 'sel-4', name: 'Daniela Torres' }
];

export const INITIAL_DEALS: Deal[] = [
  {
    id: '1',
    title: 'Acuerdo con Restaurante El Olivo',
    value: 12000,
    contactName: 'Carlos García',
    organization: 'El Olivo Gourmet',
    phone: '+57 300 123 4567',
    email: 'carlos@elolivo.com',
    address: 'Calle 45 #12-34, Bogotá',
    status: DealStatus.LEAD_IN,
    priority: 'high',
    activities: [],
    nextSteps: 'Llamar para confirmar degustación',
    createdAt: new Date().toISOString(),
    country: 'Colombia',
    sellerId: 'sel-1'
  },
  {
    id: '2',
    title: 'Suministro Cadena Foodie',
    value: 45000,
    contactName: 'Lucía Méndez',
    organization: 'Foodie Corp',
    phone: '+52 55 1234 5678',
    email: 'lucia.m@foodiecorp.mx',
    address: 'Av. Reforma 222, CDMX',
    status: DealStatus.CONTACTED,
    priority: 'medium',
    activities: [],
    nextSteps: 'Enviar catálogo de temporada',
    createdAt: new Date().toISOString(),
    country: 'México',
    sellerId: 'sel-2'
  }
];

export const PIPELINE_STAGES = [
  DealStatus.LEAD_IN,
  DealStatus.CONTACTED,
  DealStatus.MEETING_SCHEDULED,
  DealStatus.PROPOSAL_SENT,
  DealStatus.NEGOTIATING
];
