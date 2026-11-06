import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { HomeComponent } from './pages/home/home.component';
import { SupportRequestComponent } from './pages/support-request/support-request.component';
import { KanbanComponent } from './pages/kanban/kanban.component';
import { LoginComponent } from './pages/login/login.component';
import { TicketDetailComponent } from './pages/ticket-detail/ticket-detail.component';
import { TrackRequestComponent } from './pages/track-request/track-request.component';
import { AdminComponent } from './pages/admin/admin.component';
import { adminGuard } from './admin.guard';
export type AppZone = 'home' | 'client' | 'agent' | 'admin';

export const routes: Routes = [
  { path: '', component: HomeComponent, data: { appZone: 'home' satisfies AppZone } },
  {
    path: 'support-request',
    component: SupportRequestComponent,
    data: { appZone: 'client' satisfies AppZone }
  },
  {
    path: 'suivi-demande',
    component: TrackRequestComponent,
    data: { appZone: 'client' satisfies AppZone }
  },
  { path: 'login', component: LoginComponent, data: { appZone: 'agent' satisfies AppZone } },
  {
    path: 'kanban',
    component: KanbanComponent,
    canActivate: [authGuard],
    data: { appZone: 'agent' satisfies AppZone }
  },
  {
    path: 'tickets/:id',
    component: TicketDetailComponent,
    canActivate: [authGuard],
    data: { appZone: 'agent' satisfies AppZone }
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [adminGuard],
    data: { appZone: 'admin' satisfies AppZone }
  },
  { path: '**', redirectTo: '' }
];
