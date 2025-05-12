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
          padding: 16px 20px;
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
          color:rgb(49, 49, 49);
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
          
          .chat-input {
            padding: 14px 20px;
            font-size: 1em;
          }
          
          .button {
            width: 48px;
            height: 48px;
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
        }
      `}</style>
    </div>
  );
}

export default ChatInterface; 