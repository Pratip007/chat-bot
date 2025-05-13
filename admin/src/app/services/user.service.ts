import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, throwError, forkJoin, of, switchMap } from 'rxjs';
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
    return this.getAllUsersWithLastMessages();
  }

  // Get all users with their last message for sorting
  getAllUsersWithLastMessages(): Observable<User[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`).pipe(
      switchMap(users => {
        // Map the basic user data
        const mappedUsers: User[] = users.map(user => ({
          id: user.userId,
          name: user.username,
          email: user.username + '@example.com', // Fallback if email not provided by API
          createdAt: new Date(user.createdAt || Date.now()),
          lastActive: user.lastActive ? new Date(user.lastActive) : undefined,
          updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
          role: 'user' as const,
          status: 'active' as const,
          avatar: `https://ui-avatars.com/api/?name=${user.username}&background=3B82F6&color=fff`
        }));

        // Create an array of observables that fetch the last message for each user
        const userObservables = mappedUsers.map(user => {
          // Get the last message for each user
          return this.getLastMessageForUser(user.id).pipe(
            map(lastMessage => {
              if (lastMessage) {
                // Update user with last message
                return {
                  ...user,
                  lastMessage
                } as User;
              }
              return user;
            })
          );
        });

        // Combine all user observables
        return forkJoin(userObservables).pipe(
          map(updatedUsers => {
            // Sort users by updatedAt or lastMessage timestamp (most recent first)
            return updatedUsers.sort((a, b) => {
              const dateA = a.lastMessage?.timestamp || a.updatedAt || a.lastActive || a.createdAt;
              const dateB = b.lastMessage?.timestamp || b.updatedAt || b.lastActive || b.createdAt;
              return new Date(dateB).getTime() - new Date(dateA).getTime();
            });
          })
        );
      })
    );
  }

  // Get users with their full message history for dashboard
  getUsersWithMessages(): Observable<User[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`).pipe(
      switchMap(users => {
        // Map the basic user data
        const mappedUsers: User[] = users.map(user => ({
          id: user.userId,
          name: user.username,
          email: user.username + '@example.com', // Fallback if email not provided by API
          createdAt: new Date(user.createdAt || Date.now()),
          lastActive: user.lastActive ? new Date(user.lastActive) : undefined,
          updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
          role: 'user' as const,
          status: 'active' as const,
          avatar: `https://ui-avatars.com/api/?name=${user.username}&background=3B82F6&color=fff`,
          messages: [] // Initialize with empty messages array
        }));

        // Create an array of observables that fetch messages for each user
        const userObservables = mappedUsers.map(user => {
          // Get all messages for each user
          return this.getChatHistory(user.id).pipe(
            map(messages => {
              if (messages.length > 0) {
                // Update user with messages
                return {
                  ...user,
                  messages
                } as User;
              }
              return user;
            })
          );
        });

        // Combine all user observables
        return forkJoin(userObservables);
      })
    );
  }

  // Get the last message for a user
  private getLastMessageForUser(userId: string): Observable<ChatMessage | null> {
    return this.http.get<any[]>(`${this.apiUrl}/chat/history/${userId}?limit=1`).pipe(
      map(messages => {
        if (!messages || messages.length === 0) {
          return null;
        }

        const lastMsg = messages[messages.length - 1]; // Get the most recent message
        return {
          _id: lastMsg._id,
          content: lastMsg.content || lastMsg.message || '',
          timestamp: new Date(lastMsg.timestamp || Date.now()),
          senderType: lastMsg.senderType || (lastMsg.senderId === '3' ? 'admin' : (lastMsg.isBot ? 'bot' : 'user'))
        };
      })
    );
  }

  // Get user by ID
  getUserById(id: string): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/users/${id}`).pipe(
      switchMap(user => {
        const mappedUser: User = {
          id: user.userId,
          name: user.username,
          email: user.username + '@example.com', // Fallback if email not provided by API
          createdAt: new Date(user.createdAt || Date.now()),
          lastActive: user.lastActive ? new Date(user.lastActive) : undefined,
          updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
          role: 'user' as const,
          status: 'active' as const,
          avatar: `https://ui-avatars.com/api/?name=${user.username}&background=3B82F6&color=fff`
        };

        // Get the last message for this user
        return this.getLastMessageForUser(user.userId).pipe(
          map(lastMessage => {
            if (lastMessage) {
              return {
                ...mappedUser,
                lastMessage
              };
            }
            return mappedUser;
          })
        );
      })
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
      switchMap(user => {
        const mappedUser: User = {
          id: user.userId,
          name: user.username,
          email: user.username + '@example.com',
          createdAt: new Date(user.createdAt || Date.now()),
          lastActive: user.lastActive ? new Date(user.lastActive) : undefined,
          updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
          role: 'user' as const,
          status: status,
          avatar: `https://ui-avatars.com/api/?name=${user.username}&background=3B82F6&color=fff`
        };

        // Get the last message for this user
        return this.getLastMessageForUser(user.userId).pipe(
          map(lastMessage => {
            if (lastMessage) {
              return {
                ...mappedUser,
                lastMessage
              };
            }
            return mappedUser;
          })
        );
      })
    );
  }
}
