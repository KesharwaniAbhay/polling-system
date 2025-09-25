import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Socket } from 'socket.io-client';

// Generate a unique session ID for the teacher
const generateSessionId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

interface TeacherProps {
  socket: Socket;
}

interface User {
  name: string;
  sessionId: string;
}

const Teacher: React.FC<TeacherProps> = ({ socket }) => {
  const [name, setName] = useState<string>(sessionStorage.getItem('teacherName') || '');
  const [sessionId] = useState<string>(generateSessionId());
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [timeLimit, setTimeLimit] = useState(30);
  const [users, setUsers] = useState<User[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isJoined, setIsJoined] = useState<boolean>(!!sessionStorage.getItem('teacherName'));

  // Initialize socket events
  useEffect(() => {
    socket.on('userList', (userList: User[]) => {
      setUsers(userList);
    });

    return () => {
      socket.off('userList');
    };
  }, [socket]);

  const submitName = () => {
    if (name.trim()) {
      sessionStorage.setItem('teacherName', name);
      socket.emit('join', { name, role: 'teacher', sessionId });
      setIsJoined(true);
    } else {
      alert('Please enter a valid name');
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const startPoll = () => {
    if (!name.trim()) {
      alert('Please enter your name first');
      return;
    }
    if (!question) {
      alert('Please enter a question');
      return;
    }
    const validOptions = options.filter((opt) => opt.trim() !== '');
    if (validOptions.length < 2) {
      alert('Please provide at least two options');
      return;
    }

    const poll = {
      id: Date.now().toString(),
      question,
      options: validOptions,
      timeLimit,
      answers: {},
      answeredBy: [],
      studentAnswers: {},
    };

    console.log('Starting poll:', poll);
    socket.emit('pollStarted', poll);

    const history = JSON.parse(localStorage.getItem('live_polls_history_v1') || '[]');
    history.push(poll);
    localStorage.setItem('live_polls_history_v1', JSON.stringify(history));

    setQuestion('');
    setOptions(['', '', '', '']);
    setTimeLimit(30);

    setTimeout(() => {
      console.log('Ending poll:', poll.id);
      socket.emit('pollEnded', { pollId: poll.id });
    }, timeLimit * 1000);
  };

  const kickUser = (sessionId: string) => {
    socket.emit('kickStudent', { sessionId });
    setUsers((prev) => prev.filter((u) => u.sessionId !== sessionId));
  };

  if (!isJoined) {
    return (
      <div className="card p-4">
        <h2>Welcome, Teacher</h2>
        <p>Enter your name to start creating polls.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitName();
          }}
        >
          <input
            className="form-control mb-2"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Teacher name input"
          />
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            Continue
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="d-flex justify-content-between mb-3">
        <h2>Create Poll</h2>
        <div>
          <button onClick={() => setShowParticipants(true)} className="btn btn-info me-2">
            Students List ({users.length})
          </button>
          <Link to="/history" className="btn btn-primary">
            History
          </Link>
        </div>
      </div>
      <input
        className="form-control mb-2"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Enter question"
        aria-label="Poll question input"
      />
      <div className="row mb-2">
        {options.map((opt, index) => (
          <div key={index} className="col-12 mb-1">
            <input
              className="form-control"
              value={opt}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              aria-label={`Poll option ${index + 1} input`}
            />
          </div>
        ))}
      </div>
      <select
        className="form-select mb-2"
        value={timeLimit}
        onChange={(e) => setTimeLimit(parseInt(e.target.value))}
        aria-label="Poll time limit select"
      >
        <option value={30}>30 seconds</option>
        <option value={45}>45 seconds</option>
        <option value={60}>60 seconds</option>
        <option value={90}>90 seconds</option>
      </select>
      <button className="btn btn-primary mb-3" onClick={startPoll}>
        Ask Question
      </button>

      {showParticipants && (
        <div className="participants-overlay">
          <div className="overlay-content">
            <h3>Students List</h3>
            <ul className="list-group">
              {users.length === 0 ? (
                <li className="list-group-item text-center">No students joined yet</li>
              ) : (
                users.map((user) => (
                  <li key={user.sessionId} className="list-group-item d-flex justify-content-between align-items-center">
                    <span>{user.name}</span>
                    <button
                      onClick={() => kickUser(user.sessionId)}
                      className="btn btn-danger btn-sm"
                      aria-label={`Kick student ${user.name}`}
                    >
                      Kick Out
                    </button>
                  </li>
                ))
              )}
            </ul>
            <button
              onClick={() => setShowParticipants(false)}
              className="btn btn-secondary mt-2 w-100"
              aria-label="Close students list"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teacher;