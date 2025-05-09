import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import io from 'socket.io-client';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const socket = io('http://localhost:5000');

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(uuidv4());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load chat history
    fetch(`http://localhost:5000/api/chat/history/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        setMessages(data.map(msg => ({
          text: msg.message,
          isBot: false,
          timestamp: new Date(msg.timestamp)
        })).concat(data.map(msg => ({
          text: msg.response,
          isBot: true,
          timestamp: new Date(msg.timestamp)
        })).sort((a, b) => a.timestamp - b.timestamp));
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
    <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6">Customer Service Chat</Typography>
      </Box>
      
      <List sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}>
        {messages.map((message, index) => (
          <ListItem
            key={index}
            sx={{
              justifyContent: message.isBot ? 'flex-start' : 'flex-end',
              px: 1
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 1,
                maxWidth: '70%',
                bgcolor: message.isBot ? 'grey.100' : 'primary.light',
                color: message.isBot ? 'text.primary' : 'white',
                borderRadius: 2
              }}
            >
              <ListItemText primary={message.text} />
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {message.timestamp.toLocaleTimeString()}
              </Typography>
            </Paper>
          </ListItem>
        ))}
        <div ref={messagesEndRef} />
      </List>

      <Divider />
      
      <Box
        component="form"
        onSubmit={handleSend}
        sx={{
          p: 2,
          display: 'flex',
          gap: 1
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          size="small"
        />
        <IconButton 
          color="primary" 
          type="submit"
          disabled={!input.trim()}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}

export default ChatInterface; 