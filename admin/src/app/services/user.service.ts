import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Mock data - replace with actual API calls
  private users: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date('2023-01-15'),
      lastActive: new Date('2023-06-20'),
      role: 'user',
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=3B82F6&color=fff'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      createdAt: new Date('2023-02-10'),
      lastActive: new Date('2023-06-15'),
      role: 'user',
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=10B981&color=fff'
    },
    {
      id: '3',
      name: 'Admin User',
      email: 'admin@example.com',
      createdAt: new Date('2023-01-01'),
      lastActive: new Date('2023-06-22'),
      role: 'admin',
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=1E40AF&color=fff'
    },
    {
      id: '4',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      createdAt: new Date('2023-03-15'),
      lastActive: new Date('2023-05-10'),
      role: 'user',
      status: 'inactive',
      avatar: 'https://ui-avatars.com/api/?name=Bob+Johnson&background=EF4444&color=fff'
    }
  ];

  constructor() { }

  getUsers(): Observable<User[]> {
    return of(this.users);
  }

  getUserById(id: string): Observable<User | undefined> {
    const user = this.users.find(u => u.id === id);
    return of(user);
  }

  updateUserStatus(userId: string, status: 'active' | 'inactive' | 'banned'): Observable<User | undefined> {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      this.users[userIndex] = {
        ...this.users[userIndex],
        status
      };
      return of(this.users[userIndex]);
    }
    return of(undefined);
  }
}
