import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, throwError, mergeMap, from, of, catchError, forkJoin } from 'rxjs';
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
    return this.getUsersWithMessages();
  }

  // Get all users from the server with their messages
  getAllUsersFromServer(): Observable<User[]> {
    return this.getUsersWithMessages();
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

  // Send a message with file attachment
  sendMessageWithFile(userId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/chat`, formData);
  }

  // Update a message
  updateMessage(message: ChatMessage): Observable<any> {
    if (!message._id) {
      console.error('Cannot update message without ID');
      return throwError(() => new Error('Message ID is required for update'));
    }

    return this.http.put(`${this.apiUrl}/chat/message/${message._id}`, {
      content: message.content,
      adminId: '3' // This should be the actual admin ID from auth
    });
  }

  // Delete a message
  deleteMessage(messageId?: string): Observable<any> {
    if (!messageId) {
      console.error('Cannot delete message without ID');
      return throwError(() => new Error('Message ID is required for deletion'));
    }

    return this.http.delete(`${this.apiUrl}/chat/message/${messageId}`);
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

  // Get all users with their messages
  getUsersWithMessages(): Observable<User[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`).pipe(
      // First map to basic user objects
      map(users => users.map(user => ({
        id: user.userId,
        name: user.username,
        email: user.username + '@example.com',
        createdAt: new Date(user.createdAt || Date.now()),
        lastActive: user.lastActive ? new Date(user.lastActive) : undefined,
        role: 'user' as 'user' | 'admin',
        status: 'active' as 'active' | 'inactive' | 'banned',
        avatar: `https://ui-avatars.com/api/?name=${user.username}&background=3B82F6&color=fff`,
        messages: []
      }))),

      // Here we'll modify to get chat histories for all users in parallel
      mergeMap(users => {
        // If there are no users, return empty array
        if (users.length === 0) return of(users);

        // For each user, create an observable to fetch their messages
        const userObservables = users.map(user =>
          this.http.get<any[]>(`${this.apiUrl}/chat/history/${user.id}`).pipe(
            map(messages => {
              // Map the raw message data to ChatMessage objects
              const formattedMessages = messages ? messages.map(msg => ({
                _id: msg._id,
                content: msg.content || '',
                timestamp: new Date(msg.timestamp || Date.now()),
                senderType: msg.senderType || 'user',
                file: msg.file
              })) : [];

              return {
                ...user,
                messages: formattedMessages
              };
            }),
            // If fetching messages fails, just return user without messages
            catchError(error => {
              console.error(`Error fetching messages for user ${user.id}:`, error);
              return of(user);
            })
          )
        );

        // Combine all user observables
        return forkJoin(userObservables);
      })
    );
  }
}
