export interface ChatMessage {
  _id?: string;
  content: string;
  timestamp: Date;
  senderType?: 'user' | 'bot' | 'admin';
  isEditing?: boolean;
  editContent?: string;
  isDeleted?: boolean;
  error?: string;
  file?: {
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
    data: string;
  };
}
