import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Ticket, TicketStatus } from '../../ticket.model';
import { categoryDisplayLabel, statusDisplayLabel } from '../../ticket-labels';
import { TicketService } from '../../ticket.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-ticket-detail',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.scss'
})
export class TicketDetailComponent {
  private readonly ticketService = inject(TicketService);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);

  protected readonly ticket = signal<Ticket | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly isSaving = signal(false);

  protected readonly statuses = this.ticketService.statuses;
  protected readonly categoryDisplayLabel = categoryDisplayLabel;
  protected readonly statusDisplayLabel = statusDisplayLabel;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Identifiant de ticket manquant.');
      this.isLoading.set(false);
      return;
    }
    this.loadTicket(id);
  }

  private loadTicket(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.ticketService.getTicketById(id).subscribe({
      next: (data) => {
        this.ticket.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger ce ticket.');
        this.isLoading.set(false);
      }
    });
  }

  protected changeStatus(nextStatus: TicketStatus): void {
    const current = this.ticket();
    if (!current || current.status === nextStatus) {
      return;
    }

    this.isSaving.set(true);
    this.ticketService.updateStatus(current._id, nextStatus).subscribe({
      next: (updated) => {
        this.ticket.set(updated);
        this.isSaving.set(false);
      },
      error: () => {
        this.errorMessage.set('Échec de la mise à jour du statut.');
        this.isSaving.set(false);
      }
    });
  }

  protected takeTicket(): void {
    const current = this.ticket();
    if (!current) {
      return;
    }

    this.isSaving.set(true);
    this.ticketService.assignToMe(current._id).subscribe({
      next: (updated) => {
        this.ticket.set(updated);
        this.isSaving.set(false);
      },
      error: () => {
        this.errorMessage.set('Échec de l’assignation.');
        this.isSaving.set(false);
      }
    });
  }

  protected releaseTicket(): void {
    const current = this.ticket();
    if (!current) {
      return;
    }

    this.isSaving.set(true);
    this.ticketService.unassignTicket(current._id).subscribe({
      next: (updated) => {
        this.ticket.set(updated);
        this.isSaving.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de désassigner ce ticket.');
        this.isSaving.set(false);
      }
    });
  }

  protected isAssignedToMe(t: Ticket): boolean {
    const me = this.auth.currentUser();
    if (!me || !t.assignedTo) {
      return false;
    }
    return t.assignedTo._id === me.id;
  }
}
