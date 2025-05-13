import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { WebsocketService } from '../../services/websocket.service';
import { User } from '../../models/user.model';
import { ChatMessage } from '../../models/chat-message.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-chat.component.html',
  styleUrls: ['./user-chat.component.css']
})
export class UserChatComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  users: User[] = [];
  selectedUser?: User;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isLoading = false;
  previewImage: {url: string, name: string} | null = null;
  selectedFile: File | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private userService: UserService,
    private websocketService: WebsocketService,
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

    // Subscribe to real-time message updates
    this.subscribeToWebSocketEvents();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Subscribe to WebSocket events
  private subscribeToWebSocketEvents(): void {
    // Join admin room for all user updates
    this.websocketService.joinRoom();

    // Handle new messages
    const messageSub = this.websocketService.getMessages().subscribe(
      (messageData) => {
        console.log('Received message via WebSocket:', messageData);

        // Check if this message is for our currently selected user
        if (this.selectedUser && (messageData.userId === this.selectedUser.id || !messageData.userId)) {
          // Convert to ChatMessage format
          const newMessage: ChatMessage = {
            _id: messageData._id,
            content: messageData.content,
            timestamp: new Date(messageData.timestamp),
            senderType: messageData.senderType,
            file: messageData.file
          };

          // Check if the message already exists (avoid duplicates)
          const exists = this.messages.some(msg => msg._id === newMessage._id);
          if (!exists) {
            this.messages.push(newMessage);

            // Sort messages by timestamp
            this.messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            // Scroll to bottom after receiving a new message
            setTimeout(() => this.scrollToBottom(), 100);
          }
        }

        // Update the user's last message time
        if (messageData.userId) {
          const userIndex = this.users.findIndex(u => u.id === messageData.userId);
          if (userIndex !== -1) {
            // Update the last message time
            this.users[userIndex].lastMessageTime = new Date(messageData.timestamp);

            // Re-sort the users list
            this.users = [...this.users].sort((a, b) => {
              if (!a.lastMessageTime) return 1;
              if (!b.lastMessageTime) return -1;
              return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
            });
          }
        }
      }
    );

    // Handle message updates
    const updateSub = this.websocketService.getMessageUpdates().subscribe(
      (updateData) => {
        console.log('Received message update via WebSocket:', updateData);

        // Find and update the message
        const messageIndex = this.messages.findIndex(msg => msg._id === updateData._id);
        if (messageIndex !== -1) {
          this.messages[messageIndex].content = updateData.content;
          this.messages[messageIndex].isEditing = false;
        }
      }
    );

    // Handle message deletions
    const deleteSub = this.websocketService.getMessageDeletions().subscribe(
      (deleteData) => {
        console.log('Received message deletion via WebSocket:', deleteData);

        // Find and mark the message as deleted
        const messageIndex = this.messages.findIndex(msg => msg._id === deleteData._id);
        if (messageIndex !== -1) {
          this.messages[messageIndex].isDeleted = true;
        }
      }
    );

    // Store subscriptions for cleanup
    this.subscriptions.push(messageSub, updateSub, deleteSub);
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
    this.previewImage = {
      url: imageUrl,
      name: imageName
    };
  }

  // Close image preview
  closeImagePreview(): void {
    this.previewImage = null;
  }

  // Simple file icon helper to fix compile error
  getFileIcon(mimeType: string): string {
    return 'file';
  }

  // Helper to determine file display type
  getFileDisplayType(mimeType: string): string {
    if (!mimeType) return 'other';

    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType.startsWith('audio/')) {
      return 'audio';
    } else if (mimeType === 'application/pdf') {
      return 'pdf';
    } else {
      return 'other';
    }
  }

  // Message editing methods
  startEditingMessage(message: ChatMessage): void {
    // Reset any other messages that might be in edit mode
    this.messages.forEach(m => {
      if (m !== message && m.isEditing) {
        m.isEditing = false;
      }
    });

    // Start editing this message
    message.isEditing = true;
    message.editContent = message.content;

    // Focus the input field after it renders
    setTimeout(() => {
      const editInput = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (editInput) {
        editInput.focus();
      }
    }, 0);
  }

  cancelMessageEdit(message: ChatMessage): void {
    message.isEditing = false;
    message.editContent = undefined;
  }

  saveMessageEdit(message: ChatMessage): void {
    if (!message.editContent?.trim()) {
      return;
    }

    // Update the message content
    message.content = message.editContent.trim();
    message.isEditing = false;

    // Update on server if needed
    this.updateMessageOnServer(message);
  }

  deleteMessage(message: ChatMessage): void {
    if (confirm('Are you sure you want to delete this message?')) {
      // Mark as deleted but keep in history
      message.isDeleted = true;

      // Delete on server if needed
      this.deleteMessageOnServer(message);
    }
  }

  // Server sync methods
  updateMessageOnServer(message: ChatMessage): void {
    // Only proceed if the message has an ID
    if (!message._id) {
      console.warn('Cannot update message without ID - skipping server update');
      return;
    }

    this.userService.updateMessage(message).subscribe({
      next: (response) => {
        console.log('Message updated successfully:', response);
      },
      error: (err) => {
        console.error('Error updating message:', err);
        // If update fails, you might want to revert the UI change
        // or show an error message to the user
      }
    });
  }

  deleteMessageOnServer(message: ChatMessage): void {
    // Only proceed if the message has an ID
    if (!message._id) {
      console.warn('Cannot delete message without ID - skipping server delete');
      return;
    }

    this.userService.deleteMessage(message._id).subscribe({
      next: (response) => {
        console.log('Message deleted successfully:', response);
      },
      error: (err) => {
        console.error('Error deleting message:', err);
        // If delete fails, you might want to restore the message
        // or show an error message to the user
      }
    });
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

        // Join the user-specific room for direct updates
        this.websocketService.joinRoom(userId);
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

  // File upload methods
  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      const file = element.files[0];

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please select a smaller file.');
        element.value = '';
        return;
      }

      this.selectedFile = file;
      console.log('File selected:', this.selectedFile.name, 'Size:', this.selectedFile.size, 'Type:', this.selectedFile.type);
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  sendMessage(): void {
    if (!this.selectedUser || (!this.newMessage.trim() && !this.selectedFile)) return;

    this.isLoading = true;
    console.log('Sending message to user:', this.selectedUser.id, 'Message:', this.newMessage, 'File:', this.selectedFile?.name);

    // For simple text messages without files, use WebSocket for instant delivery
    if (!this.selectedFile && this.newMessage.trim()) {
      // WebSocket doesn't support file uploads, so we'll only use it for text
      // We'll try the REST API if WebSocket fails
      try {
        // Send the message via WebSocket
        this.websocketService.sendMessage(this.selectedUser.id, this.newMessage);

        // The message will be added to UI when received back from socket
        this.newMessage = '';
        this.isLoading = false;
      } catch (err) {
        console.error('Error sending message via WebSocket, falling back to HTTP:', err);
        // Fall back to HTTP API
        this.sendMessageViaHttp();
      }
    } else {
      // For files, we need to use the HTTP API
      this.sendMessageViaHttp();
    }
  }

  // Send message using HTTP API (for files or as fallback)
  private sendMessageViaHttp(): void {
    if (!this.selectedUser) return;

    // Create FormData for the request
    const formData = new FormData();
    formData.append('userId', this.selectedUser.id);
    formData.append('message', this.newMessage);
    formData.append('adminId', '3'); // Should come from auth

    // Add file if selected
    if (this.selectedFile) {
      formData.append('file', this.selectedFile, this.selectedFile.name);
      console.log('Appending file to form data:', this.selectedFile.name);
    }

    // Send the request
    this.userService.sendMessageWithFile(this.selectedUser.id, formData).subscribe({
      next: (response) => {
        console.log('Message with file sent successfully:', response);
        this.handleMessageResponse(response);
      },
      error: (err) => {
        console.error('Error sending message with file:', err);
        this.handleMessageError(err);
      }
    });
  }

  private handleMessageResponse(response: any): void {
    console.log('Send message response:', response);

    // Clear input fields
    const sentMessage = this.newMessage;
    const sentFile = this.selectedFile;
    this.newMessage = '';
    this.selectedFile = null;
    this.isLoading = false;

    // Admin message should come back via WebSocket, but add it here as fallback
    // Add the admin message to our local array only if it wasn't added via WebSocket
    const messageExists = this.messages.some(msg =>
      msg.content === sentMessage &&
      Math.abs(new Date(msg.timestamp).getTime() - new Date().getTime()) < 3000 &&
      msg.senderType === 'admin'
    );

    if (!messageExists) {
      const adminMessage: ChatMessage = {
        content: sentMessage,
        timestamp: new Date(),
        senderType: 'admin',
        file: response.fileData && sentFile ? {
          filename: sentFile.name,
          originalname: sentFile.name,
          mimetype: sentFile.type,
          size: sentFile.size,
          data: response.fileData
        } : undefined
      };
      this.messages.push(adminMessage);
      console.log('Added admin message:', adminMessage);

      // Update the selected user's last message time
      if (this.selectedUser) {
        const userIndex = this.users.findIndex(u => u.id === this.selectedUser?.id);
        if (userIndex !== -1) {
          // Update the last message time
          this.users[userIndex].lastMessageTime = new Date();

          // Re-sort the users list
          this.users = [...this.users].sort((a, b) => {
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
          });
        }
      }
    }

    // No longer need to add bot response - as bot should not reply to admin messages

    // Scroll to bottom after sending a message
    setTimeout(() => this.scrollToBottom(), 100);
  }

  // Handle error with a more user-friendly approach
  private handleMessageError(err: any): void {
    console.error('Error sending message:', err);

    // Show error feedback based on error type
    let errorMessage = 'Failed to send message';

    if (err.status === 413) {
      errorMessage = 'The file is too large to upload';
    } else if (err.status === 415) {
      errorMessage = 'This file type is not supported';
    } else if (err.status === 400) {
      errorMessage = 'Invalid request: ' + (err.error?.message || 'Please check your message');
    } else if (err.status === 0) {
      errorMessage = 'Server connection lost. Please check your internet connection';
    }

    // You could display this message to user with a toast or alert
    // For now we'll just alert it
    alert(errorMessage);

    // Still add the admin message even if the API call fails, but mark it as failed
    this.messages.push({
      content: this.newMessage || 'File upload',
      timestamp: new Date(),
      senderType: 'admin' as 'admin',
      error: errorMessage,
      file: this.selectedFile ? {
        filename: this.selectedFile.name,
        originalname: this.selectedFile.name,
        mimetype: this.selectedFile.type,
        size: this.selectedFile.size,
        data: ''
      } : undefined
    });

    this.newMessage = '';
    this.selectedFile = null;
    this.isLoading = false;

    // Scroll to bottom even if there was an error
    setTimeout(() => this.scrollToBottom(), 100);
  }
}
