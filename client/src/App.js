import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Paper, TextField, IconButton, Avatar, ThemeProvider, createTheme } from '@mui/material';
import { Send as SendIcon, SmartToy as BotIcon, Person as UserIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

const socket = io('http://localhost:5000');

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [sessionId] = useState(() => {
    // Get existing sessionId from localStorage or create new one
    const existingSessionId = localStorage.getItem('chatSessionId');
    if (existingSessionId) return existingSessionId;
    
    const newSessionId = uuidv4();
    localStorage.setItem('chatSessionId', newSessionId);
    return newSessionId;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Join the session when component mounts
    socket.emit('join', sessionId);

    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('message');
    };
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      const message = {
        text: inputMessage,
        sender: 'user',
        timestamp: new Date().toISOString(),
        sessionId: sessionId
      };
      socket.emit('sendMessage', message);
      setMessages((prevMessages) => [...prevMessages, message]);
      setInputMessage('');
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);

      try {
        const response = await fetch('http://localhost:5002/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('File upload failed');
        }

        const data = await response.json();
        setMessages((prevMessages) => [...prevMessages, data.message]);
      } catch (error) {
        console.error('Error uploading file:', error);
        // Show error message to user
        const errorMessage = {
          text: 'Failed to upload file. Please try again.',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          sessionId: sessionId
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current.click();
  };

  const renderMessage = (message, index) => {
    const isUser = message.sender === 'user';
    return (
      <Box
        key={index}
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 2,
          animation: 'fadeIn 0.3s ease-in-out'
        }}
      >
        {!isUser && (
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              mr: 1
            }}
          >
            <BotIcon />
          </Avatar>
        )}
        <Box
          sx={{
            maxWidth: '70%',
            backgroundColor: isUser ? 'primary.main' : 'grey.100',
            color: isUser ? 'white' : 'text.primary',
            borderRadius: 2,
            p: 2,
            position: 'relative'
          }}
        >
          <Typography variant="body1">{message.text}</Typography>
          {message.file && (
            <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ display: 'block' }}>
                File: {message.file.name}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Size: {(message.file.size / 1024).toFixed(2)} KB
              </Typography>
            </Box>
          )}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'right',
              mt: 1,
              opacity: 0.7
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>
        {isUser && (
          <Avatar
            sx={{
              bgcolor: 'secondary.main',
              ml: 1
            }}
          >
            <UserIcon />
          </Avatar>
        )}
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          py: 4
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={3}
            sx={{
              height: '90vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              overflow: 'hidden',
              background: 'white'
            }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 2,
                background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <BotIcon sx={{ fontSize: 32 }} />
              <Typography variant="h5" component="h1">
                Customer Service Chat
              </Typography>
            </Box>

            {/* Messages Area */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                background: '#f8f9fa'
              }}
            >
              {messages.map((message, index) => renderMessage(message, index))}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box
              component="form"
              onSubmit={sendMessage}
              sx={{
                p: 2,
                backgroundColor: 'white',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                gap: 1
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <IconButton
                onClick={handleFileUpload}
                color="primary"
                sx={{
                  bgcolor: 'primary.light',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.main'
                  }
                }}
              >
                <AttachFileIcon />
              </IconButton>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <IconButton
                type="submit"
                color="primary"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App; 