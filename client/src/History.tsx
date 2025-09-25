import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Socket } from 'socket.io-client';

interface Poll {
  id: string;
  question: string;
  options: string[];
  answers: { [key: string]: number };
  answeredBy: string[];
  studentAnswers: { [studentName: string]: string };
  timeLimit: number;
}

interface HistoryProps {
  socket: Socket;
}

const History: React.FC<HistoryProps> = ({ socket }) => {
  const [history, setHistory] = useState<Poll[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Determine the back route based on user role
  const getBackRoute = () => {
    const teacherName = sessionStorage.getItem('teacherName');
    const studentName = sessionStorage.getItem('studentName');
    if (teacherName) return '/teacher';
    if (studentName) return '/student';
    return '/';
  };

  useEffect(() => {
    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
      console.log('Reconnecting socket for history');
    }

    // Handle socket connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to server. Showing local history if available.');
      const localHistory = JSON.parse(localStorage.getItem('live_polls_history_v1') || '[]');
      console.log('Falling back to localStorage history:', localHistory);
      setHistory(localHistory);
    });

    // Request history from server on mount
    console.log('Requesting poll history from server');
    socket.emit('getPollHistory');

    // Listen for history updates
    socket.on('pollHistory', (pollHistory: Poll[]) => {
      console.log('Received poll history:', pollHistory);
      setError(null);
      if (pollHistory.length === 0) {
        const localHistory = JSON.parse(localStorage.getItem('live_polls_history_v1') || '[]');
        console.log('Falling back to localStorage history:', localHistory);
        setHistory(localHistory);
      } else {
        setHistory(pollHistory);
      }
    });

    return () => {
      socket.off('pollHistory');
      socket.off('connect_error');
    };
  }, [socket]);

  return (
    <div className="card p-4">
      <div className="d-flex justify-content-between">
        <h2>View Poll History</h2>
        <Link to={getBackRoute()} className="btn btn-primary" aria-label="Back to previous page">
          Back
        </Link>
      </div>
      {error && <div className="alert alert-warning">{error}</div>}
      {history.length === 0 ? (
        <p>No polls found.</p>
      ) : (
        history.map((poll) => (
          <div key={poll.id} className="card mb-3">
            <div className="card-header">{poll.question || 'Unnamed Poll'}</div>
            <div className="card-body">
              <p>Time Limit: {poll.timeLimit || 'N/A'} seconds</p>
              <h5>Options and Votes:</h5>
              <ul>
                {Array.isArray(poll.options) ? (
                  poll.options.map((opt, index) => (
                    <li key={index}>
                      {opt}: {(poll.answers && poll.answers[opt]) || 0} votes
                    </li>
                  ))
                ) : (
                  <li>No options available</li>
                )}
              </ul>
              <h5>Student Answers:</h5>
              <ul>
                {Object.entries(poll.studentAnswers || {}).length > 0 ? (
                  Object.entries(poll.studentAnswers).map(([studentName, answer]) => (
                    <li key={studentName}>
                      {studentName.split(':')[0]} selected: {answer}
                    </li>
                  ))
                ) : (
                  <li>No answers recorded</li>
                )}
              </ul>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default History;