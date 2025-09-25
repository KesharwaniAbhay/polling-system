Live Polling System

A real-time polling application built with React, TypeScript, Socket.IO, and Node.js. It allows teachers to create and manage polls, students to submit answers, and both to view poll history in real time.

Features





Teacher Role: Create polls with questions, options, and time limits; manage students; view poll history.



Student Role: Answer polls and view results (votes hidden until poll ends).



Real-Time Updates: Uses Socket.IO for live poll and answer updates.



Poll History: Stored server-side in pollHistory.json and client-side in localStorage for redundancy.



Session Management: Preserves user state, enabling teachers to return to their dashboard from the history page.

Technologies





Frontend: React 18, TypeScript, React Router DOM, Socket.IO Client, Bootstrap 5



Backend: Node.js, Express, Socket.IO



Storage: pollHistory.json, localStorage

Prerequisites





Node.js (v16+): Download



npm (v8+, included with Node.js)



Git: Download



A modern web browser (e.g., Chrome, Firefox)

Installation





Clone the Repository:

git clone https://github.com/<your-username>/live-polling-system.git
cd live-polling-system



Initialize Git (Optional): If you plan to modify and track changes:

git init
git remote add origin https://github.com/<your-username>/live-polling-system.git



Install Server Dependencies:

cd server
npm install express socket.io



Install Client Dependencies:

cd ../client
npm install react react-dom react-router-dom socket.io-client @types/react @types/react-dom @types/react-router-dom bootstrap


Running the Application



Start the Server:

cd server
node index.js

Verify console output:
Server running on http://localhost:3001


Start the Client:
cd ../client
npm start

Client runs on http://localhost:3000 and opens in your browser.

Usage
