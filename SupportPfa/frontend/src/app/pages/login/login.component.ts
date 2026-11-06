import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected credentials = {
    username: '',
    password: ''
  };

  protected readonly errorMessage = signal('');
  protected readonly isSubmitting = signal(false);

  protected login(): void {
    const user = this.credentials.username.trim();
    const pass = this.credentials.password;

    if (!user || !pass) {
      this.errorMessage.set('Saisissez un identifiant et un mot de passe.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.auth.login(user, pass).subscribe({
      next: (res) => {
        const explicit = this.route.snapshot.queryParamMap.get('returnUrl');
        const fallback = res.user.role === 'admin' ? '/admin' : '/kanban';
        this.isSubmitting.set(false);
        void this.router.navigateByUrl(explicit || fallback);
      },
      error: () => {
        this.errorMessage.set('Impossible de vous connecter. Vérifiez vos identifiants.');
        this.isSubmitting.set(false);
      }
    });
  }
}
