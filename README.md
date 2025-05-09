# Customer Service Chatbot

step-1 (npm install in every folder)
npm run install:all
step-2 (start three server)



A real-time chatbot application for customer service with an admin panel, built with Node.js, Express, React, Angular, and MongoDB.

## Project Structure

```
chat-bot/
├── client/                 # React frontend (Customer Chat Interface)
│   ├── src/
│   │   ├── components/    # React components
│   │   └── App.js         # Main App component
├── admin-panel/           # Angular admin panel
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # Angular components
│   │   │   └── services/    # Angular services
│   │   └── assets/         # Static assets
├── server/                # Backend server
│   ├── controllers/       # API controllers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   └── server.js         # Main server file
└── package.json          # Root package.json
```

## Features

- Real-time chat using Socket.IO
- Message history persistence
- Modern Material-UI interface for customer chat
- Angular Material admin panel
- Dashboard with analytics
- Chat history management
- User management
- MVC architecture
- Session-based chat history

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or a MongoDB Atlas account)
- npm or yarn
- Angular CLI (`npm install -g @angular/cli`)

## Setup

1. Clone the repository
2. Install all dependencies:
   ```bash
   npm run install:all
   ```

3. Create a `.env` file in the server directory with the following content:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chatbot
   JWT_SECRET=your_jwt_secret_here
   ```

## Running the Application

1. Start MongoDB service on your machine

2. Start all services (server, client, and admin panel):
   ```bash
   npm run dev
   ```

   Or start them individually:
   ```bash
   # Start server
   npm run start:server

   # Start client (customer chat)
   npm run start:client

   # Start admin panel
   npm run start:admin
   ```

3. Access the applications:
   - Customer Chat: http://localhost:3000
   - Admin Panel: http://localhost:4200

## Technologies Used

- Backend:
  - Node.js
  - Express
  - Socket.IO
  - MongoDB
  - Mongoose
  - JWT Authentication

- Customer Frontend (React):
  - React
  - Material-UI
  - Socket.IO Client
  - UUID

- Admin Panel (Angular):
  - Angular
  - Angular Material
  - Chart.js
  - Socket.IO Client

## Contributing

