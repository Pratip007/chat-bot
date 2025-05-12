import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import SendIcon from '@mui/icons-material/Send';

const socket = io('http://localhost:5000');

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    if (userData.userId) {
      setUserId(userData.userId);
      console.log('UserId from sessionStorage:', userData.userId);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Get latest userId from sessionStorage in case it was updated
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const currentUserId = userData.userId || userId;
    const currentUsername = userData.username || username;
    
    console.log('Current username:', currentUsername);
    
    const requestData = {
      userId: currentUserId,
      message: input
    };
    
    console.log('Sending message request:', requestData);

    // Send message to server
    fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    })
    .then(res => res.json())
    .then(data => {
      console.log('Server response:', data);
      setMessages(prev => [...prev, 
        {
          text: input,
          isBot: false,
          timestamp: new Date(),
          username: currentUsername
        },
        {
          text: data.botResponse,
          isBot: true,
          timestamp: new Date(),
          username: 'Bot'
        }
      ]);
    })
    .catch(error => {
      console.error('Error sending message:', error);
    });

    setInput('');
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
        {messages.map((message, index) => (
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
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSend} className="chat-form">
          <input
            type="text"
            className="chat-input"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit"
            className="button"
            disabled={!input.trim()}
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
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .chat-header {
          background: #2979ff;
          color: white;
          padding: 15px;
          text-align: center;
          font-weight: bold;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .header-icon {
          font-size: 1.2em;
        }
        
        .user-info {
          font-size: 0.9em;
          opacity: 0.9;
          margin-left: 8px;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f5f5f5;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .message {
          max-width: 80%;
          padding: 10px 15px;
          border-radius: 18px;
          position: relative;
          margin-bottom: 5px;
        }
        
        .bot-message {
          align-self: flex-start;
          background: white;
          border: 1px solid #e0e0e0;
          border-bottom-left-radius: 5px;
        }
        
        .user-message {
          align-self: flex-end;
          background: #2979ff;
          color: white;
          border-bottom-right-radius: 5px;
        }
        
        .message-content {
          display: flex;
          flex-direction: column;
        }
        
        .message-username {
          font-size: 0.75em;
          margin-bottom: 4px;
          font-weight: bold;
          opacity: 0.8;
        }
        
        .message-time {
          font-size: 0.7em;
          align-self: flex-end;
          margin-top: 5px;
          opacity: 0.7;
        }
        
        .chat-input-container {
          padding: 15px;
          background: white;
          border-top: 1px solid #eee;
        }
        
        .chat-form {
          display: flex;
          gap: 10px;
        }
        
        .chat-input {
          flex: 1;
          padding: 12px 15px;
          border: 1px solid #ddd;
          border-radius: 25px;
          outline: none;
          transition: border 0.3s;
        }
        
        .chat-input:focus {
          border-color: #2979ff;
        }
        
        .button {
          background: #2979ff;
          color: white;
          border: none;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.3s;
        }
        
        .button:hover:not(:disabled) {
          background: #1c54b2;
        }
        
        .button:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default ChatInterface; 