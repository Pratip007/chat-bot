import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  // Mock data - replace with actual API calls
  private messages: Message[] = [
    {
      id: '1',
      userId: '1',
      content: 'Hello, I need help with my account',
      createdAt: new Date('2023-06-10T10:23:00'),
      isUserMessage: true,
      status: 'read'
    },
    {
      id: '2',
      userId: '1',
      adminId: '3',
      content: 'Hi John, I\'d be happy to help. What issues are you experiencing?',
      createdAt: new Date('2023-06-10T10:30:00'),
      isUserMessage: false,
      status: 'read'
    },
    {
      id: '3',
      userId: '1',
      content: 'I can\'t reset my password',
      createdAt: new Date('2023-06-10T10:35:00'),
      isUserMessage: true,
      status: 'read'
    },
    {
      id: '4',
      userId: '2',
      content: 'Is the new feature available yet?',
      createdAt: new Date('2023-06-15T14:15:00'),
      isUserMessage: true,
      status: 'unread'
    },
    {
      id: '5',
      userId: '4',
      content: 'I want to cancel my subscription',
      createdAt: new Date('2023-05-05T09:45:00'),
      isUserMessage: true,
      status: 'unread'
    }
  ];

  constructor() { }

  getMessages(): Observable<Message[]> {
    return of(this.messages);
  }

  getMessagesByUserId(userId: string): Observable<Message[]> {
    const userMessages = this.messages.filter(m => m.userId === userId);
    return of(userMessages);
  }

  addMessage(message: Omit<Message, 'id'>): Observable<Message> {
    const newMessage: Message = {
      ...message,
      id: (this.messages.length + 1).toString(),
      createdAt: new Date()
    };

    this.messages.push(newMessage);
    return of(newMessage);
  }

  updateMessage(id: string, content: string): Observable<Message | undefined> {
    const messageIndex = this.messages.findIndex(m => m.id === id);
    if (messageIndex !== -1) {
      this.messages[messageIndex] = {
        ...this.messages[messageIndex],
        content,
        updatedAt: new Date()
      };
      return of(this.messages[messageIndex]);
    }
    return of(undefined);
  }

  deleteMessage(id: string): Observable<boolean> {
    const messageIndex = this.messages.findIndex(m => m.id === id);
    if (messageIndex !== -1) {
      this.messages[messageIndex] = {
        ...this.messages[messageIndex],
        status: 'deleted'
      };
      return of(true);
    }
    return of(false);
  }

  markMessagesAsRead(userId: string): Observable<boolean> {
    this.messages.forEach((message, index) => {
      if (message.userId === userId && message.status === 'unread') {
        this.messages[index] = {
          ...message,
          status: 'read'
        };
      }
    });
    return of(true);
  }
}
