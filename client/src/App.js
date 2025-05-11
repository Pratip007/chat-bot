import React, { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Paper, TextField, IconButton, Avatar, ThemeProvider, createTheme } from '@mui/material';
import { Send as SendIcon, SmartToy as BotIcon, Person as UserIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#a855f7',
      light: '#c084fc',
      dark: '#7e22ce',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#0a0a0a',
      paper: '#141414',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a3a3a3',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

const socket = io('http://localhost:5000');

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [setSelectedFile] = useState(null);
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
      console.log('SOCKET MESSAGE:', message);
      setMessages((prevMessages) => [...prevMessages, { ...message, timestamp: new Date() }]);
    });

    socket.on('join', (sessionId) => {
      socket.join(sessionId);
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
        sessionId: sessionId,
        sender: 'user'
      };
      socket.emit('sendMessage', message);
      setMessages((prevMessages) => [...prevMessages, { ...message, timestamp: new Date() }]);
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
        data.sender = 'bot';
        setMessages((prevMessages) => [...prevMessages, { ...data.message, timestamp: new Date() }]);
      } catch (error) {
        console.error('Error uploading file:', error);
        // Show error message to user
        const errorMessage = {
          text: 'Failed to upload file. Please try again.',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          sessionId: sessionId
        };
        errorMessage.sender = 'bot';
        setMessages((prevMessages) => [...prevMessages, { ...errorMessage, timestamp: new Date() }]);
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
          <Typography variant="body1">{message.text || '[No message]'}</Typography>
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
          background: 'linear-gradient(135deg, #0a0a0a 0%, #141414 100%)',
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
              background: 'rgba(20, 20, 20, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
            }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 2,
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(192, 132, 252, 0.1))',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderBottom: '1px solid rgba(168, 85, 247, 0.2)',
              }}
            >
              <BotIcon sx={{ fontSize: 32, color: '#a855f7' }} />
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
                background: 'transparent',
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
                backgroundColor: 'rgba(20, 20, 20, 0.95)',
                borderTop: '1px solid rgba(168, 85, 247, 0.2)',
                display: 'flex',
                gap: 1,
                backdropFilter: 'blur(10px)',
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
                sx={{
                  bgcolor: 'rgba(168, 85, 247, 0.1)',
                  color: '#a855f7',
                  '&:hover': {
                    bgcolor: 'rgba(168, 85, 247, 0.2)',
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
                    borderRadius: 2,
                    backgroundColor: 'rgba(26, 26, 26, 0.8)',
                    '& fieldset': {
                      borderColor: 'rgba(168, 85, 247, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(168, 85, 247, 0.4)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#a855f7',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                  },
                }}
              />
              <IconButton
                type="submit"
                sx={{
                  bgcolor: '#a855f7',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#7e22ce',
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
