import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import SendIcon from '@mui/icons-material/Send';

const socket = io('http://localhost:5000');

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userId] = useState('498486684'); // Your specific userId
  const [username] = useState('John'); // Your specific username
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Send userId and username to server API
    const sendUserData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            username: username
          })
        });
        
        const data = await response.json();
        console.log('User data sent successfully:', data);
      } catch (error) {
        console.error('Error sending user data:', error);
      }
    };

    sendUserData();

    // Load chat history
    fetch('http://localhost:5000/api/chat/history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId
      })
    })
    .then(res => res.json())
    .then(data => {
      setMessages(data.map(msg => ({
        text: msg.content,
        isBot: false,
        timestamp: new Date(msg.timestamp)
      })));
    });

    // Socket event listeners
    socket.on('message', (message) => {
      setMessages(prev => [...prev, {
        text: message.text,
        isBot: true,
        timestamp: new Date(message.timestamp)
      }]);
    });

    return () => {
      socket.off('message');
    };
  }, [userId, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Send message to server
    fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        message: input
      })
    })
    .then(res => res.json())
    .then(data => {
      setMessages(prev => [...prev, 
        {
          text: input,
          isBot: false,
          timestamp: new Date()
        },
        {
          text: data.botResponse,
          isBot: true,
          timestamp: new Date()
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
          <span className="user-info">({username})</span>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.isBot ? 'bot-message' : 'user-message'}`}
          >
            <div className="message-content">
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
    </div>
  );
}

export default ChatInterface; 