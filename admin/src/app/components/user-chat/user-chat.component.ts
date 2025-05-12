import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { ChatMessage } from '../../models/chat-message.model';

@Component({
  selector: 'app-user-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-chat.component.html',
  styleUrls: ['./user-chat.component.css']
})
export class UserChatComponent implements OnInit {
  users: User[] = [];
  selectedUser?: User;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoading = false;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();

    // Check if there's a userId in the route
    this.route.queryParams.subscribe(params => {
      if (params['userId']) {
        this.selectUser(params['userId']);
      }
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.isLoading = false;
        this.users = [];
      }
    });
  }

  selectUser(userId: string): void {
    // Update route for sharing/bookmarking
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { userId },
      queryParamsHandling: 'merge'
    });

    // Find selected user
    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.selectedUser = user;
      },
      error: (err) => {
        console.error('Error loading user details:', err);
      }
    });

    // Load chat history
    this.loadChatHistory(userId);
  }

  loadChatHistory(userId: string): void {
    this.isLoading = true;
    this.userService.getChatHistory(userId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading chat history:', err);
        this.messages = [];
        this.isLoading = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.selectedUser || !this.newMessage.trim()) return;

    this.isLoading = true;
    this.userService.sendMessage(this.selectedUser.id, this.newMessage).subscribe({
      next: (response) => {
        // Add the message to our local array
        this.messages.push({
          content: this.newMessage,
          timestamp: new Date()
        });

        // Add bot response if present in the response
        if (response.botResponse) {
          this.messages.push({
            content: response.botResponse,
            timestamp: new Date()
          });
        }

        this.newMessage = '';
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error sending message:', err);
        this.isLoading = false;
      }
    });
  }
}
