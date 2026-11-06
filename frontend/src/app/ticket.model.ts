export type TicketStatus =
  | 'To Do'
  | 'In Progress'
  | 'Waiting for Customer'
  | 'Resolved'
  | 'Closed';

export type TicketCategory = string;

export type AssignedSupport = {
  _id: string;
  username: string;
};

export type Ticket = {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  assignedTo: AssignedSupport | null;
  trackingCode?: string;
  createdAt: string;
  updatedAt: string;
};

/** Reponse publique GET /public/tickets/track/:code (sans donnees sensibles). */
export type TrackedTicketPublic = {
  trackingCode: string;
  status: TicketStatus;
  title: string;
  category: TicketCategory;
  createdAt: string;
  updatedAt: string;
};
