import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TicketService } from '../../ticket.service';

@Component({
  selector: 'app-support-request',
  imports: [FormsModule, RouterLink],
  templateUrl: './support-request.component.html',
  styleUrl: './support-request.component.scss'
})
export class SupportRequestComponent {
  private readonly ticketService = inject(TicketService);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly lastTrackingCode = signal<string | null>(null);

  protected readonly form = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    title: '',
    description: ''
  };

  protected createTicket(): void {
    const { firstName, lastName, phone, email, title, description } = this.form;

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !title.trim() ||
      !description.trim()
    ) {
      this.errorMessage.set('Veuillez remplir tous les champs.');
      this.successMessage.set('');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.lastTrackingCode.set(null);

    this.ticketService
      .createPublicTicket({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        title: title.trim(),
        description: description.trim()
      })
      .subscribe({
        next: (ticket) => {
          this.form.firstName = '';
          this.form.lastName = '';
          this.form.phone = '';
          this.form.email = '';
          this.form.title = '';
          this.form.description = '';
          
          if (ticket.trackingCode) {
            this.lastTrackingCode.set(ticket.trackingCode);
          }
          this.successMessage.set(
            'Demande enregistrée. Si l’e-mail est configuré sur le serveur, vous recevrez une confirmation avec votre code de suivi.'
          );
          this.isSubmitting.set(false);
        },
        error: () => {
          this.errorMessage.set('Envoi impossible pour le moment. Réessayez dans quelques instants.');
          this.isSubmitting.set(false);
        }
      });
  }
}
