import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ticket, TicketCategory, TicketStatus, TrackedTicketPublic } from './ticket.model';

export type CreatePublicTicketPayload = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  title: string;
  description: string;
  category?: TicketCategory;
};

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  /** Appels directs vers le backend (CORS activé côté Express). */
  private readonly apiBase = 'http://localhost:5000/api';

  readonly statuses: TicketStatus[] = [
    'To Do',
    'In Progress',
    'Waiting for Customer',
    'Resolved',
    'Closed'
  ];

  readonly categories: TicketCategory[] = [
    'Authentification',
    'Support technique',
    'Reseau',
    'Materiel',
    'Logiciel',
    'Messagerie',
    'Securite',
    'Gestion des comptes',
    'Information',
    'Reclamation',
    'Demande de service',
    'Urgence'
  ];

  getPublicCategories() {
    return this.http.get<{ categories: TicketCategory[] }>(`${this.apiBase}/public/categories`);
  }

  getTickets() {
    return this.http.get<Ticket[]>(`${this.apiBase}/tickets`);
  }

  getTicketById(id: string) {
    return this.http.get<Ticket>(`${this.apiBase}/tickets/${id}`);
  }

  createPublicTicket(payload: CreatePublicTicketPayload) {
    return this.http.post<Ticket>(`${this.apiBase}/public/tickets`, payload);
  }

  getTicketByTrackingCode(code: string) {
    const encoded = encodeURIComponent(code.trim());
    return this.http.get<TrackedTicketPublic>(`${this.apiBase}/public/tickets/track/${encoded}`);
  }

  updateStatus(ticketId: string, status: TicketStatus) {
    return this.http.patch<Ticket>(`${this.apiBase}/tickets/${ticketId}/status`, { status });
  }

  assignToMe(ticketId: string) {
    return this.http.patch<Ticket>(`${this.apiBase}/tickets/${ticketId}/assign`, {});
  }

  unassignTicket(ticketId: string) {
    return this.http.patch<Ticket>(`${this.apiBase}/tickets/${ticketId}/assign`, { unassign: true });
  }
}
