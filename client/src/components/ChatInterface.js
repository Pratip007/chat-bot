import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';

const socket = io('http://localhost:5000');

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch chat history from the server
  const fetchChatHistory = async (uid) => {
    if (!uid) return;
    
    setIsLoading(true);
    try {
      // Try the GET endpoint first
      let response = await fetch(`http://localhost:5000/api/chat/history/${uid}`);
      
      // If GET fails, try the POST endpoint
      if (!response.ok) {
        console.log('GET request failed, trying POST...');
        response = await fetch('http://localhost:5000/api/chat/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: uid })
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }
      
      const historyData = await response.json();
      console.log('Fetched chat history:', historyData);
      
      // Convert the history data to our message format
      const formattedMessages = historyData.map((msg, index) => {
        // Try to determine if it's a user message or bot message
        // Check if there's an explicit property to determine this
        // Otherwise, use even/odd pattern (alternating messages)
        const isBot = index % 2 !== 0;
        
        return {
          text: msg.content,
          isBot: isBot,
          timestamp: new Date(msg.timestamp),
          username: isBot ? 'Bot' : username,
          file: msg.file ? {
            name: msg.file.originalname,
            type: msg.file.mimetype,
            data: msg.file.data
          } : null
        };
      });
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    if (userData.userId) {
      setUserId(userData.userId);
      console.log('UserId from sessionStorage:', userData.userId);
      // Fetch chat history when userId is available
      fetchChatHistory(userData.userId);
    }
    if (userData.username) {
      setUsername(userData.username);
      console.log('Username from sessionStorage:', userData.username);
    }

    // Socket event listeners
    socket.on('message', (message) => {
      console.log('Socket message received:', message);
      setMessages(prev => [...prev, {
        text: message.text,
        isBot: true,
        timestamp: new Date(message.timestamp),
        username: message.username
      }]);
    });

    return () => {
      socket.off('message');
    };
  }, []);

  // Watch for changes in userId (if user logs in after page load)
  useEffect(() => {
    if (userId) {
      fetchChatHistory(userId);
    }
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    // Get latest userId from sessionStorage in case it was updated
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const currentUserId = userData.userId || userId;
    const currentUsername = userData.username || username;
    
    console.log('Current username:', currentUsername);
    
    const formData = new FormData();
    formData.append('userId', currentUserId);
    formData.append('message', input);
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    
    console.log('Sending message request with file:', selectedFile?.name);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      console.log('Server response:', data);
      
      setMessages(prev => [...prev, 
        {
          text: input,
          isBot: false,
          timestamp: new Date(),
          username: currentUsername,
          file: selectedFile ? {
            name: selectedFile.name,
            type: selectedFile.type,
            data: data.fileData
          } : null
        },
        {
          text: data.botResponse,
          isBot: true,
          timestamp: new Date(),
          username: 'Bot'
        }
      ]);

      setInput('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-content">
          <span className="header-icon">💬</span>
          Customer Service Chat
          <span className="user-info">({username || 'Guest'})</span>
        </div>
      </div>
      
      <div className="chat-messages">
        {isLoading ? (
          <div className="loading-messages">
            <div className="loading-spinner"></div>
            <p>Loading chat history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-chat">
            <p>No message history. Start a conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.isBot ? 'bot-message' : 'user-message'}`}
            >
              <div className="message-content">
                {!message.isBot && (
                  <div className="message-username">
                    {message.username || username || 'You'}
                  </div>
                )}
                <div className="message-text">{message.text}</div>
                {message.file && (
                  <div className="message-file">
                    {message.file.type.startsWith('image/') ? (
                      <img 
                        src={message.file.data} 
                        alt={message.file.name}
                        className="message-image"
                      />
                    ) : (
                      <a 
                        href={message.file.data} 
                        download={message.file.name}
                        className="file-link"
                      >
                        📎 {message.file.name}
                      </a>
                    )}
                  </div>
                )}
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        {/* File preview always above the form */}
        {selectedFile && (
          <div className="selected-file">
            <span>{selectedFile.name}</span>
            <button type="button" onClick={removeSelectedFile} className="remove-file">
              <CloseIcon />
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="chat-form">
          <input
            type="text"
            className="chat-input"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-input"
          />
          <button 
            type="button"
            className="button attach-button"
            onClick={() => fileInputRef.current?.click()}
          >
            <AttachFileIcon />
          </button>
          <button 
            type="submit"
            className="button"
            disabled={!input.trim() && !selectedFile}
          >
            <SendIcon />
          </button>
        </form>
      </div>

      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 1000px;
          margin: 20px auto;
          border: none;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          background: #07030c;
        }
        
        .chat-header {
          background: linear-gradient(135deg, #a855f7, #7c2ae8);
          color: white;
          padding: 24px 20px;
          text-align: center;
          font-weight: bold;
          font-size: 1.4em;
          letter-spacing: 1.2px;
          box-shadow: 0 4px 12px rgba(168,85,247,0.2);
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        
        .header-icon {
          font-size: 1.6em;
        }
        
        .user-info {
          font-size: 1.1em;
          opacity: 0.95;
          margin-left: 10px;
          background: rgba(255,255,255,0.1);
          padding: 6px 12px;
          border-radius: 20px;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 32px 24px;
          background: #07030c;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .message {
          max-width: 85%;
          padding: 0;
          border-radius: 20px;
          position: relative;
          margin-bottom: 8px;
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .bot-message {
          align-self: flex-start;
          background: #231942;
          color: #fff;
          border-radius: 20px 20px 20px 5px;
          padding: 16px 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .user-message {
          align-self: flex-end;
          background: linear-gradient(135deg, #a855f7, #7c2ae8);
          color: #fff;
          border-radius: 20px 20px 5px 20px;
          padding: 16px 14px;
          box-shadow: 0 4px 12px rgba(168,85,247,0.2);
        }
        
        .message-content {
          display: flex;
          flex-direction: column;
        }
        
        .message-username {
          font-size: 0.9em;
          margin-bottom: 6px;
          font-weight: 600;
          opacity: 0.9;
          color:rgb(29, 29, 29);
          padding-left: 10px;
        }
        
        .message-text {
          font-size: 1.1em;
          line-height: 1.5;
          word-break: break-word;
        }
        
        .message-time {
          font-size: 0.75em;
          align-self: flex-end;
          margin-top: 4px;
          color:rgb(219, 219, 219);
          opacity: 0.7;
          padding-right: 10px;
        }
        
        .chat-input-container {
          padding: 24px;
          background: #07030c;
          border-top: 1px solid rgba(168,85,247,0.1);
        }
        
        .chat-form {
          display: flex;
          gap: 12px;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .chat-input {
          flex: 1;
          padding: 16px 24px;
          border: 2px solid transparent;
          border-radius: 30px;
          outline: none;
          background: #231942;
          color: #fff;
          font-size: 1.1em;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .chat-input:focus {
          border-color: #a855f7;
          box-shadow: 0 0 0 4px rgba(168,85,247,0.15);
        }
        
        .button {
          background: linear-gradient(135deg, #a855f7, #7c2ae8);
          color: white;
          border: none;
          border-radius: 50%;
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(168,85,247,0.2);
        }
        
        .button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(168,85,247,0.3);
        }
        
        .button:disabled {
          background: #231942;
          cursor: not-allowed;
          opacity: 0.7;
        }

        @media (max-width: 768px) {
          .chat-container {
            margin: 0;
            border-radius: 0;
            height: 100vh;
          }
          .chat-header {
            padding: 16px;
            font-size: 1.2em;
          }
          .chat-messages {
            padding: 20px 16px;
            gap: 16px;
          }
          .message {
            max-width: 90%;
          }
          .chat-input-container {
            padding: 16px;
          }
          .chat-form {
            flex-direction: row;
            align-items: stretch;
            gap: 8px;
          }
          .selected-file {
            font-size: 0.85em;
            padding: 4px 8px;
            margin-bottom: 4px;
            max-width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .chat-input {
            flex: 1;
            padding: 18px 14px;
            font-size: 1.1em;
            min-width: 0;
            width: 1%;
            box-sizing: border-box;
          }
          .button {
            width: 44px;
            height: 44px;
            align-self: center;
            flex-shrink: 0;
          }
          .message-image {
            max-width: 100%;
            max-height: 180px;
            height: auto;
            display: block;
            margin-left: auto;
            margin-right: auto;
            object-fit: contain;
          }
        }
        @media (max-width: 480px) {
          .chat-header {
            padding: 12px;
            font-size: 1.1em;
          }
          .user-info {
            font-size: 0.9em;
            padding: 4px 8px;
          }
          .message {
            max-width: 95%;
          }
          .message-text {
            font-size: 1em;
          }
          .chat-input-container {
            padding: 12px;
          }
          .chat-form {
            flex-direction: row;
            align-items: stretch;
            gap: 6px;
          }
          .selected-file {
            font-size: 0.8em;
            padding: 3px 6px;
            margin-bottom: 4px;
            max-width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .chat-input {
            flex: 1;
            padding: 16px 10px;
            font-size: 1em;
            min-width: 0;
            width: 1%;
            box-sizing: border-box;
          }
          .button {
            width: 40px;
            height: 40px;
            align-self: center;
            flex-shrink: 0;
          }
          .message-image {
            max-width: 100%;
            max-height: 120px;
            height: auto;
            display: block;
            margin-left: auto;
            margin-right: auto;
            object-fit: contain;
          }
        }

        .selected-file {
          display: flex;
          align-items: center;
          background: rgba(168,85,247,0.1);
          padding: 8px 12px;
          border-radius: 20px;
          margin-bottom: 8px;
          font-size: 0.9em;
          color: #a855f7;
        }

        .remove-file {
          background: none;
          border: none;
          color: #a855f7;
          cursor: pointer;
          padding: 4px;
          margin-left: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-file:hover {
          color: #7c2ae8;
        }

        .message-image {
          max-width: 100%;
          height: auto;
          max-height: 300px;
          border-radius: 12px;
          margin-top: 8px;
          display: block;
          margin-left: auto;
          margin-right: auto;
          object-fit: contain;
        }

        .message-file {
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(168,85,247,0.1);
          border-radius: 12px;
        }

        .file-link {
          color: #a855f7;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9em;
        }

        .file-link:hover {
          color: #7c2ae8;
        }

        .attach-button {
          background: #231942;
        }

        .attach-button:hover {
          background: #2d1f4a;
        }

        .loading-messages,
        .empty-chat {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #a855f7;
          opacity: 0.7;
          font-size: 1.2em;
          text-align: center;
        }
        
        .loading-spinner {
          border: 4px solid rgba(168, 85, 247, 0.3);
          border-radius: 50%;
          border-top: 4px solid #a855f7;
          width: 40px;
          height: 40px;
          margin-bottom: 20px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ChatInterface; 