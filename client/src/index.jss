import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import Teacher from './Teacher';
import Student from './Student';
import History from './History';

const socket = io('http://localhost:3001');

const App: React.FC = () => {
  const [role, setRole] = useState<string | null>(null);

  return (
    <Router>
      <div className="container mt-3">
        <h1 style={{ marginBottom: 6 }}>
          Welcome to <b>Live Polling System</b>
        </h1>
        <Routes>
          <Route
            path="/"
            element={
              <div className="card p-4">
                <h2>Choose Your Role</h2>
                <Link to="/teacher" className="btn btn-primary me-2" onClick={() => setRole('teacher')}>
                  Teacher
                </Link>
                <Link to="/student" className="btn btn-secondary" onClick={() => setRole('student')}>
                  Student
                </Link>
              </div>
            }
          />
          <Route path="/teacher" element={<Teacher socket={socket} />} />
          <Route path="/student" element={<Student socket={socket} />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;