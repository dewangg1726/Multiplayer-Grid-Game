const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

const gridSize = 10;
let grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
let players = 0;
let history = [];

// Middleware
app.use(cors());

// API to fetch the initial grid
app.get('/api/grid', (req, res) => {
    res.json(grid);
});

// API to fetch historical updates
app.get('/api/history', (req, res) => {
    res.json(history);
});

// Socket.IO for real-time communication
let lastUpdateGroup = null;

io.on('connection', (socket) => {
    players++;
    io.emit('player-count', players);

    socket.on('disconnect', () => {
        players--;
        io.emit('player-count', players);
    });

    socket.on('update-block', ({ x, y, char }) => {
        if (grid[x][y] === null) {
            grid[x][y] = char;

            // Add the update to a history group
            const now = new Date();
            const timestamp = now.toISOString();

            if (lastUpdateGroup && new Date(lastUpdateGroup.timestamp).getSeconds() === now.getSeconds()) {
                lastUpdateGroup.updates.push({ x, y, char });
            } else {
                lastUpdateGroup = { timestamp, updates: [{ x, y, char }] };
                history.push(lastUpdateGroup);
            }

            // Emit updated grid and history
            io.emit('update-grid', { x, y, char });
            io.emit('update-history', history); // Send grouped history
        }
    });
});


// Start the server
server.listen(5000, () => {
    console.log('Backend running on http://localhost:5000');
});
