import { ChatMessage } from './chat-message.model';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  lastActive?: Date;
  role: 'user' | 'admin';
  status: 'active' | 'inactive' | 'banned';
  messages?: ChatMessage[];
}
