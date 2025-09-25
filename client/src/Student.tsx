import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Socket } from 'socket.io-client';

// Generate a unique session ID for each tab
const generateSessionId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Define TypeScript interfaces for type safety
interface Poll {
  id: string;
  question: string;
  options: string[];
  answers: { [key: string]: number };
  answeredBy: string[];
  timeLimit: number;
}

interface StudentProps {
  socket: Socket;
}

const Student: React.FC<StudentProps> = ({ socket }) => {
  const [name, setName] = useState<string>(sessionStorage.getItem('studentName') || '');
  const [sessionId] = useState<string>(generateSessionId());
  const [polls, setPolls] = useState<Poll[]>([]);
  const [kicked, setKicked] = useState<boolean>(false);
  const [selectedOptions, setSelectedOptions] = useState<{ [pollId: string]: string }>({});
  const [timers, setTimers] = useState<{ [pollId: string]: number }>({});
  const [isJoined, setIsJoined] = useState<boolean>(!!sessionStorage.getItem('studentName'));

  // Initialize socket events
  useEffect(() => {
    socket.on('pollStarted', (poll: Poll) => {
      setPolls((prev) => [...prev, { ...poll, answers: poll.answers || {}, answeredBy: poll.answeredBy || [] }]);
      setTimers((prev) => ({ ...prev, [poll.id]: poll.timeLimit }));
    });

    socket.on('answerSubmitted', ({ pollId, answer, studentName }: { pollId: string; answer: string; studentName: string }) => {
      setPolls((prev) =>
        prev.map((p) =>
          p.id === pollId
            ? {
                ...p,
                answers: { ...p.answers, [answer]: (p.answers[answer] || 0) + 1 },
                answeredBy: [...p.answeredBy, studentName],
              }
            : p
        )
      );
    });

    socket.on('pollEnded', ({ pollId }: { pollId: string }) => {
      setPolls((prev) => prev.filter((p) => p.id !== pollId));
      setTimers((prev) => {
        const { [pollId]: _, ...rest } = prev;
        return rest;
      });
    });

    socket.on('kicked', ({ sessionId: kickedSessionId }: { sessionId: string }) => {
      if (kickedSessionId === sessionId) {
        setKicked(true);
        sessionStorage.removeItem('studentName');
      }
    });

    return () => {
      socket.off('pollStarted');
      socket.off('answerSubmitted');
      socket.off('pollEnded');
      socket.off('kicked');
    };
  }, [socket, sessionId]);

  // Manage timers for all polls
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updatedTimers: { [pollId: string]: number } = {};
        Object.entries(prev).forEach(([pollId, timeLeft]) => {
          if (timeLeft > 0) {
            updatedTimers[pollId] = timeLeft - 1;
          } else {
            socket.emit('pollEnded', { pollId });
          }
        });
        return updatedTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [socket]);

  const submitName = () => {
    if (name.trim()) {
      sessionStorage.setItem('studentName', name);
      socket.emit('join', { name, role: 'student', sessionId });
      setIsJoined(true);
    } else {
      alert('Please enter a valid name');
    }
  };

  const submitAnswer = (pollId: string, selectedOption: string) => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!selectedOption) {
      alert('Please select an option');
      return;
    }
    const poll = polls.find((p) => p.id === pollId);
    if (!poll) return;
    const uniqueStudentId = `${name}:${sessionId}`;
    if (poll.answeredBy.includes(uniqueStudentId)) {
      alert('You have already answered this poll');
      return;
    }

    socket.emit('answerSubmitted', {
      pollId,
      answer: selectedOption,
      studentName: uniqueStudentId,
    });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (kicked) {
    return (
      <div className="card p-4">
        <h2>You've Been Kicked Out!</h2>
        <p>Looks like the teacher has removed you from the poll system. Please try again later.</p>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="card p-4">
        <h2>Let's Get Started</h2>
        <p>Enter your name to participate in live polls and see how your responses compare with your classmates.</p>
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
            aria-label="Student name input"
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
      {polls.length === 0 ? (
        <p>Waiting for the teacher to start a new poll.</p>
      ) : (
        polls.map((poll) => {
          const totalVotes = poll.answeredBy.length;
          const timeLeft = timers[poll.id] ?? 0;

          return (
            <div key={poll.id} className="mb-5">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span>{poll.question}</span>
                <span className="badge bg-secondary">{timeLeft > 0 ? formatTime(timeLeft) : 'Ended'}</span>
              </div>
              <div className="mb-3">
                {poll.options.map((opt, index) => {
                  const votes = poll.answers[opt] || 0;
                  const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                  return (
                    <button
                      key={index}
                      className={`btn btn-outline-primary mb-2 w-100 poll-option ${
                        selectedOptions[poll.id] === opt ? 'active' : ''
                      }`}
                      onClick={() => setSelectedOptions((prev) => ({ ...prev, [poll.id]: opt }))}
                      disabled={poll.answeredBy.includes(`${name}:${sessionId}`) || timeLeft <= 0}
                      style={{ background: `linear-gradient(to right, #4F0DCE ${percentage}%, transparent ${percentage}%)` }}
                      aria-label={`Select option ${opt}`}
                    >
                      <div className="d-flex justify-content-between">
                        <span>{opt}</span>
                        {poll.answeredBy.includes(`${name}:${sessionId}`) && (
                          <span className="badge bg-success">Answered</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                className="btn btn-primary mb-3 w-100"
                onClick={() => submitAnswer(poll.id, selectedOptions[poll.id] || '')}
                disabled={!selectedOptions[poll.id] || poll.answeredBy.includes(`${name}:${sessionId}`) || timeLeft <= 0}
                aria-label="Submit answer"
              >
                Submit Answer
              </button>
            </div>
          );
        })
      )}
      <Link to="/" className="btn btn-secondary mt-3 w-100">
        Back to Role Selection
      </Link>
    </div>
  );
};

export default Student;