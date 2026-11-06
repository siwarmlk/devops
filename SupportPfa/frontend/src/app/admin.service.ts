import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ticket } from './ticket.model';

export type AgentUser = {
  _id?: string;
  id?: string;
  username: string;
  role: 'support' | 'admin';
  createdAt?: string;
};

export type AdminDashboard = {
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  totalAgents: number;
  totalCategories: number;
  modelSupervision: ModelSupervision;
};

export type ModelSupervision = {
  modelName: string;
  version: string;
  status: string;
  accuracy: number;
  precision: number;
  recall: number;
  lastEvaluationAt: string | null;
  notes: string;
};

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:5000/api/admin';

  getDashboard() {
    return this.http.get<AdminDashboard>(`${this.apiBase}/dashboard`);
  }

  getTickets() {
    return this.http.get<Ticket[]>(`${this.apiBase}/tickets`);
  }

  updateTicket(ticketId: string, payload: Partial<Ticket>) {
    return this.http.patch<Ticket>(`${this.apiBase}/tickets/${ticketId}`, payload);
  }

  deleteTicket(ticketId: string) {
    return this.http.delete<{ ok: true; id: string }>(`${this.apiBase}/tickets/${ticketId}`);
  }

  getAgents() {
    return this.http.get<AgentUser[]>(`${this.apiBase}/agents`);
  }

  createAgent(username: string, password: string) {
    return this.http.post<AgentUser>(`${this.apiBase}/agents`, { username, password });
  }

  deleteAgent(agentId: string) {
    return this.http.delete<{ ok: true; id: string }>(`${this.apiBase}/agents/${agentId}`);
  }

  getCategories() {
    return this.http.get<{ categories: string[] }>(`${this.apiBase}/categories`);
  }

  updateCategories(categories: string[]) {
    return this.http.put<{ categories: string[] }>(`${this.apiBase}/categories`, { categories });
  }

  getModelSupervision() {
    return this.http.get<ModelSupervision>(`${this.apiBase}/model-supervision`);
  }

  updateModelSupervision(payload: Partial<ModelSupervision>) {
    return this.http.put<ModelSupervision>(`${this.apiBase}/model-supervision`, payload);
  }
}
