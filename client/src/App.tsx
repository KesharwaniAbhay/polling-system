import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import Welcome from './Welcome';
import Student from './Student';
import Teacher from './Teacher';
import History from './History';

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001', { reconnection: true });
    setSocket(newSocket);
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    return () => {
      newSocket.disconnect();
    };
  }, []);

  if (!socket) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/student" element={<Student socket={socket} />} />
        <Route path="/teacher" element={<Teacher socket={socket} />} />
        <Route path="/history" element={<History socket={socket} />} />
      </Routes>
    </Router>
  );
};

export default App;