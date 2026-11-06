import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketStatus, TrackedTicketPublic } from '../../ticket.model';
import { categoryDisplayLabel, statusDisplayLabel } from '../../ticket-labels';
import { TicketService } from '../../ticket.service';

@Component({
  selector: 'app-track-request',
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './track-request.component.html',
  styleUrl: './track-request.component.scss'
})
export class TrackRequestComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly route = inject(ActivatedRoute);

  protected readonly categoryDisplayLabel = categoryDisplayLabel;

  protected readonly codeInput = signal('');
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly result = signal<TrackedTicketPublic | null>(null);

  ngOnInit(): void {
    const fromQuery = this.route.snapshot.queryParamMap.get('code');
    if (fromQuery?.trim()) {
      this.codeInput.set(fromQuery.trim());
      this.search();
    }
  }

  protected statusLabel(status: TicketStatus): string {
    return statusDisplayLabel[status] ?? status;
  }

  protected isTreated(status: TicketStatus): boolean {
    return status === 'Resolved' || status === 'Closed';
  }

  protected search(): void {
    const code = this.codeInput().trim();
    if (!code) {
      this.errorMessage.set('Saisissez votre code de suivi.');
      this.result.set(null);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.result.set(null);

    this.ticketService.getTicketByTrackingCode(code).subscribe({
      next: (data) => {
        this.result.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        const msg =
          err?.error?.message && typeof err.error.message === 'string'
            ? err.error.message
            : 'Impossible de charger cette demande. Vérifiez le code et réessayez.';
        this.errorMessage.set(msg);
        this.isLoading.set(false);
      }
    });
  }
}
