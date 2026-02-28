"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const friends_1 = __importDefault(require("./routes/friends"));
const boards_1 = __importDefault(require("./routes/boards"));
const prisma_1 = __importDefault(require("./lib/prisma"));
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
// Proper CORS Configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// API Routes
app.use('/api/friends', friends_1.default);
app.use('/api/boards', boards_1.default);
// Basic Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Express Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});
app.get('/', (req, res) => {
    res.send('Sangam WebSocket Server is Live 🚀');
});
// Single HTTP Server Initialization
const server = http_1.default.createServer(app);
// Socket.io Server Configuration
const io = new socket_io_1.Server(server, {
    cors: corsOptions,
});
// Map to store active user connections (userId -> socketId)
const activeConnections = new Map();
io.on('connection', (socket) => {
    const peerId = socket.id;
    console.log(`[+] User connected: ${peerId}`);
    socket.on('register-user', (userId) => {
        if (userId) {
            socket.data.userId = userId;
            activeConnections.set(userId, socket.id);
            console.log(`[+] User registered: ${userId} -> ${socket.id}`);
        }
    });
    socket.on('join-room', async (data) => {
        // Support both old string payload and new object payload
        const roomId = typeof data === 'string' ? data : data?.roomId;
        const userId = typeof data === 'string' ? null : data?.userId;
        if (!roomId || typeof roomId !== 'string')
            return;
        // Access Control Layer (Phase 5)
        if (userId) {
            try {
                const board = await prisma_1.default.board.findUnique({
                    where: { id: roomId },
                    include: { collaborators: true }
                });
                if (board) {
                    const isOwner = board.ownerId === userId;
                    const isCollaborator = board.collaborators.some(c => c.userId === userId);
                    if (!isOwner && !isCollaborator) {
                        socket.emit('room-error', 'Unauthorized: You do not have permission to view this board.');
                        return; // Reject join entirely
                    }
                }
            }
            catch (err) {
                console.error('Room access error:', err);
            }
        }
        socket.join(roomId);
        console.log(`[R] User ${peerId} (User: ${userId || 'Anon'}) joined room: ${roomId}`);
    });
    socket.on('share-board', (data) => {
        const targetSocketId = activeConnections.get(data.targetUserId);
        if (targetSocketId) {
            io.to(targetSocketId).emit('board-shared', {
                boardId: data.boardId,
                sharedBy: socket.data.userId
            });
        }
    });
    socket.on('send-friend-request', (data) => {
        const targetSocketId = activeConnections.get(data.targetUserId);
        if (targetSocketId) {
            io.to(targetSocketId).emit('friend-request', {
                from: socket.data.userId
            });
        }
    });
    socket.on('draw-line', ({ roomId, data }) => {
        if (!roomId || !data)
            return;
        socket.to(roomId).emit('draw-line', data);
    });
    socket.on('clear', (roomId) => {
        if (!roomId)
            return;
        io.in(roomId).emit('clear');
    });
    socket.on('send-message', ({ roomId, message }) => {
        if (!roomId || !message)
            return;
        socket.to(roomId).emit('receive-message', message);
    });
    socket.on('cursor-move', ({ roomId, username, x, y }) => {
        if (!roomId)
            return;
        socket.to(roomId).emit('cursor-move', {
            username,
            x,
            y,
            socketId: peerId
        });
    });
    // CRDT Operation Handler with Validation & Logging
    socket.on('crdt-operation', ({ roomId, operation }) => {
        try {
            if (!roomId || !operation || !operation.type || !operation.peerId) {
                console.warn(`[!] Malformed CRDT payload from ${peerId}`);
                return;
            }
            // CRDT Broadcast (to all except sender)
            // console.log(`[CRDT] ${operation.type} broadcast from ${peerId} in room ${roomId}`);
            socket.to(roomId).emit('crdt-operation', operation);
        }
        catch (err) {
            console.error(`[!] Error processing CRDT operation from ${peerId}:`, err);
        }
    });
    socket.on('disconnect', (reason) => {
        if (socket.data.userId) {
            activeConnections.delete(socket.data.userId);
        }
        console.log(`[-] User disconnected: ${peerId} | Reason: ${reason}`);
    });
});
// Graceful Shutdown Handling
const gracefulShutdown = () => {
    console.log('Received kill signal, shutting down gracefully.');
    server.close(() => {
        console.log('Closed out remaining connections.');
        process.exit(0);
    });
    // Force close after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
// Start Server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
