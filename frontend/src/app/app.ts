import { Component, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { merge } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import type { AppZone } from './app.routes';

function leafRoute(snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  let r = snapshot;
  while (r.firstChild) {
    r = r.firstChild;
  }
  return r;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Zone d'interface : home, client, agent ou admin — dérivée de la route feuille.
   * Un administrateur connecté voit le shell « admin » sur les routes outil agent
   * (/kanban, /tickets/:id) sauf sur la page de connexion (/login).
   */
  protected readonly appZone = toSignal(
    merge(
      this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)),
      toObservable(this.auth.currentUser)
    ).pipe(map(() => this.readAppZone())),
    { initialValue: this.readAppZone() }
  );

  private readAppZone(): AppZone {
    const leaf = leafRoute(this.router.routerState.snapshot.root);
    let z = leaf.data['appZone'] as AppZone | undefined;
    if (z !== 'client' && z !== 'agent' && z !== 'admin' && z !== 'home') {
      z = 'home';
    }

    const pathKey = leaf.routeConfig?.path;
    const isLoginRoute = pathKey === 'login';

    if (this.auth.isLoggedIn() && this.auth.isAdmin() && z === 'agent' && !isLoginRoute) {
      return 'admin';
    }

    return z;
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }
}
