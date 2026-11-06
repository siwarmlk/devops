import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Ticket, TicketStatus } from '../../ticket.model';
import { categoryDisplayLabel, statusDisplayLabel } from '../../ticket-labels';
import { TicketService } from '../../ticket.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-kanban',
  imports: [FormsModule, RouterLink],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.scss'
})
export class KanbanComponent {
  private readonly ticketService = inject(TicketService);
  protected readonly auth = inject(AuthService);

  protected readonly categoryDisplayLabel = categoryDisplayLabel;
  protected readonly statusDisplayLabel = statusDisplayLabel;
  protected readonly statuses = this.ticketService.statuses;
  protected readonly tickets = signal<Ticket[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly totalTickets = computed(() => this.tickets().length);

  constructor() {
    this.loadTickets();
  }

  protected loadTickets(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.ticketService.getTickets().subscribe({
      next: (data) => {
        this.tickets.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger les tickets. L’API est-elle démarrée ?');
        this.isLoading.set(false);
      }
    });
  }

  protected moveTicket(ticket: Ticket, nextStatus: TicketStatus): void {
    if (ticket.status === nextStatus) {
      return;
    }

    this.ticketService.updateStatus(ticket._id, nextStatus).subscribe({
      next: (updatedTicket) => {
        const updatedList = this.tickets().map((item) =>
          item._id === updatedTicket._id ? updatedTicket : item
        );
        this.tickets.set(updatedList);
      },
      error: () => {
        this.errorMessage.set('Échec de la mise à jour du statut.');
      }
    });
  }

  protected takeTicket(ticket: Ticket): void {
    this.ticketService.assignToMe(ticket._id).subscribe({
      next: (updatedTicket) => {
        const updatedList = this.tickets().map((item) =>
          item._id === updatedTicket._id ? updatedTicket : item
        );
        this.tickets.set(updatedList);
      },
      error: () => {
        this.errorMessage.set('Impossible d’assigner ce ticket.');
      }
    });
  }

  protected ticketsByStatus(status: TicketStatus): Ticket[] {
    return this.tickets().filter((ticket) => ticket.status === status);
  }

  protected canTake(ticket: Ticket): boolean {
    return !ticket.assignedTo;
  }
}
