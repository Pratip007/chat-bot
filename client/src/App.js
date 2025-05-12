import React from 'react';
import ChatInterface from './components/ChatInterface';

function App() {
  return <ChatInterface />;
}

const userData = {
    userId: "498486649",
    username: "user1"
};

// Store the data in sessionStorage
sessionStorage.setItem("userData", JSON.stringify(userData));

// To verify it's stored, you can retrieve and log it:
const storedData = JSON.parse(sessionStorage.getItem("userData"));
console.log(storedData);


export default App;
