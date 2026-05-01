export interface Contact {
  id: string;
  name: string;
  handle: string;
  accentColor: string;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  contactId: string;
  senderId: string;
  text: string;
  createdAt: number;
}
