export interface ChatMessage {
  _id?: string;
  content: string;
  timestamp: Date;
  file?: {
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
    data: string;
  };
}
