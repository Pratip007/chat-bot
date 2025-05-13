import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { User } from '../models/user.model';
import { ChatMessage } from '../models/chat-message.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) { }

  // Get all users
  getUsers(): Observable<User[]> {
    return this.getAllUsersFromServer();
  }

  // Get all users from the server
  getAllUsersFromServer(): Observable<User[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`).pipe(
      map(users => users.map(user => ({
        id: user.userId,
        name: user.username,
        email: user.username + '@example.com', // Fallback if email not provided by API
        createdAt: new Date(user.createdAt || Date.now()),
        lastActive: user.lastActive ? new Date(user.lastActive) : undefined,
        role: 'user',
        status: 'active',
        avatar: `https://ui-avatars.com/api/?name=${user.username}&background=3B82F6&color=fff`
      })))
    );
  }

  // Get user by ID
  getUserById(id: string): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/users/${id}`).pipe(
      map(user => ({
        id: user.userId,
        name: user.username,
        email: user.username + '@example.com', // Fallback if email not provided by API
        createdAt: new Date(user.createdAt || Date.now()),
        lastActive: user.lastActive ? new Date(user.lastActive) : undefined,
        role: 'user',
        status: 'active',
        avatar: `https://ui-avatars.com/api/?name=${user.username}&background=3B82F6&color=fff`
      }))
    );
  }

  // Get chat history for a user
  getChatHistory(userId: string): Observable<ChatMessage[]> {
    console.log('Fetching chat history for user:', userId);
    return this.http.get<any[]>(`${this.apiUrl}/chat/history/${userId}`).pipe(
      map(messages => {
        console.log('Raw chat history response:', messages);
        if (!messages || messages.length === 0) {
          console.warn('No messages found in the response');
          return [];
        }

        return messages.map((msg: any) => {
          console.log('Processing message:', msg);
          // The server returns 'content' but we need to handle both possible field names
          const messageContent = msg.content || msg.message || '';
          return {
            _id: msg._id,
            content: messageContent,
            timestamp: new Date(msg.timestamp || Date.now()),
            senderType: msg.senderType || (msg.senderId === '3' ? 'admin' : (msg.isBot ? 'bot' : 'user')),
            file: msg.file
          };
        });
      })
    );
  }

  // Send a message to a user
  sendMessage(userId: string, content: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/chat`, {
      userId,
      message: content,
      adminId: '3' // This should be the actual admin ID from auth
    });
  }

  // Update user status
  updateUserStatus(userId: string, status: 'active' | 'inactive' | 'banned'): Observable<User> {
    return this.http.patch<any>(`${this.apiUrl}/users/${userId}`, { status }).pipe(
      map(user => ({
        id: user.userId,
        name: user.username,
        email: user.username + '@example.com',
        createdAt: new Date(user.createdAt || Date.now()),
        lastActive: user.lastActive ? new Date(user.lastActive) : undefined,
        role: 'user',
        status: status,
        avatar: `https://ui-avatars.com/api/?name=${user.username}&background=3B82F6&color=fff`
      }))
    );
  }
}
