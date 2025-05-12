import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { MessageService } from '../../services/message.service';
import { User } from '../../models/user.model';
import { Message } from '../../models/message.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  users: User[] = [];
  unreadMessages: Message[] = [];
  totalUsers = 0;
  activeUsers = 0;
  inactiveUsers = 0;
  totalMessages = 0;

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUsers();
    this.loadMessages();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe(users => {
      this.users = users;
      this.totalUsers = users.length;
      this.activeUsers = users.filter(u => u.status === 'active').length;
      this.inactiveUsers = users.filter(u => u.status === 'inactive' || u.status === 'banned').length;
    });
  }

  loadMessages(): void {
    this.messageService.getMessages().subscribe(messages => {
      this.totalMessages = messages.length;
      this.unreadMessages = messages.filter(m => m.status === 'unread');
    });
  }

  viewUserMessages(userId: string): void {
    this.router.navigate(['/users', userId]);
  }

  getUserAvatar(userId: string): string | undefined {
    return this.users.find(u => u.id === userId)?.avatar;
  }

  getUserName(userId: string): string {
    return this.users.find(u => u.id === userId)?.name || 'Unknown User';
  }

  getUserEmail(userId: string): string {
    return this.users.find(u => u.id === userId)?.email || 'No email';
  }

  getUserInitial(userId: string): string {
    return this.users.find(u => u.id === userId)?.name?.charAt(0) || 'U';
  }
}
