const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Store polls, participants, and history
const polls = new Map();
const participants = new Map();
let pollHistory = [];
const chatMessages = [];

// Load poll history from file on server start
try {
  pollHistory = JSON.parse(fs.readFileSync('pollHistory.json', 'utf8'));
  console.log('Loaded poll history from file:', pollHistory);
} catch (error) {
  console.log('No existing poll history found, starting fresh');
}

// Save poll history to file
const savePollHistory = () => {
  try {
    fs.writeFileSync('pollHistory.json', JSON.stringify(pollHistory, null, 2));
    console.log('Poll history saved to file');
  } catch (error) {
    console.error('Error saving poll history:', error);
  }
};

// Broadcast user list to teachers
const broadcastUserList = () => {
  const userList = Array.from(participants.entries())
    .filter(([, { role }]) => role === 'student')
    .map(([, { name, sessionId }]) => ({ name, sessionId }));
  io.to('teachers').emit('userList', userList);
};

// Broadcast poll history to clients
const broadcastPollHistory = () => {
  console.log('Broadcasting poll history:', pollHistory);
  io.emit('pollHistory', pollHistory);
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle client joining
  socket.on('join', ({ name, role, sessionId }) => {
    try {
      if (!name || !sessionId || !role) {
        console.error('Invalid join data:', { name, role, sessionId });
        return;
      }
      if (participants.has(sessionId)) {
        console.log(`Session ${sessionId} already exists, updating socket`);
      }
      participants.set(sessionId, { name, socketId: socket.id, role });
      if (role === 'teacher') {
        socket.join('teachers');
      }
      console.log(`${role} joined: ${name} (${sessionId})`);
      if (role === 'student') {
        broadcastUserList();
      }
      // Send poll history to new client
      socket.emit('pollHistory', pollHistory);
    } catch (error) {
      console.error('Error in join event:', error);
    }
  });

  // Start a new poll
  socket.on('pollStarted', (poll) => {
    try {
      if (!poll.id || !poll.question || !poll.options || !poll.timeLimit) {
        console.error('Invalid poll data:', poll);
        return;
      }
      polls.set(poll.id, {
        ...poll,
        answers: poll.answers || {},
        answeredBy: poll.answeredBy || [],
        studentAnswers: poll.studentAnswers || {},
      });
      console.log('Poll started:', poll);
      io.emit('pollStarted', poll);
    } catch (error) {
      console.error('Error in pollStarted event:', error);
    }
  });

  // Handle answer submission
  socket.on('answerSubmitted', ({ pollId, answer, studentName }) => {
    try {
      const poll = polls.get(pollId);
      if (poll && !poll.answeredBy.includes(studentName)) {
        poll.answeredBy.push(studentName);
        poll.answers[answer] = (poll.answers[answer] || 0) + 1;
        poll.studentAnswers = poll.studentAnswers || {};
        poll.studentAnswers[studentName] = answer;
        console.log('Answer submitted:', { pollId, answer, studentName });
        io.emit('answerSubmitted', { pollId, answer, studentName });
      }
    } catch (error) {
      console.error('Error in answerSubmitted event:', error);
    }
  });

  // End a poll
  socket.on('pollEnded', ({ pollId }) => {
    try {
      if (polls.has(pollId)) {
        const poll = polls.get(pollId);
        console.log('Ending poll:', pollId, 'Poll data:', poll);
        pollHistory.push(poll);
        savePollHistory();
        io.emit('pollEnded', { pollId });
        polls.delete(pollId);
        broadcastPollHistory();
      } else {
        console.log('Poll not found:', pollId);
      }
    } catch (error) {
      console.error('Error in pollEnded event:', error);
    }
  });

  // Handle poll history request
  socket.on('getPollHistory', () => {
    try {
      console.log('Sending poll history to client:', pollHistory);
      socket.emit('pollHistory', pollHistory);
    } catch (error) {
      console.error('Error in getPollHistory event:', error);
    }
  });

  // Handle chat messages
  socket.on('chatMessage', (data) => {
    try {
      if (!data.message) {
        console.error('Invalid chat message:', data);
        return;
      }
      const message = { user: data.user || 'Anonymous', message: data.message };
      chatMessages.push(message);
      io.emit('chatMessage', message);
    } catch (error) {
      console.error('Error in chatMessage event:', error);
    }
  });

  // Kick a specific student
  socket.on('kickStudent', ({ sessionId }) => {
    try {
      if (participants.has(sessionId)) {
        io.to(participants.get(sessionId).socketId).emit('kicked', { sessionId });
        participants.delete(sessionId);
        broadcastUserList();
      }
    } catch (error) {
      console.error('Error in kickStudent event:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    try {
      console.log('Client disconnected:', socket.id);
      for (const [sessionId, participant] of participants.entries()) {
        if (participant.socketId === socket.id) {
          participants.delete(sessionId);
          if (participant.role === 'student') {
            broadcastUserList();
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error in disconnect event:', error);
    }
  });
});

// Global error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

server.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});