import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

import friendsRouter from './routes/friends';
import boardsRouter from './routes/boards';
import prisma from './lib/prisma';

// Basic CRDT Operation Interface for type-safety
interface CRDTOperation {
    type: 'ADD' | 'UPDATE' | 'DELETE';
    id?: string;
    object?: { id: string;[key: string]: any };
    timestamp: number;
    peerId: string;
    [key: string]: any;
}

const app = express();
const port = process.env.PORT || 4000;

// Proper CORS Configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// API Routes
app.use('/api/friends', friendsRouter);
app.use('/api/boards', boardsRouter);

// Basic Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Express Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.get('/', (req: Request, res: Response) => {
    res.send('Sangam WebSocket Server is Live 🚀');
});

// Single HTTP Server Initialization
const server = http.createServer(app);

// Socket.io Server Configuration
const io = new Server(server, {
    cors: corsOptions,
});

// Map to store active user connections (userId -> socketId)
const activeConnections = new Map<string, string>();

io.on('connection', (socket: Socket) => {
    const peerId = socket.id;
    console.log(`[+] User connected: ${peerId}`);

    socket.on('register-user', (userId: string) => {
        if (userId) {
            socket.data.userId = userId;
            activeConnections.set(userId, socket.id);
            console.log(`[+] User registered: ${userId} -> ${socket.id}`);
        }
    });

    socket.on('join-room', async (data: any) => {
        // Support both old string payload and new object payload
        const roomId = typeof data === 'string' ? data : data?.roomId;
        const userId = typeof data === 'string' ? null : data?.userId;

        if (!roomId || typeof roomId !== 'string') return;

        // Access Control Layer (Phase 5)
        if (userId) {
            try {
                const board = await prisma.board.findUnique({
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
            } catch (err) {
                console.error('Room access error:', err);
            }
        }

        socket.join(roomId);
        console.log(`[R] User ${peerId} (User: ${userId || 'Anon'}) joined room: ${roomId}`);
    });

    socket.on('share-board', (data: { targetUserId: string, boardId: string }) => {
        const targetSocketId = activeConnections.get(data.targetUserId);
        if (targetSocketId) {
            io.to(targetSocketId).emit('board-shared', {
                boardId: data.boardId,
                sharedBy: socket.data.userId
            });
        }
    });

    socket.on('send-friend-request', (data: { targetUserId: string }) => {
        const targetSocketId = activeConnections.get(data.targetUserId);
        if (targetSocketId) {
            io.to(targetSocketId).emit('friend-request', {
                from: socket.data.userId
            });
        }
    });

    socket.on('draw-line', ({ roomId, data }: { roomId: string, data: any }) => {
        if (!roomId || !data) return;
        socket.to(roomId).emit('draw-line', data);
    });

    socket.on('clear', (roomId: string) => {
        if (!roomId) return;
        io.in(roomId).emit('clear');
    });

    socket.on('sync-canvas', ({ roomId, state }: { roomId: string, state: string }) => {
        if (!roomId || !state) return;
        socket.to(roomId).emit('sync-canvas', state);
    });

    socket.on('send-message', ({ roomId, message }: { roomId: string, message: any }) => {
        if (!roomId || !message) return;
        socket.to(roomId).emit('receive-message', message);
    });

    socket.on('cursor-move', ({ roomId, username, x, y }: { roomId: string, username: string, x: number, y: number }) => {
        if (!roomId) return;
        socket.to(roomId).emit('cursor-move', {
            username,
            x,
            y,
            socketId: peerId
        });
    });

    // CRDT Operation Handler with Validation & Logging
    socket.on('crdt-operation', ({ roomId, operation }: { roomId: string, operation: CRDTOperation }) => {
        try {
            if (!roomId || !operation || !operation.type || !operation.peerId) {
                console.warn(`[!] Malformed CRDT payload from ${peerId}`);
                return;
            }

            // CRDT Broadcast (to all except sender)
            // console.log(`[CRDT] ${operation.type} broadcast from ${peerId} in room ${roomId}`);
            socket.to(roomId).emit('crdt-operation', operation);

        } catch (err) {
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