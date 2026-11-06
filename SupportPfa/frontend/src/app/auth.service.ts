import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export type SupportUser = {
  id: string;
  username: string;
  role: 'support' | 'admin';
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient); 
  private readonly apiBase = 'http://localhost:5000/api';
  private readonly tokenKey = 'support_token';
  private readonly userKey = 'support_user';

  readonly currentUser = signal<SupportUser | null>(this.readUserFromStorage());

  login(username: string, password: string) {
    return this.http
      .post<{ token: string; user: SupportUser }>(`${this.apiBase}/auth/login`, {
        username,
        password
      })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.tokenKey, res.token);
          localStorage.setItem(this.userKey, JSON.stringify(res.user));
          this.currentUser.set(res.user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }

  private readUserFromStorage(): SupportUser | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }
    try {
      const user = JSON.parse(raw) as SupportUser;
      const uname = String(user.username || '').toLowerCase();
      if (uname === 'admin' && user.role !== 'admin') {
        user.role = 'admin';
        localStorage.setItem(this.userKey, JSON.stringify(user));
      }
      if (!user.role) {
        user.role = 'support';
        localStorage.setItem(this.userKey, JSON.stringify(user));
      }
      return user;
    } catch {
      return null;
    }
  }
}
