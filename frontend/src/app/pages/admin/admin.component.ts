import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, type ModelSupervision } from '../../admin.service';
import { categoryDisplayLabel, statusDisplayLabel } from '../../ticket-labels';
import { Ticket } from '../../ticket.model';

export type AdminView = 'dashboard' | 'agents' | 'tickets' | 'settings';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  private readonly adminService = inject(AdminService);
  protected readonly statusDisplayLabel = statusDisplayLabel;
  protected readonly categoryDisplayLabel = categoryDisplayLabel;
  protected readonly view = signal<AdminView>('dashboard');

  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly dashboard = signal<any>(null);
  protected readonly tickets = signal<Ticket[]>([]);
  protected readonly agents = signal<any[]>([]);
  protected readonly categoriesText = signal('');
  protected readonly model = signal<ModelSupervision | null>(null);

  protected readonly newAgent = { username: '', password: '' };

  constructor() {
    this.reloadAll();
  }

  protected setView(next: AdminView): void {
    this.view.set(next);
    this.error.set('');
    this.message.set('');
    if (next === 'tickets') this.loadTickets();
    if (next === 'agents') this.loadAgents();
    if (next === 'dashboard') this.loadDashboard();
    if (next === 'settings') {
      this.loadCategories();
      this.loadModelSupervision();
    }
  }

  protected reloadAll(): void {
    this.loadDashboard();
    this.loadTickets();
    this.loadAgents();
    this.loadCategories();
    this.loadModelSupervision();
  }

  private loadDashboard(): void {
    this.adminService.getDashboard().subscribe({
      next: (data) => this.dashboard.set(data),
      error: () => this.error.set('Impossible de charger le tableau de bord.')
    });
  }

  private loadTickets(): void {
    this.adminService.getTickets().subscribe({
      next: (data) => this.tickets.set(data),
      error: () => this.error.set('Impossible de charger les tickets.')
    });
  }

  private loadAgents(): void {
    this.adminService.getAgents().subscribe({
      next: (data) => this.agents.set(data),
      error: () => this.error.set('Impossible de charger les agents.')
    });
  }

  private loadCategories(): void {
    this.adminService.getCategories().subscribe({
      next: (data) => {
        this.categoriesText.set(data.categories.join('\n'));
      },
      error: () => this.error.set('Impossible de charger les catégories.')
    });
  }

  private loadModelSupervision(): void {
    this.adminService.getModelSupervision().subscribe({
      next: (data) => this.model.set(data),
      error: () => this.error.set('Impossible de charger la supervision du modèle.')
    });
  }

  protected deleteTicket(id: string): void {
    this.error.set('');
    this.message.set('');
    this.adminService.deleteTicket(id).subscribe({
      next: () => {
        this.message.set('Ticket supprimé.');
        this.loadTickets();
        this.loadDashboard();
      },
      error: () => this.error.set('Suppression du ticket impossible.')
    });
  }

  protected createAgent(): void {
    if (!this.newAgent.username.trim() || !this.newAgent.password) {
      this.error.set('Identifiant et mot de passe obligatoires.');
      return;
    }
    this.error.set('');
    this.message.set('');
    this.adminService.createAgent(this.newAgent.username, this.newAgent.password).subscribe({
      next: () => {
        this.message.set('Agent ajouté.');
        this.newAgent.username = '';
        this.newAgent.password = '';
        this.loadAgents();
        this.loadDashboard();
      },
      error: () => this.error.set('Création de l’agent impossible (identifiant déjà utilisé ?).')
    });
  }

  protected agentRowId(agent: { _id?: string; id?: string }): string {
    return agent._id ?? agent.id ?? '';
  }

  protected deleteAgent(id: string): void {
    if (!id) return;
    this.error.set('');
    this.message.set('');
    this.adminService.deleteAgent(id).subscribe({
      next: () => {
        this.message.set('Agent supprimé.');
        this.loadAgents();
        this.loadDashboard();
      },
      error: () => this.error.set('Suppression de l’agent impossible.')
    });
  }

  protected saveCategories(): void {
    const categories = this.categoriesText()
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);
    this.error.set('');
    this.message.set('');
    this.adminService.updateCategories(categories).subscribe({
      next: (data) => {
        this.categoriesText.set(data.categories.join('\n'));
        this.message.set('Catégories enregistrées.');
        this.loadDashboard();
      },
      error: () => this.error.set('Impossible de sauvegarder les catégories.')
    });
  }

  protected saveModelSupervision(): void {
    const model = this.model();
    if (!model) return;
    this.error.set('');
    this.message.set('');
    this.adminService.updateModelSupervision(model).subscribe({
      next: (saved) => {
        this.model.set(saved);
        this.message.set('Supervision du modèle enregistrée.');
      },
      error: () => this.error.set('Impossible d’enregistrer la supervision du modèle.')
    });
  }

}
