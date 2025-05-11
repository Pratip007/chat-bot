import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import io from 'socket.io-client';
import SendIcon from '@mui/icons-material/Send';

const socket = io('http://localhost:5000');

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(uuidv4());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load chat history
    fetch(`http://localhost:5002/api/chat/history/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        const userMessages = data.map(msg => ({
          text: msg.message,
          isBot: false,
          timestamp: new Date(msg.timestamp)
        }));
        const botMessages = data.map(msg => ({
          text: msg.response,
          isBot: true,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages([...userMessages, ...botMessages].sort((a, b) => a.timestamp - b.timestamp));
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
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const message = {
      text: input,
      sessionId,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, {
      text: input,
      isBot: false,
      timestamp: new Date()
    }]);

    socket.emit('sendMessage', message);
    setInput('');
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-content">
          <span className="header-icon">💬</span>
          Customer Service Chat
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