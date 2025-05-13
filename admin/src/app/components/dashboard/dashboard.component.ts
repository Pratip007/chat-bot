import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { MessageService } from '../../services/message.service';
import { User } from '../../models/user.model';
import { Message } from '../../models/message.model';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  users: User[] = [];
  unreadMessages: any[] = [];
  totalUsers = 0;
  activeUsers = 0;
  inactiveUsers = 0;
  totalMessages = 0;
  isLoading = false;

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsersWithMessages().subscribe({
      next: (users) => {
        // For each user, find the most recent message timestamp
        const usersWithLastMessageTime = users.map(user => {
          const messages = user.messages || [];
          let lastMessageTime = user.createdAt;

          if (messages.length > 0) {
            // Find the most recent message timestamp
            const timestamps = messages.map(msg => new Date(msg.timestamp));
            const mostRecentTime = new Date(Math.max(...timestamps.map(t => t.getTime())));
            lastMessageTime = mostRecentTime;
          }

          return {
            ...user,
            lastMessageTime
          };
        });

        // Sort users by most recent message timestamp in descending order
        this.users = usersWithLastMessageTime.sort((a, b) =>
          b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
        );

        this.totalUsers = users.length;
        this.activeUsers = users.length; // All users are considered active for now
        this.inactiveUsers = 0; // No inactive users for now
        this.totalMessages = users.reduce((total, user) => {
          return total + (user.messages?.length || 0);
        }, 0);

        // Get latest messages from users for unread messages section
        this.unreadMessages = [];
        this.users.forEach(user => {
          if (user.messages && user.messages.length > 0) {
            const latestMessage = user.messages[user.messages.length - 1];
            this.unreadMessages.push({
              userId: user.id,
              content: latestMessage.content,
              createdAt: latestMessage.timestamp,
              status: 'unread'
            });
          }
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isLoading = false;
      }
    });
  }

  viewUserMessages(userId: string): void {
    // Navigate to chat interface with selected user ID
    this.router.navigate(['/chat'], {
      queryParams: { userId: userId }
    });
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
    const name = this.users.find(u => u.id === userId)?.name;
    return name ? name.charAt(0) : 'U';
  }
}
