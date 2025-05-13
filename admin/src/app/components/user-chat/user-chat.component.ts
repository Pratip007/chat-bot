import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { ChatMessage } from '../../models/chat-message.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-user-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-chat.component.html',
  styleUrls: ['./user-chat.component.css']
})
export class UserChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  users: User[] = [];
  selectedUser?: User;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoading = false;
  previewImage: {url: string, name: string} | null = null;
  previewFile: {url: string, name: string, type: string, safeUrl?: SafeResourceUrl} | null = null;

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
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

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  // Handle file downloads
  downloadFile(fileData: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Handle image preview in a larger modal
  openImagePreview(imageUrl: string, imageName: string): void {
    console.log('Opening image preview:', imageUrl);
    this.previewImage = {
      url: imageUrl,
      name: imageName
    };
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
  }

  // Close image preview
  closeImagePreview(): void {
    this.previewImage = null;
    // Restore scrolling
    document.body.style.overflow = 'auto';
  }

  // Handle file preview
  openFilePreview(fileUrl: string, fileName: string, fileType: string): void {
    let safeUrl: SafeResourceUrl | undefined;

    // Create a safe URL for PDF and text files
    if (fileType.includes('pdf') || fileType.includes('text')) {
      safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
    }

    this.previewFile = {
      url: fileUrl,
      name: fileName,
      type: fileType,
      safeUrl: safeUrl
    };
  }

  // Close file preview
  closeFilePreview(): void {
    this.previewFile = null;
  }

  // Get file icon based on mime type
  getFileIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) {
      return 'pdf';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'doc';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return 'xls';
    } else if (mimeType.includes('text')) {
      return 'txt';
    } else if (mimeType.includes('video')) {
      return 'video';
    } else if (mimeType.includes('audio')) {
      return 'audio';
    } else {
      return 'file';
    }
  }

  // Get file display type for preview
  getFileDisplayType(mimeType: string): 'pdf' | 'video' | 'audio' | 'text' | 'other' {
    if (mimeType.includes('pdf')) {
      return 'pdf';
    } else if (mimeType.includes('video')) {
      return 'video';
    } else if (mimeType.includes('audio')) {
      return 'audio';
    } else if (mimeType.includes('text')) {
      return 'text';
    } else {
      return 'other';
    }
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
    console.log('Loading chat history for user ID:', userId);
    this.userService.getChatHistory(userId).subscribe({
      next: (messages) => {
        console.log('Received messages from service:', messages);
        // Make sure messages have proper senderType
        if (messages && messages.length > 0) {
          this.messages = messages.map(msg => {
            if (!msg.senderType) {
              // If there's no senderType in the data, infer from position
              // Assuming odd messages are admin, even are user/bot
              // This is a fallback and should be removed once API provides senderType
              const index = messages.indexOf(msg);
              msg.senderType = index % 2 === 0 ? 'user' : 'bot';
            }
            return msg;
          });

          // Sort messages by timestamp, oldest first
          this.messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        } else {
          // Add default welcome message if no messages exist
          this.messages = [
            {
              content: "Hello! How can I help you today?",
              timestamp: new Date(),
              senderType: 'bot'
            }
          ];
        }
        console.log('Final processed messages:', this.messages);
        this.isLoading = false;

        // Ensure we scroll to bottom after messages are loaded
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => {
        console.error('Error loading chat history:', err);
        // Set default welcome message on error too
        this.messages = [
          {
            content: "Hello! There was an error loading your chat history, but you can start a new conversation.",
            timestamp: new Date(),
            senderType: 'bot'
          }
        ];
        this.isLoading = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.selectedUser || !this.newMessage.trim()) return;

    this.isLoading = true;
    console.log('Sending message to user:', this.selectedUser.id, 'Message:', this.newMessage);
    this.userService.sendMessage(this.selectedUser.id, this.newMessage).subscribe({
      next: (response) => {
        console.log('Send message response:', response);

        // Add the admin message to our local array
        const adminMessage: ChatMessage = {
          content: this.newMessage,
          timestamp: new Date(),
          senderType: 'admin'
        };
        this.messages.push(adminMessage);
        console.log('Added admin message:', adminMessage);

        // Add bot response if present in the response
        if (response && response.botResponse) {
          const botMessage: ChatMessage = {
            content: response.botResponse,
            timestamp: new Date(),
            senderType: 'bot'
          };
          this.messages.push(botMessage);
          console.log('Added bot response:', botMessage);
        }

        this.newMessage = '';
        this.isLoading = false;

        // Scroll to bottom after sending a message
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (err) => {
        console.error('Error sending message:', err);
        // Still add the admin message even if the API call fails
        this.messages.push({
          content: this.newMessage,
          timestamp: new Date(),
          senderType: 'admin' as 'admin'
        });
        this.newMessage = '';
        this.isLoading = false;

        // Scroll to bottom even if there was an error
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }
}
