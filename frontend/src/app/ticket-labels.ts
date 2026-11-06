import type { TicketStatus } from './ticket.model';

/** Libellés d'affichage (les clés restent alignées sur l'API). */
export const categoryDisplayLabel: Record<string, string> = {
  Authentification: 'Authentification',
  'Support technique': 'Support technique',
  Reseau: 'Réseau',
  Materiel: 'Matériel',
  Logiciel: 'Logiciel',
  Messagerie: 'Messagerie',
  Securite: 'Sécurité',
  'Gestion des comptes': 'Gestion des comptes',
  Information: 'Information',
  Reclamation: 'Réclamation',
  'Demande de service': 'Demande de service',
  Urgence: 'Urgence'
};

export const statusDisplayLabel: Record<TicketStatus, string> = {
  'To Do': 'À faire',
  'In Progress': 'En cours',
  'Waiting for Customer': 'En attente du client',
  Resolved: 'Résolu',
  Closed: 'Fermé'
};
